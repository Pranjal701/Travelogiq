/**
 * Converts the structured JSON itinerary from the backend into the
 * frontend planner format for display.
 *
 * Input: itineraryJSON object with { tripOverview, days[] }
 * Output: planner array compatible with DayActivity component
 */
function convertItineraryToText(itineraryData) {
  // Handle new JSON structure from Gemini
  if (itineraryData && typeof itineraryData === 'object' && itineraryData.days) {
    return itineraryData.days.map(day => ({
      day: `Day ${day.dayNumber}`,
      hub: day.hub || "",
      date: day.date || "",
      weatherCondition: day.weatherCondition || "",
      weatherAdvisory: day.weatherAdvisory || "",
      temperature: day.temperature || "",
      travelNote: day.travelNote || "",
      timeSlots: ["morning", "afternoon", "evening"]
        .map(slotKey => {
          const activities = day.timeSlots?.[slotKey] || [];
          if (activities.length === 0) return null;
          return {
            time: slotKey.charAt(0).toUpperCase() + slotKey.slice(1),
            activities: activities.map(act => ({
              text: act.activity || act.text || "",
              place: act.place || "",
              type: act.type || "outdoor",
              duration: act.duration || "",
              description: act.description || "",
              photoRef: act.photoRef || null,
              isNewAPI: act.isNewAPI || false,
            }))
          };
        })
        .filter(Boolean)
    }));
  }

  // ──── FALLBACK: Legacy text-based parsing ────
  // In case the backend returns old-format text (backward compat)
  if (typeof itineraryData === 'string') {
    const lines = itineraryData
      .split("\n")
      .map(line => line.trim())
      .filter(Boolean);

    const grouped = {};

    lines.forEach(line => {
      const match = line.match(/^Day(\d+)\s*-\s*([A-Za-z]+[\d:]*)\s*-\s*(.+)$/);
      if (!match) return;

      const dayNumber = match[1];
      const time = match[2];
      let text = match[3].trim();

      if (text.startsWith("* ")) {
        text = text.substring(2);
      } else if (text.startsWith("*")) {
        text = text.substring(1).trim();
      }

      const dayKey = `Day ${dayNumber}`;

      if (!grouped[dayKey]) {
        grouped[dayKey] = {};
      }
      if (!grouped[dayKey][time]) {
        grouped[dayKey][time] = [];
      }
      grouped[dayKey][time].push({
        text,
        place: "",
        type: "outdoor",
        duration: "",
        description: "",
        photoRef: null,
        isNewAPI: false,
      });
    });

    return Object.keys(grouped).map(day => ({
      day,
      hub: "",
      date: "",
      weatherCondition: "",
      weatherAdvisory: "",
      temperature: "",
      travelNote: "",
      timeSlots: Object.keys(grouped[day]).map(time => ({
        time,
        activities: grouped[day][time]
      }))
    }));
  }

  return [];
}

export default convertItineraryToText;
