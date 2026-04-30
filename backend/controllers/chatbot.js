import { GoogleGenerativeAI } from "@google/generative-ai";
import Itinerary from "../models/itinerary.js";
import fetch from "node-fetch";

// Lazy-init to ensure dotenv has loaded
let _genAI = null;
function getGenAI() {
    if (!_genAI) _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    return _genAI;
}

// Fetch weather data for chatbot context
async function fetchWeatherForChat(destination) {
    // Try the destination as-is first, then try extracting just the city part
    const candidates = [destination];
    // If destination contains comma, try first part (city name)
    if (destination.includes(',')) {
        candidates.push(destination.split(',')[0].trim());
    }
    // Strip common non-city suffixes like "Trek", "Pass", "Valley", "Lake" etc.
    const stripped = destination.replace(/\b(trek|pass|valley|lake|glacier|peak|fort|temple|beach|falls|waterfall|national park|sanctuary|reserve)\b/gi, '').trim();
    if (stripped && stripped !== destination) candidates.push(stripped);

    for (const query of candidates) {
        try {
            const url = "https://api.openweathermap.org/data/2.5/forecast";
            const params = new URLSearchParams({
                q: query,
                appid: process.env.WEATHER_API_KEY,
                units: "metric",
            }).toString();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 5000);
            const weatherResponse = await fetch(`${url}?${params}`, { signal: controller.signal });
            clearTimeout(timer);
            const data = await weatherResponse.json();
            if (data.cod && String(data.cod) === "200") {
                console.log(`[CHATBOT WEATHER] Found weather for "${query}"`);
                return data;
            }
        } catch (e) {
            // Try next candidate
        }
    }
    console.log(`[CHATBOT WEATHER] No weather data found for "${destination}"`);
    return null;
}

function buildWeatherSummary(weatherData, startDate, endDate) {
    if (!weatherData || !weatherData.list) return "";
    const dailyMap = {};
    weatherData.list.forEach(item => {
        const date = item.dt_txt.split(" ")[0];
        if (!dailyMap[date]) dailyMap[date] = { temps: [], conditions: [] };
        dailyMap[date].temps.push(item.main.temp);
        dailyMap[date].conditions.push(item.weather[0].main);
    });
    const lines = [];
    let current = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (current && end) {
        while (current <= end) {
            const dateStr = current.toISOString().split("T")[0];
            const d = dailyMap[dateStr];
            if (d && d.temps.length > 0) {
                const min = Math.round(Math.min(...d.temps));
                const max = Math.round(Math.max(...d.temps));
                const condCount = {};
                d.conditions.forEach(c => { condCount[c] = (condCount[c] || 0) + 1; });
                const dominant = Object.entries(condCount).sort((a, b) => b[1] - a[1])[0][0];
                lines.push(`${dateStr}: ${dominant}, ${min}-${max}°C`);
            }
            current.setDate(current.getDate() + 1);
        }
    } else {
        // No specific dates, just show next few days
        const dates = Object.keys(dailyMap).sort().slice(0, 5);
        dates.forEach(dateStr => {
            const d = dailyMap[dateStr];
            const min = Math.round(Math.min(...d.temps));
            const max = Math.round(Math.max(...d.temps));
            const condCount = {};
            d.conditions.forEach(c => { condCount[c] = (condCount[c] || 0) + 1; });
            const dominant = Object.entries(condCount).sort((a, b) => b[1] - a[1])[0][0];
            lines.push(`${dateStr}: ${dominant}, ${min}-${max}°C`);
        });
    }
    return lines.length > 0 ? "\nWEATHER FORECAST DATA:\n" + lines.join("\n") : "";
}

const SYSTEM_PROMPT = `You are a friendly, enthusiastic travel planning assistant called TraveloGIQ AI. Your job is to help users plan their perfect trip through a natural conversation.

You need to collect the following information to create an itinerary. Extract what you can from the user's messages and ask for what's missing:

REQUIRED FIELDS:
1. **destination** — The travel destination. If the user describes a vague idea (e.g., "snow adventure", "beach vacation", "honeymoon"), suggest 3-4 specific INDIAN destinations with brief descriptions and ask them to pick one. IMPORTANT: ALWAYS suggest destinations within India by default unless the user explicitly mentions an international location or says they want to travel abroad. India has incredible diversity — snow (Gulmarg, Manali, Auli), beaches (Goa, Andaman, Pondicherry), heritage (Jaipur, Hampi, Varanasi), hill stations (Munnar, Ooty, Shimla), adventure (Rishikesh, Ladakh, Spiti Valley), etc. Only suggest international destinations if the user specifically asks for them. Always use the city/place name.
2. **startDate** — Trip start date (YYYY-MM-DD format). If they say "5 days in December", pick logical dates (e.g., Dec 10-14). If they say "next month", estimate from today.
3. **endDate** — Trip end date (YYYY-MM-DD format).
4. **budget** — One of: "cheap", "moderate", "luxury". If they say things like "budget trip" → cheap, "decent/average" → moderate, "money is not an issue" → luxury.
5. **group** — One of: "justMe", "couple", "family", "friends". Infer from context (e.g., "with my girlfriend" → couple, "with buddies" → friends).
6. **pacing** — One of: "Relaxed", "Moderate", "High-paced". Infer from context (e.g., "packed schedule" → High-paced, "chill vacation" → Relaxed).

OPTIONAL FIELDS:
7. **interests** — Array of interests from: "Historical & Cultural Sites", "Adventure & Outdoor Activities", "Shopping & Local Markets", "Nightlife & Entertainment", "Nature & Scenic Views", "Relaxation & Wellness", "Beaches", "City Sightseeing". Infer from context.
8. **notes** — Any special requirements or notes.

CONVERSATION RULES:
- Be concise and warm. Use emojis sparingly but effectively.
- When suggesting destinations, format them as a numbered list with brief descriptions.
- Ask ONE question at a time to avoid overwhelming the user.
- If the user provides multiple details at once, acknowledge all of them.
- After collecting destination, ask about dates. Then budget. Then pacing. Interests can be inferred.
- IMPORTANT: After you have all 6 required fields (destination, startDate, endDate, budget, group, pacing), you MUST ask the user: "Any special notes or requirements for your trip? (e.g., dietary restrictions, accessibility needs, must-visit places, or anything else!)" with suggestedOptions like ["No, looks perfect! ✅", "Yes, I have some notes"]. Only set complete:true AFTER the user responds to this notes question.
- If the user asks about weather during their travel dates, ALWAYS use the WEATHER FORECAST DATA provided in the context. This data is REAL and LIVE from our weather API — present it confidently as actual forecast data. NEVER say "I don't have real-time weather data" — you DO have it when it's provided in the context.
- When you finally have everything including the notes response, present a summary and set complete:true and showSummary:true.

RESPONSE FORMAT:
You MUST respond with valid JSON only (no markdown, no backticks). Use this exact format:

{
  "message": "Your conversational response text here",
  "suggestedOptions": ["Option 1", "Option 2", "Option 3"],
  "extracted": {
    "destination": null,
    "startDate": null,
    "endDate": null,
    "budget": null,
    "group": null,
    "pacing": null,
    "interests": [],
    "notes": null
  },
  "complete": false,
  "showSummary": false
}

RULES FOR extracted FIELDS:
- Set a field ONLY when you are confident about the value from the conversation. Use null for unknown fields.
- "interests" should be an array (empty array if none identified yet).
- Do NOT set "complete": true until you have asked the user about notes/special requirements AND they have responded.
- Set "showSummary": true when complete is true.
- "suggestedOptions" should contain clickable options when you're offering choices (destination suggestions, budget options, etc.). Leave as empty array when not offering choices.
- ALWAYS include ALL previously extracted fields in every response. Never reset a field to null once it's been set.
- If the user says "no notes" or "looks perfect" or similar, set notes to "None" and then set complete:true.
- Today's date is: ${new Date().toISOString().split('T')[0]}

Return ONLY the JSON object. No other text.`;

const handleChat = async (req, res) => {
    try {
        const { message, conversationHistory = [], extracted = {} } = req.body;
        const user_id = req.user.user_id;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const model = getGenAI().getGenerativeModel({ model: "gemini-2.5-flash" });

        // Build conversation context with previously extracted data
        let contextMessage = Object.values(extracted).some(v => v !== null && (Array.isArray(v) ? v.length > 0 : true))
            ? `\n\nPREVIOUSLY EXTRACTED DATA (carry these forward, do not reset): ${JSON.stringify(extracted)}`
            : '';

        // Fetch weather data if destination is known (for weather queries and context)
        if (extracted.destination) {
            try {
                const weatherData = await fetchWeatherForChat(extracted.destination);
                if (weatherData) {
                    const weatherSummary = buildWeatherSummary(weatherData, extracted.startDate, extracted.endDate);
                    if (weatherSummary) {
                        contextMessage += `\n\n[SYSTEM NOTE: The following is REAL-TIME weather data fetched from our API for ${extracted.destination}. Use this data when the user asks about weather. Present it as actual data — DO NOT say you don't have weather information.]${weatherSummary}`;
                    }
                } else {
                    contextMessage += `\n\n[SYSTEM NOTE: Weather API could not find data for "${extracted.destination}". If user asks about weather, mention that the forecast is not available for this specific location but suggest checking weather for the nearest major city.]`;
                }
            } catch (e) {
                console.log("Weather context fetch failed:", e.message);
            }
        }

        // Build chat history for Gemini
        const contents = [];

        // Add conversation history
        for (const entry of conversationHistory) {
            contents.push({
                role: entry.role === 'user' ? 'user' : 'model',
                parts: [{ text: entry.content }]
            });
        }

        // Add current user message
        contents.push({
            role: 'user',
            parts: [{ text: message + contextMessage }]
        });

        const result = await model.generateContent({
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
                responseMimeType: "application/json",
                thinkingConfig: { thinkingBudget: 1024 },
            }
        });

        let responseText = result.response.text();

        // Parse the JSON response
        let parsed;
        try {
            // Clean potential markdown wrapping
            let cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsed = JSON.parse(cleaned);
        } catch (e) {
            console.log("Chat JSON parse failed, attempting repair:", e.message);
            try {
                const jsonMatch = responseText.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                }
            } catch (e2) {
                // JSON repair also failed
            }
            // If still no parsed result, create fallback from raw text
            if (!parsed) {
                const cleanText = responseText.replace(/[{}"\[\]]/g, '').replace(/\\n/g, ' ').trim();
                parsed = {
                    message: cleanText || "I'd love to help you plan your trip! Could you tell me more?",
                    suggestedOptions: [],
                    extracted: extracted || {},
                    complete: false,
                    showSummary: false
                };
            }
        }

        // Ensure extracted always has all fields
        const safeExtracted = {
            destination: null,
            startDate: null,
            endDate: null,
            budget: null,
            group: null,
            pacing: null,
            interests: [],
            notes: null,
            ...extracted, // Keep previous values
            ...(parsed.extracted || {}) // Override with new extractions
        };

        // Don't let Gemini accidentally reset fields
        for (const key of Object.keys(extracted)) {
            if (extracted[key] !== null && (safeExtracted[key] === null || safeExtracted[key] === undefined)) {
                safeExtracted[key] = extracted[key];
            }
            if (key === 'interests' && Array.isArray(extracted[key]) && extracted[key].length > 0 && (!safeExtracted[key] || safeExtracted[key].length === 0)) {
                safeExtracted[key] = extracted[key];
            }
        }

        // Clean the message — strip any leaked JSON/extracted data
        let cleanMessage = parsed.message || "I'd love to help plan your trip!";
        // Remove any raw JSON objects that leaked into the message text
        cleanMessage = cleanMessage.replace(/\n\s*extracted:\s*\{[\s\S]*?\}\s*/gi, '').trim();
        cleanMessage = cleanMessage.replace(/\n\s*(destination|startDate|endDate|budget|group|pacing|interests|notes|complete|showSummary):\s*.*/gi, '').trim();

        res.json({
            message: cleanMessage,
            suggestedOptions: parsed.suggestedOptions || [],
            extracted: safeExtracted,
            complete: parsed.complete || false,
            showSummary: parsed.showSummary || false
        });

    } catch (error) {
        console.log("Chat error:", error.message);
        res.status(500).json({ error: "Failed to process chat message" });
    }
};

// Save chatbot-collected details to DB (same as handleItineraryDetails)
const saveChatDetails = async (req, res) => {
    try {
        const { destination, startDate, endDate, budget, group, interests, pacing, notes } = req.body;
        const user_id = req.user.user_id;
        const image_number = Math.floor(Math.random() * 5) + 1;

        // Fetch photo for card display
        let photoRef = null;
        try {
            const placesKey = process.env.GOOGLE_PLACES_API_KEY;
            const body = { textQuery: destination + " tourist attractions", maxResultCount: 1 };
            const headers = {
                "Content-Type": "application/json",
                "X-Goog-Api-Key": placesKey,
                "X-Goog-FieldMask": "places.photos"
            };
            const fetchRes = await fetch("https://places.googleapis.com/v1/places:searchText", {
                method: "POST", headers, body: JSON.stringify(body)
            });
            const data = await fetchRes.json();
            if (data.places && data.places.length > 0 && data.places[0].photos && data.places[0].photos.length > 0) {
                photoRef = data.places[0].photos[0].name;
            }
        } catch (e) {
            console.log("Failed to fetch photoRef in saveChatDetails:", e.message);
        }

        await Itinerary.create({
            user_id,
            destination,
            startDate,
            endDate,
            budget,
            group,
            interest: interests || [],
            pacing,
            image_number,
            photoRef
        });

        return res.status(200).json({ message: 'Details Saved' });
    } catch (error) {
        console.log("Error in saveChatDetails:", error.message);
        return res.status(500).json({ message: 'Error saving details' });
    }
};

export { handleChat, saveChatDetails };
