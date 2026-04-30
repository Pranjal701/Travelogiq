import express from "express"
import fetch from "node-fetch"
import cors from "cors"
import dotenv from "dotenv"
import cookieParser from "cookie-parser";
import handleSignUP from "./controllers/handleSignUP.js";
import verifySession from "./middlewares/verifySession.js";
import handleLogin from "./controllers/handleLogin.js";
import connectDB from "./db_connection/connectDB.js";
import handleItineraryDetails from "./controllers/handleItineraryDetails.js";
import getUserItineraries from "./controllers/getUserItineraries.js";
import handleDeleteItinerary from "./controllers/handleDeleteItinerary.js";
import getUserItinerary from "./controllers/getUserItinerary.js";
import handleRegenerateItinerary from "./controllers/handleRegenerateItinerary.js";
import { handleChat, saveChatDetails } from "./controllers/chatbot.js";


dotenv.config();

connectDB();
const app = express();
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))
app.use(cookieParser());



app.post('/signUP', handleSignUP);
app.post('/login', handleLogin);

app.get('/session_check', verifySession, (req, res) => {
    return res.json({ message: 'Valid Token' });
});

app.post('/save_details', verifySession, handleItineraryDetails);

app.get('/getUserItineraries', verifySession, getUserItineraries);

app.post('/logout', (req, res) => {
    res.clearCookie("token_v1", {
        httpOnly: true,
        sameSite: "lax",
        secure: false
    });

    return res.status(200).json({ message: "Logged out" });
})

app.delete("/delete_itinerary/:id", verifySession, handleDeleteItinerary);


app.post('/chat', verifySession, handleChat);
app.post('/save_chat_details', verifySession, saveChatDetails);

app.get("/createItinerary", verifySession, getUserItinerary);
app.get("/createItinerary/:id", verifySession, getUserItinerary);
app.post("/regenerateItinerary/:id", verifySession, handleRegenerateItinerary);

// ──── PHOTO PROXY (supports both new and legacy Places API) ────
app.get("/place-photo", async (req, res) => {
    try {
        const { ref } = req.query;
        if (!ref) return res.status(400).json({ error: "Missing photo reference" });

        let photoUrl;

        // Check if this is a new Places API photo name (format: "places/PLACE_ID/photos/PHOTO_REF")
        if (ref.startsWith("places/")) {
            photoUrl = `https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        } else {
            // Legacy photo reference
            photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${ref}&key=${process.env.GOOGLE_PLACES_API_KEY}`;
        }

        const photoRes = await fetch(photoUrl, { redirect: "follow" });

        if (!photoRes.ok) {
            console.log("Photo proxy failed:", photoRes.status, "for ref:", ref.substring(0, 50));
            return res.status(502).json({ error: "Failed to fetch photo" });
        }

        res.set("Content-Type", photoRes.headers.get("content-type") || "image/jpeg");
        res.set("Cache-Control", "public, max-age=86400");

        const arrayBuffer = await photoRes.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
    } catch (e) {
        console.log("Photo proxy error:", e.message);
        res.status(500).json({ error: "Photo proxy failed" });
    }
});

app.listen(process.env.PORT, () => {
    console.log("Server Running Properly");
})
