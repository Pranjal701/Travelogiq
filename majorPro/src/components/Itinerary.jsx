import TravelPlan from './TravelPlan';
import LocalGuide from './LocalGuide';
import Hotels from './Hotels';
import ExplorePlaces from './ExplorePlaces';
import { useEffect, useState, useMemo } from "react";
import convertItineraryToText from './convertItineraryToText';
import transformWeatherData from './transformWeatherData';
import { pdf } from "@react-pdf/renderer";
import ItineraryPDF from './ItineraryPDF';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { apiUrl } from '../api';

const ITINERARY_STORAGE_KEY = 'itinerary_id'

function Itinerary() {
  const [itineraryData, setItineraryData] = useState(null);
  const [currentItineraryId, setCurrentItineraryId] = useState(null);
  const [planner, setPlanner] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenInstructions, setRegenInstructions] = useState("");
  const [activeTab, setActiveTab] = useState("itinerary");
  const [localGuide, setLocalGuide] = useState(null);
  const [placePhotos, setPlacePhotos] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [explorePlaces, setExplorePlaces] = useState(null);
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [activeDay, setActiveDay] = useState(-1);
  const [tripOverview, setTripOverview] = useState(null);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const navigate = useNavigate();
  const { id } = useParams();

  const [weather, setWeather] = useState({
    destination: "",
    startDate: "",
    endDate: "",
    weatherForecast: [],
  });

  // ──── FETCH DATA ────
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const itinerary_id = id || localStorage.getItem(ITINERARY_STORAGE_KEY);
        const url = itinerary_id
          ? apiUrl(`/createItinerary/${itinerary_id}`)
          : apiUrl('/createItinerary');
        
        const res = await axios.get(url, { withCredentials: true });
        
        if (res.data.id) {
          setCurrentItineraryId(res.data.id);
        }
        
        setWeather(res.data.weatherData);
        setItineraryData(res.data.itinerary);
        setLocalGuide(res.data.localGuide || null);
        setPlacePhotos(res.data.placePhotos || []);
        setHotels(res.data.hotels || []);
        setExplorePlaces(res.data.explorePlaces || null);

        if (res.data.weatherPerDay && res.data.weatherPerDay.length > 0) {
          setWeatherForecast(res.data.weatherPerDay.map(w => ({
            date: w.date,
            temperature: { min: w.minTemp ?? "-", max: w.maxTemp ?? "-" },
            condition: w.condition || "-",
            humidity: w.avgHumidity ?? "-",
            wind_speed: "-"
          })));
        }

        if (res.data.itinerary && res.data.itinerary.tripOverview) {
          setTripOverview(res.data.itinerary.tripOverview);
        }
      } catch (error) {
        console.log("Frontend Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    localStorage.removeItem(ITINERARY_STORAGE_KEY);
  }, [id]);


  const handleRegenerateClick = async () => {
    try {
      const targetId = currentItineraryId || id;
      if (!targetId) return;
      
      setLoading(true);
      setShowRegenModal(false);
      const res = await axios.post(apiUrl(`/regenerateItinerary/${targetId}`), { instructions: regenInstructions }, { withCredentials: true });
      if (res.data.success) {
        setRegenInstructions("");
        navigate(`/itinerary/${res.data.newId}`);
      }
    } catch (error) {
      console.log("Error regenerating:", error);
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => { try { const blob = await pdf(<ItineraryPDF planner={plannerForPDF} />).toBlob(); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "itinerary.pdf"; link.click(); URL.revokeObjectURL(url); } catch (error) { console.error("PDF generation failed", error); } }; // ──── PROCESS DATA ────
  useEffect(() => {
    if (!itineraryData) return;
    const convertedPlanner = convertItineraryToText(itineraryData);
    setPlanner(convertedPlanner);
    // Only use transformWeatherData as fallback if weatherPerDay wasn't set
    if (weatherForecast.length === 0 && weather && weather.weatherForecast) {
      const transformed = transformWeatherData(weather);
      setWeatherForecast(transformed || []);
    }
  }, [itineraryData]);

  // Build planner data compatible with PDF
  const plannerForPDF = planner.map(day => ({
    day: day.day,
    activities: day.timeSlots
      ? day.timeSlots.flatMap(slot =>
          slot.activities.map(act => ({
            time: slot.time,
            text: typeof act === 'string' ? act : (act.text || act.activity || '')
          }))
        )
      : []
  }));

  // Format dates
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tripDays = () => {
    if (!weather.startDate || !weather.endDate) return 0;
    return Math.ceil((new Date(weather.endDate) - new Date(weather.startDate)) / (1000 * 60 * 60 * 24)) + 1;
  };

  // Auto-rotate hero photos
  useEffect(() => {
    if (placePhotos.length <= 1) return;
    const timer = setInterval(() => {
      setActivePhotoIdx(prev => (prev + 1) % placePhotos.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [placePhotos]);

  const tabs = [
    { key: "itinerary", label: "Itinerary", icon: "route" },
    { key: "explore", label: "Explore", icon: "castle" },
    { key: "localGuide", label: "Local Guide", icon: "explore" },
    { key: "hotels", label: "Hotels", icon: "hotel" },
  ];

  const totalActivities = planner.reduce((sum, day) => {
    return sum + (day.timeSlots ? day.timeSlots.reduce((s, slot) => s + slot.activities.length, 0) : 0);
  }, 0);

  // Unique hubs from the planner
  const uniqueHubs = useMemo(() => {
    const hubs = new Set();
    planner.forEach(day => {
      if (day.hub) hubs.add(day.hub);
    });
    return [...hubs];
  }, [planner]);

  return (
    <div className="min-h-screen bg-[#f5f6fa]">
      {/* ──── FULL SCREEN LOADER ──── */}
      {loading && (
        <div className="fixed inset-0 z-60 flex flex-col items-center justify-center bg-white">
          <div className="relative w-20 h-20 mb-8">
            <div className="absolute inset-0 border-4 border-primary/10 rounded-full" />
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin" />
            <span className="absolute inset-0 flex items-center justify-center material-symbols-outlined text-primary text-2xl">flight_takeoff</span>
          </div>
          <p className="text-slate-900 text-lg font-bold">Building your itinerary</p>
          <p className="text-slate-400 text-sm mt-1">AI is crafting a personalized trip just for you...</p>
          <div className="mt-6 flex gap-2">
            {["Checking weather", "Finding places", "Optimizing routes", "Adding photos"].map((step, i) => (
              <span key={i} className="px-3 py-1.5 bg-slate-50 rounded-full text-[11px] font-medium text-slate-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ──── HEADER BAR ──── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2">
            <div className="bg-primary w-8 h-8 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-lg">travel_explore</span>
            </div>
            <span className="text-base font-extrabold tracking-tight text-slate-900">TRAVELOGIQ</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={loading || plannerForPDF.length === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${loading || plannerForPDF.length === 0 ? 'text-slate-400 bg-slate-50 cursor-not-allowed' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <span className="material-symbols-outlined text-base">download</span>
              {loading ? 'Preparing...' : 'PDF'}
            </button>
            <button
              onClick={() => setShowRegenModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-50 text-amber-600 text-xs font-bold hover:bg-amber-100 border border-amber-200 transition-colors"
            >
              <span className="material-symbols-outlined text-base">autorenew</span>
              Regenerate Plan
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <span className="material-symbols-outlined text-base">dashboard</span>
              Dashboard
            </button>
          </div>
        </div>
      </header>

      <main className="pt-14">
        {/* ──── HERO PHOTO + DESTINATION HEADER ──── */}
        <section className="relative bg-slate-900 overflow-hidden">
          {/* Background photo carousel */}
          <div className="absolute inset-0">
            {placePhotos.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={activePhotoIdx}
                  src={apiUrl(`/place-photo?ref=${placePhotos[activePhotoIdx]?.photoRef}`)}
                  alt={placePhotos[activePhotoIdx]?.name || "Destination"}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/30" />
          </div>

          <div className="relative z-10 max-w-[1400px] mx-auto px-6 py-12 pb-8">
            <div className="flex items-end justify-between flex-wrap gap-6">
              {/* Left — Destination info */}
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
                  {tripOverview?.mainHub || weather.destination || "Your Destination"}
                </h1>
                <div className="flex items-center gap-4 flex-wrap">
                  {weather.startDate && (
                    <span className="text-sm text-white/80 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">date_range</span>
                      {formatDate(weather.startDate)} - {formatDate(weather.endDate)}
                    </span>
                  )}
                  {tripDays() > 0 && (
                    <span className="text-sm text-white/80 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {tripDays()} days
                    </span>
                  )}
                  {uniqueHubs.length > 1 && (
                    <span className="text-sm text-white/80 font-medium flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base">hub</span>
                      {uniqueHubs.length} destinations
                    </span>
                  )}
                </div>

                {/* Multi-hub badges */}
                {uniqueHubs.length > 1 && (
                  <div className="flex items-center gap-2 mt-3">
                    {uniqueHubs.map((hub, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-white text-xs font-semibold border border-white/20">
                        <span className="material-symbols-outlined text-xs">location_on</span>
                        {hub}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Right — Quick Stats */}
              <div className="flex items-center gap-3">
                {[
                  { icon: "flag", value: planner.length, label: "Days" },
                  { icon: "pin_drop", value: totalActivities, label: "Activities" },
                  { icon: "hotel", value: hotels.length, label: "Hotels" },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-2 px-3.5 py-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/15">
                    <span className="material-symbols-outlined text-white/80 text-base">{stat.icon}</span>
                    <div>
                      <p className="text-sm font-black text-white leading-none">{stat.value}</p>
                      <p className="text-[10px] text-white/60 font-semibold">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Photo thumbnails */}
            {placePhotos.length > 1 && (
              <div className="flex items-center gap-2 mt-5 overflow-x-auto hide-scrollbar pb-1">
                {placePhotos.slice(0, 8).map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setActivePhotoIdx(i)}
                    className={`w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      activePhotoIdx === i
                        ? 'border-white shadow-lg scale-105'
                        : 'border-transparent opacity-60 hover:opacity-90'
                    }`}
                  >
                    <img
                      src={apiUrl(`/place-photo?ref=${photo.photoRef}`)}
                      alt={photo.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ──── TRIP OVERVIEW (interest adaptations, summary) ──── */}
        {tripOverview && (tripOverview.interestAdaptations?.length > 0 || tripOverview.tripSummary) && (
          <section className="bg-white border-b border-slate-200/80">
            <div className="max-w-[1400px] mx-auto px-6 py-4">
              {tripOverview.tripSummary && (
                <p className="text-sm text-slate-600 leading-relaxed mb-2">{tripOverview.tripSummary}</p>
              )}
              {tripOverview.interestAdaptations && tripOverview.interestAdaptations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tripOverview.interestAdaptations.map((note, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium border border-amber-100">
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      {note}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ──── WEATHER STRIP ──── */}
        {weatherForecast.length > 0 && weatherForecast.some(d => d.temperature?.min !== "-") && (
          <section className="bg-white border-b border-slate-200/80">
            <div className="max-w-[1400px] mx-auto px-6 py-3">
              <div className="flex items-center gap-3 overflow-x-auto hide-scrollbar">
                <span className="material-symbols-outlined text-slate-400 text-base flex-shrink-0">cloud</span>
                {weatherForecast.map((day, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100 flex-shrink-0">
                    <span className="text-[11px] font-bold text-primary">{day.date}</span>
                    <span className="text-[11px] text-slate-500">{day.condition}</span>
                    <span className="text-[11px] font-semibold text-slate-700">
                      {day.temperature.min !== "-" ? `${day.temperature.min}-${day.temperature.max} C` : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ──── ROUTING FLOWCHART ──── */}
        {tripOverview?.hubRouting && tripOverview.hubRouting.length > 0 && (
          <section className="bg-slate-50 border-b border-slate-200/80 overflow-hidden">
            <div className="max-w-[1400px] mx-auto px-6 py-5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm">route</span> Route Overview
              </h3>
              <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-2">
                {tripOverview.hubRouting.map((route, i) => (
                  <div key={i} className="flex items-center gap-2 flex-shrink-0">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm">
                      <span className="text-sm font-black text-slate-800">{route.from}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center px-2">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider">{route.distance}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{route.duration}</span>
                      </div>
                      <div className="flex items-center w-full min-w-[120px]">
                        <div className="h-[2px] flex-grow bg-slate-300"></div>
                        <div className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-full flex items-center mx-1">
                          <span className="text-[10px] font-bold text-slate-600">{route.mode}</span>
                        </div>
                        <div className="h-[2px] flex-grow bg-slate-300"></div>
                        <div className="w-2 h-2 rounded-full border-2 border-slate-300 bg-slate-100 ml-0.5"></div>
                      </div>
                    </div>
                    {i === tripOverview.hubRouting.length - 1 && (
                      <div className="px-4 py-2 bg-white border border-slate-200 rounded-full shadow-sm ml-2">
                        <span className="text-sm font-black text-slate-800">{route.to}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ──── TAB BAR ──── */}
        <section className="bg-white border-b border-slate-200/80 sticky top-14 z-40">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`relative flex items-center gap-1.5 px-5 py-3.5 text-sm font-bold transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'text-primary'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span className="material-symbols-outlined text-base">{tab.icon}</span>
                  {tab.label}
                  {activeTab === tab.key && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ──── MAIN CONTENT AREA ──── */}
        <div className="max-w-[1400px] mx-auto">
          <AnimatePresence mode="wait">
            {/* ──── ITINERARY TAB ──── */}
            {activeTab === "itinerary" && (
              <motion.div
                key="itinerary"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col lg:flex-row"
              >
                {/* Left — Itinerary Timeline */}
                <div className="flex-1 min-w-0 p-6">
                  {/* Day selector pills */}
                  {planner.length > 1 && (
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto hide-scrollbar pb-1">
                      <button
                        onClick={() => setActiveDay(-1)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                          activeDay === -1
                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                            : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/40'
                        }`}
                      >
                        All Days
                      </button>
                      {planner.map((day, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveDay(i)}
                          className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            activeDay === i
                              ? 'bg-primary text-white shadow-md shadow-primary/20'
                              : 'bg-white text-slate-500 border border-slate-200 hover:border-primary/40'
                          }`}
                        >
                          Day {i + 1}
                          {day.hub && activeDay !== i && (
                            <span className="text-[10px] opacity-70 font-normal">{day.hub}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Day cards */}
                  <TravelPlan
                    planner={activeDay === -1 ? planner : planner.filter((_, i) => i === activeDay)}
                  />
                </div>

                {/* Right — Photo Gallery Sidebar (replaces map) */}
                <div className="hidden lg:block w-[400px] flex-shrink-0">
                  <div className="sticky top-[106px] p-4 pl-0 space-y-4" style={{ maxHeight: 'calc(100vh - 106px)', overflowY: 'auto' }}>
                    {/* Destination Photos */}
                    {placePhotos.length > 0 && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-sm">photo_library</span>
                            Destination Gallery
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-1 p-1">
                          {placePhotos.slice(0, 6).map((photo, i) => (
                            <div key={i} className="relative group aspect-[4/3] overflow-hidden rounded-lg">
                              <img
                                src={apiUrl(`/place-photo?ref=${photo.photoRef}`)}
                                alt={photo.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-2 left-2 right-2">
                                  <p className="text-white text-[11px] font-semibold truncate">{photo.name}</p>
                                  {photo.rating && (
                                    <span className="text-white/80 text-[10px] flex items-center gap-0.5">
                                      <span className="text-amber-400">★</span> {photo.rating}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quick weather card */}
                    {weatherForecast.length > 0 && weatherForecast.some(d => d.temperature?.min !== "-") && (
                      <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                        <div className="px-4 py-3 border-b border-slate-100">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-sm">thermostat</span>
                            Weather Forecast
                          </h3>
                        </div>
                        <div className="p-3 space-y-1.5">
                          {weatherForecast.slice(0, 7).map((day, i) => (
                            <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold text-primary w-16">Day {i + 1}</span>
                                <span className="text-[11px] text-slate-500">{day.condition}</span>
                              </div>
                              <span className="text-[11px] font-semibold text-slate-700">
                                {day.temperature.min !== "-" ? `${day.temperature.min}-${day.temperature.max} C` : "-"}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ──── OTHER TABS ──── */}
            {activeTab === "explore" && (
              <motion.div
                key="explore"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-6"
              >
                <ExplorePlaces explorePlaces={explorePlaces} />
              </motion.div>
            )}

            {activeTab === "localGuide" && (
              <motion.div
                key="localGuide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-6"
              >
                <LocalGuide localGuide={localGuide} />
              </motion.div>
            )}

            {activeTab === "hotels" && (
              <motion.div
                key="hotels"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="p-6"
              >
                <Hotels hotels={hotels} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ──── REGENERATION MODAL ──── */}
      <AnimatePresence>
      {showRegenModal && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 w-full max-w-lg"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="material-symbols-outlined text-amber-600">magic_button</span>
              </div>
              <h3 className="text-xl font-bold text-slate-800">Custom Regeneration</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5 ml-13 pl-1">
              Have specific changes in mind? Tell the AI to add, remove, or modify elements for your new itinerary.
            </p>
            <textarea
              className="w-full h-32 p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none shadow-inner"
              placeholder="e.g. Remove the Taj Mahal, focus more on street food, make the pacing slower..."
              value={regenInstructions}
              onChange={(e) => setRegenInstructions(e.target.value)}
            />
            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowRegenModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleRegenerateClick}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors flex items-center gap-2"
              >
                {loading ? <span className="material-symbols-outlined animate-spin text-sm">autorenew</span> : 'Regenerate Trip'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}

export default Itinerary;
