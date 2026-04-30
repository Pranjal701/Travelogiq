import Itinerary from "../models/itinerary.js";
import fetch from "node-fetch";


const handleItineraryDetails = async (req, res)=>{
    try {
        const image_number = Math.floor(Math.random()*5)+1;
        const { destination, to, from, budget, group , interest, pacing} = req.body;
        
        const user_id = req.user.user_id;
        
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
            console.log("Failed to fetch photoRef in handleItineraryDetails:", e.message);
        }
        
        await Itinerary.create({
            user_id: user_id,
            destination: destination,
            startDate: to,
            endDate: from,
            budget: budget,
            group: group,
            interest: interest,
            pacing: pacing,
            image_number: image_number,
            photoRef: photoRef
        })
        
        return res.status(200).json({message: 'Details Saved'});
    } catch (error) {
        console.log("Error in handleItineraryDetails function at backend");
        return res.json({message: 'Error at backend'});
    }
}

export default handleItineraryDetails;