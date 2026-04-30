import Itinerary from "../models/itinerary.js";


const getUserItineraries = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        
        const itineraries = await Itinerary.find({user_id: user_id});
        
        return res.json(itineraries)
    } catch (error) {
        console.log("Error in getUserItineraries function at backend");
        return res.json([]);
    }
}

export default getUserItineraries