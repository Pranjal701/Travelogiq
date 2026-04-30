import Itinerary from "../models/itinerary.js";

const handleRegenerateItinerary = async (req, res) => {
    try {
        const user_id = req.user.user_id;
        const itinerary_id = req.params.id;
        const { instructions } = req.body;

        // Find the existing itinerary
        const oldItinerary = await Itinerary.findOne({ _id: itinerary_id, user_id: user_id });

        if (!oldItinerary) {
            return res.status(404).json({ error: "Itinerary not found" });
        }

        let newDestination = oldItinerary.destination;
        const versionMatch = newDestination.match(/\(Regenerated (\d+)\)$/);
        
        if (versionMatch) {
            const currentVersion = parseInt(versionMatch[1]);
            newDestination = newDestination.replace(/\(Regenerated \d+\)$/, `(Regenerated ${currentVersion + 1})`);
        } else {
            newDestination = `${newDestination} (Regenerated 1)`;
        }

        // Duplicate the itinerary with null generatedData
        const newItinerary = await Itinerary.create({
            user_id: user_id,
            destination: newDestination,
            startDate: oldItinerary.startDate,
            endDate: oldItinerary.endDate,
            budget: oldItinerary.budget,
            group: oldItinerary.group,
            interest: oldItinerary.interest,
            pacing: oldItinerary.pacing,
            image_number: oldItinerary.image_number,
            photoRef: oldItinerary.photoRef,
            regenerationInstructions: instructions || null,
            generatedData: null // Explicitly null to force fresh generation
        });

        res.json({ success: true, newId: newItinerary._id });
    } catch (error) {
        console.log("Error in handleRegenerateItinerary:", error.message);
        res.status(500).json({ error: error.message });
    }
}

export default handleRegenerateItinerary;
