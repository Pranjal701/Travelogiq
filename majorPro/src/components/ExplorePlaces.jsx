import { motion } from "framer-motion";
import { apiUrl } from "../api";

const CATEGORY_ICONS = {
  "Historical Monument": "account_balance",
  "Religious Site": "temple_buddhist",
  "Museum": "museum",
  "Natural Wonder": "landscape",
  "Cultural Landmark": "location_city",
  "UNESCO Heritage": "public",
  "Palace/Fort": "castle",
  "Ancient Ruins": "domain",
};

function ExplorePlaces({ explorePlaces }) {
  if (!explorePlaces || !explorePlaces.places || explorePlaces.places.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">castle</span>
        <p className="text-slate-500 text-sm">Explore data is loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Must-Visit Places</h2>
        <p className="text-sm text-slate-400 mt-0.5">Historical landmarks, cultural treasures & hidden gems</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {explorePlaces.places.map((place, idx) => {
          const icon = CATEGORY_ICONS[place.category] || "place";
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300"
            >
              {/* Photo */}
              <div className="relative h-44 overflow-hidden bg-slate-100">
                {place.photoRef ? (
                  <img
                    src={apiUrl(`/place-photo?ref=${encodeURIComponent(place.photoRef)}`)}
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                    }}
                  />
                ) : null}
                <div
                  className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center"
                  style={{ display: place.photoRef ? 'none' : 'flex' }}
                >
                  <span className="material-symbols-outlined text-primary/25 text-5xl">{icon}</span>
                </div>

                {/* Category pill */}
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold bg-white/90 backdrop-blur-sm text-slate-700 border border-white/50">
                    <span className="material-symbols-outlined text-xs">{icon}</span>
                    {place.category}
                  </span>
                </div>

                {/* Rating */}
                {place.rating && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-white/90 backdrop-blur-sm text-xs font-bold text-slate-700">
                    <span className="text-amber-400">★</span>{place.rating}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{place.name}</h3>

                {place.description && (
                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">{place.description}</p>
                )}

                {place.culturalImportance && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Cultural Significance</p>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{place.culturalImportance}</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-1">
                  {place.bestTimeToVisit && (
                    <span className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <span className="material-symbols-outlined text-xs text-emerald-500">schedule</span>
                      {place.bestTimeToVisit}
                    </span>
                  )}
                </div>

                {place.mustKnow && (
                  <div className="flex items-start gap-1.5 text-[11px] text-slate-500">
                    <span className="material-symbols-outlined text-xs text-blue-400 mt-0.5 flex-shrink-0">info</span>
                    <span className="line-clamp-2">{place.mustKnow}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default ExplorePlaces;
