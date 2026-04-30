import Itinerary from "../models/itinerary.js";


const handleDeleteItinerary = async (req, res) => {
  await Itinerary.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
}

export default handleDeleteItinerary;