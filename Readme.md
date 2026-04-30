# TraveloGIQ: AI Travel Planner - Project Overview

## 1. What It Is
**TraveloGIQ** is an intelligent, dynamic, and interactive AI-powered travel planning application. It moves beyond static travel blogs and generic booking sites by acting as a personalized travel agent. Users can interact with an AI chatbot to describe their dream vacation, and the system automatically generates a highly detailed, personalized, and visually rich day-by-day itinerary.

## 2. What It Does
- **Conversational Trip Planning**: Users converse with an AI Chatbot that intelligently extracts travel parameters (Destination, Dates, Budget, Group Type, Pacing, Interests, and Special Notes).
- **Dynamic Itinerary Generation**: Generates structured, day-by-day travel plans grouped by Morning, Afternoon, and Evening slots.
- **Smart Multi-Hub Routing**: Automatically detects if a trip duration is too long for a single small city (e.g., 6 days in Dwarka) and intelligently suggests nearby regional circuits (e.g., adding Somnath and Porbandar) while plotting routes between them.
- **Real-Time Weather Integration**: Fetches 5-day weather forecasts for the destination and injects this context into the AI prompt, ensuring the generated activities are weather-appropriate (e.g., suggesting indoor activities on rainy days).
- **Visuals & Logistics**: Automatically fetches real, high-quality images, hotel recommendations, and tourist attraction details directly from the Google Places API based on the AI's generated locations.
- **Iterative Regeneration**: Users can refine their itineraries by giving specific text prompts (e.g., "make it more relaxed" or "expand to 6 days"), and the system intelligently overrides its base rules to accommodate the user's specific desires.

## 3. Uniqueness
- **Zero-Hallucination UI Integration**: The AI does not output raw text; it is strictly engineered to output complex JSON structures. This allows the frontend React application to render a beautiful, interactive dashboard (Day cards, Hub Routing flowcharts, Explore tabs) instead of a boring text wall.
- **Performance Optimization (Thinking Bypass)**: The system utilizes Google's Gemini 2.5 Flash model but overrides its default "thinking" (chain-of-thought) behavior for itinerary generation. By dropping the thinking budget to 0 and relying on a hyper-strict JSON schema, itinerary generation latency was reduced from 45+ seconds to under 20 seconds.
- **Context-Aware Chatbot**: The chatbot maintains conversational memory and injects real-time weather API data into its own system prompt so it can answer weather-related questions accurately during the planning phase.

## 4. Technology Stack
### Frontend (Client-Side)
- **Framework**: React.js (via Vite)
- **Styling**: Tailwind CSS / Vanilla CSS for custom animations and glassmorphism UI.
- **Icons**: Google Material Symbols.
- **Routing**: React Router DOM.
- **HTTP Client**: Axios.

### Backend (Server-Side)
- **Environment**: Node.js with Express.js
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens) stored in HTTP-only cookies.

### External APIs & AI
- **LLM Engine**: Google Gemini API (`gemini-2.5-flash`).
- **Location & Visuals**: Google Places API (New API v1 for Text Search and Photos).
- **Weather Data**: OpenWeatherMap API (5-day/3-hour forecast).

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Pranjal701/Travelogiq.git
cd Travelogiq
2️⃣ Backend Setup
cd backend
npm install
Create .env file:
MONGO_URI=
JWT_SECRET=
GEMINI_API_KEY=
GOOGLE_PLACES_API_KEY=
WEATHER_API_KEY=
Run server:
node index2.js
3️⃣ Frontend Setup
cd majorPro
npm install
npm run dev
