import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import GooglePlacesAutocomplete from "react-google-places-autoComplete";

function Details() {
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:5000/session_check", { withCredentials: true })
      .then((res) => {
        if (res.data.message === "Invalid Token") navigate("/signIn");
      })
      .catch(() => console.log("Error in Details page in Frontend"));
  }, []);

  let [destination, setDestination] = useState(null);
  let [to, setTo] = useState("");
  let [from, setFrom] = useState("");
  let [budget, setBudget] = useState("");
  let [group, setGroup] = useState("");
  let [interest, setInterests] = useState([]);
  let [pacing, setPacing] = useState("");
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    destination = destination?.label;
    if (!destination || !to || !from || !budget || !group || !interest.length || !pacing) {
      setWarning("Fill out all the details!");
    } else if (to > from) {
      setWarning("Enter Correct Order of Dates");
    } else {
      setLoading(true);
      const data = { destination, to, from, budget, group, interest, pacing };
      try {
        const res = await axios.post(
          "http://localhost:5000/save_details",
          data,
          { withCredentials: true }
        );
        if (res.data.message === "Details Saved") navigate("/itinerary");
        if (res.data.message === "Invalid Token") navigate("/signIn");
      } catch (error) {
        console.log("Error in handleSubmit in Details page at frontend");
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleInterest = (value) => {
    setInterests((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    );
  };

  const budgetOptions = [
    { key: "cheap", icon: "savings", label: "Cheap", desc: "Stay conscious of costs" },
    { key: "moderate", icon: "account_balance_wallet", label: "Medium", desc: "Keep cost on the average side" },
    { key: "luxury", icon: "diamond", label: "Luxury", desc: "Don't worry about cost" },
  ];

  const groupOptions = [
    { key: "justMe", icon: "person", label: "Just Me" },
    { key: "couple", icon: "favorite", label: "Couple" },
    { key: "family", icon: "family_restroom", label: "Family" },
    { key: "friends", icon: "groups", label: "Friends" },
  ];

  const pacingOptions = [
    { key: "Relaxed", icon: "spa", label: "Relaxed", desc: "1-2 activities/day, late starts, plenty of free time" },
    { key: "Moderate", icon: "balance", label: "Moderate", desc: "3-4 activities/day, balanced schedule" },
    { key: "High-paced", icon: "bolt", label: "High-paced", desc: "5+ activities/day, packed schedule, early starts" },
  ];

  const interestOptions = [
    "Historical & Cultural Sites",
    "Adventure & Outdoor Activities",
    "Shopping & Local Markets",
    "Nightlife & Entertainment",
    "Nature & Scenic Views",
    "Relaxation & Wellness",
    "Beaches",
    "City Sightseeing",
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-primary tracking-widest uppercase mb-2">
            New Trip
          </h2>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">
            Tell us your travel preferences
          </h1>
          <p className="text-slate-500">
            Provide some basic information, and our AI will generate a
            customized itinerary based on your preferences.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Destination */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Destination
            </label>
            <GooglePlacesAutocomplete
              apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}
              selectProps={{
                value: destination,
                onChange: (place) => setDestination(place),
                placeholder: "Ex. Manali",
                styles: {
                  control: (base) => ({
                    ...base,
                    backgroundColor: "#f8fafc",
                    borderColor: "#e2e8f0",
                    borderRadius: "0.5rem",
                    padding: "4px",
                    boxShadow: "none",
                    "&:hover": { borderColor: "#5048e5" },
                  }),
                  input: (base) => ({ ...base, color: "#0f172a" }),
                  singleValue: (base) => ({ ...base, color: "#0f172a" }),
                  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
                  menu: (base) => ({
                    ...base,
                    backgroundColor: "#ffffff",
                    borderRadius: "0.5rem",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1)",
                    zIndex: 50,
                  }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? "#f1f5f9" : "#fff",
                    color: "#0f172a",
                    cursor: "pointer",
                  }),
                },
              }}
            />
          </div>

          {/* Dates */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              When are you planning?
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <span className="text-xs text-slate-500 mb-1 block">Start Date</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
              <div className="flex-1">
                <span className="text-xs text-slate-500 mb-1 block">End Date</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              What is your budget?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {budgetOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setBudget(opt.key)}
                  className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${
                    budget === opt.key
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-slate-200 hover:border-primary/40"
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl mb-2 ${budget === opt.key ? "text-primary" : "text-slate-400"}`}>
                    {opt.icon}
                  </span>
                  <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-1 text-center">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Travel Group */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Who are you travelling with?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {groupOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setGroup(opt.key)}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all ${
                    group === opt.key
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-slate-200 hover:border-primary/40"
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl mb-1 ${group === opt.key ? "text-primary" : "text-slate-400"}`}>
                    {opt.icon}
                  </span>
                  <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Pacing */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              What's your travel pace?
            </label>
            <div className="grid grid-cols-3 gap-3">
              {pacingOptions.map((opt) => (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => setPacing(opt.key)}
                  className={`flex flex-col items-center p-5 rounded-xl border-2 transition-all ${
                    pacing === opt.key
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-slate-200 hover:border-primary/40"
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl mb-2 ${pacing === opt.key ? "text-primary" : "text-slate-400"}`}>
                    {opt.icon}
                  </span>
                  <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                  <p className="text-xs text-slate-500 mt-1 text-center">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Choose Your Interests
            </label>
            <div className="flex flex-wrap gap-3">
              {interestOptions.map((item) => (
                <button
                  type="button"
                  key={item}
                  onClick={() => toggleInterest(item)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold border-2 transition-all ${
                    interest.includes(item)
                      ? "border-primary bg-primary text-white shadow-lg shadow-primary/25"
                      : "border-slate-200 text-slate-600 hover:border-primary/40"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* Warning */}
          {warning && (
            <p className="text-sm text-red-500 font-medium text-center">{warning}</p>
          )}

          {/* Submit */}
          <div className="flex justify-center pt-2">
            <button
              type="submit"
              disabled={loading}
              className={`px-12 py-4 rounded-xl text-lg font-bold transition-all ${
                loading
                  ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 active:scale-95"
              }`}
            >
              {loading ? "Generating..." : "Generate Itinerary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Details;
