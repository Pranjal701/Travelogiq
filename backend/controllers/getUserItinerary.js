import Itinerary from "../models/itinerary.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

// ──── CONSTANTS ────

const PACING_INSTRUCTIONS = {
    "Relaxed": "1-2 activities per time slot, plenty of free time, late starts (9-10 AM), long lunches, end by 6 PM. Maximum 4-5 activities per day.",
    "Moderate": "2-3 activities per time slot, balanced schedule, start at 8-9 AM, efficient routing, end by 8 PM. Around 6-8 activities per day.",
    "High-paced": "3-4 activities per time slot, packed schedule, early starts (7-8 AM), maximize attractions, minimal downtime, end by 10 PM. Around 10-12 activities per day."
};

// ──── IN-MEMORY PLACES CACHE (1 hour TTL) ────
const placesCache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

function getCachedPlaces(key) {
    const entry = placesCache.get(key);
    if (entry && Date.now() - entry.time < CACHE_TTL) return entry.data;
    placesCache.delete(key);
    return null;
}

function setCachedPlaces(key, data) {
    placesCache.set(key, { data, time: Date.now() });
    // Evict old entries if cache grows too large
    if (placesCache.size > 200) {
        const oldest = placesCache.keys().next().value;
        placesCache.delete(oldest);
    }
}

// ──── FETCH WITH TIMEOUT ────
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { ...options, signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

// ──── CLEAN DESTINATION NAME ────
function cleanDestinationName(rawDestination) {
    if (!rawDestination) return rawDestination;
    
    // Strip out (Regenerated X) label so it doesn't break map searches
    let scrubbed = rawDestination.replace(/\s*\(Regenerated \d+\)$/i, '').trim();
    
    const parts = scrubbed.split(',').map(p => p.trim());
    const poiKeywords = ['bus stand', 'station', 'airport', 'market', 'mall', 'temple', 'hotel', 'road', 'highway', 'junction'];
    const cityLike = parts.find(p => {
        const words = p.split(/\s+/);
        return words.length <= 3 && !poiKeywords.some(k => p.toLowerCase().includes(k));
    });
    return cityLike || parts[0];
}


const getUserItinerary = async (req, res) => {
    try {
        const startTime = Date.now();
        const user_id = req.user.user_id;
        const itinerary_id = req.params.id;

        let itinerary_details = '';

        if (itinerary_id) itinerary_details = await Itinerary.findOne({ _id: itinerary_id, user_id: user_id });
        else itinerary_details = await Itinerary.findOne({ user_id: user_id }).sort({ createdAt: -1 });

        if (!itinerary_details) {
            return res.status(404).json({ message: "Itinerary not found" });
        }

        if (itinerary_details.generatedData) {
            console.log(`[ITINERARY] Loaded cached generation for ID: ${itinerary_details._id}`);
            return res.json(itinerary_details.generatedData);
        }

        const { destination: rawDestination, startDate, endDate, budget, group, interest, pacing, regenerationInstructions } = itinerary_details;

        const destination = cleanDestinationName(rawDestination);
        console.log(`[ITINERARY] Raw: "${rawDestination}" -> Clean: "${destination}"`);

        const numDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;

        // ──── FETCH WEATHER + GEMINI IN PARALLEL ────
        // Weather fetch runs concurrently with Gemini setup & call

        const weatherPromise = (async () => {
            try {
                const url = "https://api.openweathermap.org/data/2.5/forecast";
                const query = new URLSearchParams({
                    q: destination,
                    appid: process.env.WEATHER_API_KEY,
                    units: "metric",
                }).toString();

                const weatherResponse = await fetchWithTimeout(`${url}?${query}`, {}, 5000);
                const data = await weatherResponse.json();

                if (data.cod && String(data.cod) !== "200") {
                    console.log("Weather API error:", data.cod, data.message);
                    return { list: [] };
                }
                return data;
            } catch (e) {
                console.log("Weather fetch failed:", e.message);
                return { list: [] };
            }
        })();

        // Start Gemini setup immediately (non-blocking)
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const pacingGuide = PACING_INSTRUCTIONS[pacing] || PACING_INSTRUCTIONS["Moderate"];
        const interestsStr = Array.isArray(interest) ? interest.join(", ") : interest;

        // Wait for weather to build prompt
        const weatherDataFromAPI = await weatherPromise;

        const weatherData = {
            destination: destination,
            startDate: startDate,
            endDate: endDate,
            weatherForecast: weatherDataFromAPI,
        };

        // ──── BUILD PER-DAY WEATHER SUMMARY ────
        let dailyWeatherMap = {};
        if (weatherDataFromAPI && weatherDataFromAPI.list) {
            weatherDataFromAPI.list.forEach(item => {
                const date = item.dt_txt.split(" ")[0];
                if (!dailyWeatherMap[date]) {
                    dailyWeatherMap[date] = { temps: [], conditions: [], descriptions: [], humidities: [] };
                }
                dailyWeatherMap[date].temps.push(item.main.temp);
                dailyWeatherMap[date].conditions.push(item.weather[0].main);
                dailyWeatherMap[date].descriptions.push(item.weather[0].description);
                dailyWeatherMap[date].humidities.push(item.main.humidity);
            });
        }

        const weatherPerDay = [];
        let currentDate = new Date(startDate);
        const endDateObj = new Date(endDate);

        while (currentDate <= endDateObj) {
            const dateStr = currentDate.toISOString().split("T")[0];
            const dayData = dailyWeatherMap[dateStr];

            if (dayData && dayData.temps.length > 0) {
                const avgTemp = Math.round(dayData.temps.reduce((a, b) => a + b, 0) / dayData.temps.length);
                const minTemp = Math.round(Math.min(...dayData.temps));
                const maxTemp = Math.round(Math.max(...dayData.temps));
                const condCount = {};
                dayData.conditions.forEach(c => { condCount[c] = (condCount[c] || 0) + 1; });
                const dominantCondition = Object.entries(condCount).sort((a, b) => b[1] - a[1])[0][0];
                const avgHumidity = Math.round(dayData.humidities.reduce((a, b) => a + b, 0) / dayData.humidities.length);

                weatherPerDay.push({
                    date: dateStr,
                    condition: dominantCondition,
                    minTemp, maxTemp, avgTemp, avgHumidity
                });
            } else {
                weatherPerDay.push({
                    date: dateStr,
                    condition: "Unknown",
                    minTemp: null, maxTemp: null, avgTemp: null, avgHumidity: null
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        const weatherSummaryForPrompt = weatherPerDay.map((w, i) =>
            `Day ${i + 1} (${w.date}): ${w.condition}${w.minTemp !== null ? `, ${w.minTemp}-${w.maxTemp} C, humidity ${w.avgHumidity}%` : ", forecast unavailable"}`
        ).join("\n");

        console.log(`[TIMING] Weather fetched in ${Date.now() - startTime}ms`);

        // ──── GEMINI AI CALL ────
        const geminiStart = Date.now();

        let instructionsBlock = "";
        if (regenerationInstructions) {
            console.log(`[ITINERARY] Applying Custom Instructions: "${regenerationInstructions}"`);
            instructionsBlock = `\n================================\nCRITICAL USER REGENERATION INSTRUCTIONS:\nThe user has explicitly requested the following changes for this new itinerary iteration:\n"${regenerationInstructions}"\nYOU MUST ABSOLUTELY OBEY THESE INSTRUCTIONS. If they conflict with any rules above, the USER INSTRUCTIONS override the rules.\n================================\n`;
        } else if (rawDestination.includes("(Regenerated")) {
            console.log(`[ITINERARY] Regenerating with empty instructions, applying shuffle prompt.`);
            instructionsBlock = `\n================================\nCRITICAL USER REGENERATION INSTRUCTIONS:\nThe user has clicked "Regenerate" but provided no specific instructions. You MUST provide a FRESH, DIFFERENT variation of the itinerary. Shuffle activities, suggest different viewpoints or restaurants, or change the daily sequence so it doesn't look identical to the previous one.\n================================\n`;
        }

        const itineraryPrompt = `You are an expert travel planner specializing in creating realistic, logistically sound itineraries. Create a weather-aware itinerary for "${destination}" as JSON.

TRIP: ${destination} | ${startDate} to ${endDate} (${numDays} days) | Budget: ${budget} | Group: ${group} | Interests: ${interestsStr} | Pacing: ${pacing} (${pacingGuide})
WEATHER:
${weatherSummaryForPrompt}

CRITICAL REQUIREMENT: You MUST ALWAYS STRICTLY follow ALL RULES listed below without exception.

RULES:
1. MULTI-HUB ROUTING: For trips of 4+ days to small/medium cities, you MUST add 1-2 nearby famous cities/towns (within 150km) as secondary hubs to create a regional circuit. Give the main destination the majority of days. For major metropolitan cities, you may keep single-hub for up to 5 days. ALWAYS populate "secondaryHubs" and "hubRouting" arrays when using multiple hubs. Think about what nearby destinations are famous and logistically reachable within a few hours by road.
2. WEATHER ADAPTATION: Rain/Drizzle → indoor activities ONLY. Clear/Sunny → prioritize outdoor. Cloudy → balanced mix. Mark each activity "indoor" or "outdoor" in the type field.
3. HUB ROUTING DATA: When using multiple hubs, populate "hubRouting" with REAL distances in km, travel duration, and transport mode (bus/car/train/auto). hubRouting must be [] ONLY if the entire trip stays in one area.
4. PERSONALIZATION: cheap → street food, hostels, free attractions. moderate → mid-range restaurants, 3-star hotels, popular spots. luxury → fine dining, 5-star, exclusive experiences. Adapt activities to group type (family=kid-friendly, couple=romantic, friends=adventure, solo=cultural).
5. ACTIVITY NAMING: The "activity" field MUST contain the SPECIFIC REAL place name (e.g., "Hadimba Temple Visit" not "Temple Visit"). NEVER use generic titles.
6. LOGICAL SCHEDULING: Activities in the same time slot must be geographically close. Do NOT schedule places on opposite sides of the city in the same slot. Plan routes that minimize travel between activities.
7. Use ONLY real, verifiable, currently existing places in/near "${destination}".

Return ONLY valid JSON matching this schema:
{"tripOverview":{"mainHub":"","secondaryHubs":[],"hubRouting":[{"from":"","to":"","distance":"","duration":"","mode":""}],"totalDays":${numDays},"tripSummary":""},"days":[{"dayNumber":1,"date":"","hub":"","weatherCondition":"","temperature":"","timeSlots":{"morning":[{"activity":"","place":"","type":"","duration":"","description":""}],"afternoon":[],"evening":[]}}],"localGuide":{"mustTryDishes":[],"whereToEat":[],"localClothing":[],"shoppingSpots":[],"souvenirs":[]},"explorePlaces":[{"name":"","description":"","culturalImportance":"","bestTimeToVisit":"","mustKnow":"","category":""}]}

8-12 explorePlaces. All activity fields required. ONLY raw JSON, no markdown.
${instructionsBlock}`;

        // ──── RUN GEMINI CALL (With Retries) ────
        let megaJSON = null;
        let retryCount = 0;
        let rawText = "";

        while (!megaJSON && retryCount < 2) {
            const geminiStart = Date.now();
            try {
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: itineraryPrompt }] }],
                    generationConfig: {
                        responseMimeType: "application/json",
                        maxOutputTokens: 8192,
                        temperature: 0.4,
                        thinkingConfig: { thinkingBudget: 1024 },
                    }
                });

                console.log(`[TIMING] Gemini responded in ${Date.now() - geminiStart}ms`);
                rawText = result.response.text();
                let cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                megaJSON = JSON.parse(cleaned);
            } catch (e) {
                console.log(`Failed to parse mega JSON (Attempt ${retryCount + 1}):`, e.message);
                try {
                    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        megaJSON = JSON.parse(jsonMatch[0]);
                        console.log("JSON repair successful!");
                    }
                } catch (e2) {
                    console.log("JSON repair also failed.");
                }
            }
            retryCount++;
            if (!megaJSON && retryCount < 2) console.log("Retrying Gemini request due to invalid JSON...");
        }

        if (!megaJSON) {
            throw new Error("Failed to generate valid itinerary structure after retries.");
        }

        const itineraryJSON = megaJSON ? { tripOverview: megaJSON.tripOverview, days: megaJSON.days } : null;
        const localGuide = megaJSON?.localGuide || { mustTryDishes: [], whereToEat: [], localClothing: [], shoppingSpots: [], souvenirs: [] };
        const explorePlaces = megaJSON?.explorePlaces ? { places: megaJSON.explorePlaces } : { places: [] };


        // ──── GOOGLE PLACES API — ALL IN PARALLEL (with caching + limits) ────
        const placesStart = Date.now();
        const placesKey = process.env.GOOGLE_PLACES_API_KEY;

        // Gather all hubs for multi-hub hotel search
        const hubsToSearch = new Set([destination]);
        if (itineraryJSON && itineraryJSON.tripOverview && itineraryJSON.tripOverview.secondaryHubs) {
            itineraryJSON.tripOverview.secondaryHubs.forEach(hub => hubsToSearch.add(hub));
        }
        const activeHubs = Array.from(hubsToSearch);

        // ──── RUN ALL PLACES API CALLS IN PARALLEL ────
        const [hotelsArrays, placePhotos, explorePlacesWithPhotos] = await Promise.all([
            Promise.all(activeHubs.map(hub => fetchHotels(hub, placesKey))),
            fetchPlacePhotos(destination, placesKey),
            fetchExplorePlacePhotos((explorePlaces?.places || []).slice(0, 10), destination, placesKey)
        ]);

        const hotels = hotelsArrays.flat();

        console.log(`[TIMING] All Places API calls completed in ${Date.now() - placesStart}ms`);

        console.log(`[TIMING] Total request time: ${Date.now() - startTime}ms`);
        console.log("[DEBUG] Results - placePhotos:", placePhotos.length, "| hotels:", hotels.length, "| explorePlaces:", explorePlacesWithPhotos.length);

        const finalData = {
            success: true,
            id: itinerary_details._id,
            itinerary: itineraryJSON,
            weatherData,
            weatherPerDay,
            localGuide,
            placePhotos,
            hotels,
            explorePlaces: { places: explorePlacesWithPhotos }
        };

        // Save generated data permanently
        await Itinerary.findByIdAndUpdate(itinerary_details._id, {
            generatedData: finalData
        });

        res.json(finalData);
    } catch (error) {
        console.log("Error in getUserItinerary:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
}

// ──── NEW PLACES API (v1) helper — WITH CACHING ────
async function searchPlacesNewAPI(query, placesKey, includedType = null) {
    // Check cache first
    const cacheKey = `${query}|${includedType || ''}`;
    const cached = getCachedPlaces(cacheKey);
    if (cached) {
        console.log(`[CACHE HIT] ${query}`);
        return cached;
    }

    try {
        const body = {
            textQuery: query,
            maxResultCount: 10,
        };
        if (includedType) {
            body.includedType = includedType;
        }

        const headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": placesKey,
            "X-Goog-FieldMask": "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.photos,places.priceLevel,places.id"
        };

        const res = await fetchWithTimeout("https://places.googleapis.com/v1/places:searchText", {
            method: "POST",
            headers,
            body: JSON.stringify(body)
        }, 5000);
        const data = await res.json();

        if (data.error) {
            console.log("[DEBUG] New Places API error:", data.error.message);
            return null;
        }

        const result = data.places || [];
        setCachedPlaces(cacheKey, result);
        return result;
    } catch (e) {
        console.log("[DEBUG] New Places API fetch error:", e.message);
        return null;
    }
}

// ──── Convert new API photo to a usable photo name ────
function getPhotoNameFromNewAPI(place) {
    if (place.photos && place.photos.length > 0) {
        return place.photos[0].name;
    }
    return null;
}

// ──── HELPER: Fetch tourist attraction photos ────
async function fetchPlacePhotos(destination, placesKey) {
    try {
        const results = await searchPlacesNewAPI(destination + " tourist attractions", placesKey);

        if (results && results.length > 0) {
            return results
                .filter(p => p.photos && p.photos.length > 0)
                .slice(0, 8)
                .map(p => ({
                    name: p.displayName?.text || "",
                    photoRef: getPhotoNameFromNewAPI(p),
                    rating: p.rating || null,
                    address: p.formattedAddress || "",
                    isNewAPI: true
                }));
        }
    } catch (e) {
        console.log("Failed to fetch place photos:", e.message);
    }
    return [];
}

// ──── HELPER: Fetch hotels ────
async function fetchHotels(destination, placesKey) {
    try {
        const results = await searchPlacesNewAPI("hotels in " + destination, placesKey, "hotel");

        if (results && results.length > 0) {
            const PRICE_MAP = { "PRICE_LEVEL_FREE": 0, "PRICE_LEVEL_INEXPENSIVE": 1, "PRICE_LEVEL_MODERATE": 2, "PRICE_LEVEL_EXPENSIVE": 3, "PRICE_LEVEL_VERY_EXPENSIVE": 4 };
            return results
                .filter(h => h.displayName?.text)
                .slice(0, 12)
                .map(h => ({
                    name: h.displayName?.text || "",
                    address: h.formattedAddress || "",
                    rating: h.rating || 0,
                    userRatingsTotal: h.userRatingCount || 0,
                    priceLevel: PRICE_MAP[h.priceLevel] ?? null,
                    photoRef: getPhotoNameFromNewAPI(h),
                    businessStatus: "OPERATIONAL",
                    placeId: h.id || "",
                    isNewAPI: true
                }));
        }
    } catch (e) {
        console.log("Failed to fetch hotels:", e.message);
    }
    return [];
}

// ──── HELPER: Fetch photos for explore/historical places ────
async function fetchExplorePlacePhotos(places, destination, placesKey) {
    if (!places || places.length === 0) return [];

    try {
        const photoPromises = places.map(async (place) => {
            try {
                const results = await searchPlacesNewAPI(place.name + " " + destination, placesKey);

                if (results && results.length > 0) {
                    const top = results[0];
                    return {
                        ...place,
                        photoRef: getPhotoNameFromNewAPI(top),
                        rating: top.rating || null,
                        address: top.formattedAddress || "",
                        userRatingsTotal: top.userRatingCount || 0,
                        isNewAPI: true
                    };
                }

                return { ...place, photoRef: null, rating: null, address: "", userRatingsTotal: 0 };
            } catch (e) {
                return { ...place, photoRef: null, rating: null, address: "", userRatingsTotal: 0 };
            }
        });

        return await Promise.all(photoPromises);
    } catch (e) {
        console.log("Failed to fetch explore place photos:", e.message);
        return places.map(p => ({ ...p, photoRef: null, rating: null, address: "", userRatingsTotal: 0 }));
    }
}

// ──── HELPER: Fetch photos for itinerary activity places ────
async function fetchItineraryPlacePhotos(placeNames, destination, placesKey) {
    if (!placeNames || placeNames.length === 0) return [];

    try {
        const photoPromises = placeNames.map(async (placeName) => {
            try {
                const results = await searchPlacesNewAPI(placeName + " " + destination, placesKey);

                if (results && results.length > 0) {
                    const top = results[0];
                    return {
                        name: placeName,
                        photoRef: getPhotoNameFromNewAPI(top),
                        isNewAPI: true
                    };
                }

                return { name: placeName, photoRef: null, isNewAPI: false };
            } catch (e) {
                return { name: placeName, photoRef: null, isNewAPI: false };
            }
        });

        return await Promise.all(photoPromises);
    } catch (e) {
        console.log("Failed to fetch itinerary place photos:", e.message);
        return placeNames.map(n => ({ name: n, photoRef: null, isNewAPI: false }));
    }
}

export default getUserItinerary;