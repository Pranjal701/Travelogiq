import { motion } from "framer-motion";
import { apiUrl } from "../api";

const PRICE_LABELS = {
  0: "Free", 1: "$", 2: "$$", 3: "$$$", 4: "$$$$"
};

function Hotels({ hotels }) {
  if (!hotels || hotels.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">hotel</span>
        <p className="text-slate-500 text-sm">Searching for hotels...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Recommended Hotels</h2>
        <p className="text-sm text-slate-400 mt-0.5">{hotels.length} properties found near your destination</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {hotels.map((hotel, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: idx * 0.06 }}
            className="group bg-white rounded-xl border border-slate-200/80 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300"
          >
            {/* Photo */}
            <div className="relative h-40 overflow-hidden bg-slate-100">
              {hotel.photoRef ? (
                <img
                  src={apiUrl(`/place-photo?ref=${hotel.photoRef}`)}
                  alt={hotel.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/5 to-primary/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary/25 text-5xl">hotel</span>
                </div>
              )}

              {/* Price badge */}
              {hotel.priceLevel !== null && hotel.priceLevel !== undefined && (
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-1 rounded-md text-[11px] font-bold bg-white/90 backdrop-blur-sm text-slate-700">
                    {PRICE_LABELS[hotel.priceLevel] || "$$"}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 leading-tight line-clamp-1">{hotel.name}</h3>

              {hotel.address && (
                <p className="text-[11px] text-slate-400 line-clamp-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">location_on</span>
                  {hotel.address}
                </p>
              )}

              <div className="flex items-center justify-between pt-1">
                {hotel.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded text-xs font-bold text-amber-600 border border-amber-100">
                      <span className="text-amber-400">★</span>{hotel.rating}
                    </span>
                    {hotel.userRatingsTotal > 0 && (
                      <span className="text-[10px] text-slate-400">
                        ({hotel.userRatingsTotal.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-[10px] ${s <= Math.round(hotel.rating || 0) ? 'text-amber-400' : 'text-slate-200'}`}>★</span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Hotels;
