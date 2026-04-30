import { motion } from "framer-motion";

const GUIDE_SECTIONS = [
  {
    key: "mustTryDishes",
    title: "Must-Try Local Dishes",
    icon: "restaurant",
    gradient: "from-orange-500 to-red-500",
    bgGlow: "bg-orange-500/10",
    emoji: "🍴",
  },
  {
    key: "whereToEat",
    title: "Where to Eat",
    icon: "pin_drop",
    gradient: "from-emerald-500 to-teal-500",
    bgGlow: "bg-emerald-500/10",
    emoji: "📍",
  },
  {
    key: "localClothing",
    title: "Local Clothing & Attire",
    icon: "checkroom",
    gradient: "from-purple-500 to-pink-500",
    bgGlow: "bg-purple-500/10",
    emoji: "👘",
  },
  {
    key: "shoppingSpots",
    title: "Best Shopping Spots",
    icon: "storefront",
    gradient: "from-blue-500 to-cyan-500",
    bgGlow: "bg-blue-500/10",
    emoji: "🛍️",
  },
  {
    key: "souvenirs",
    title: "What to Buy",
    icon: "redeem",
    gradient: "from-amber-500 to-yellow-500",
    bgGlow: "bg-amber-500/10",
    emoji: "🎁",
  },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const card = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

function LocalGuide({ localGuide }) {
  if (!localGuide) {
    return (
      <div className="bg-white rounded-xl p-10 border border-slate-100 shadow-sm text-center">
        <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">
          explore
        </span>
        <h2 className="text-2xl font-bold text-slate-900">
          Local Guide
        </h2>
        <p className="text-slate-500 mt-2">
          Local recommendations are being prepared...
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {GUIDE_SECTIONS.map((section) => {
        const items = localGuide[section.key] || [];
        return (
          <motion.div
            key={section.key}
            variants={card}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="relative group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300"
          >
            {/* Gradient accent bar */}
            <div className={`h-1.5 bg-gradient-to-r ${section.gradient}`} />

            {/* Glow effect */}
            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${section.bgGlow} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

            <div className="relative p-6">
              {/* Header */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center shadow-lg`}>
                  <span className="material-symbols-outlined text-white text-xl">
                    {section.icon}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {section.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {items.length} recommendation{items.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* Items */}
              <ul className="space-y-3">
                {items.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-sm text-slate-700 group/item"
                  >
                    <span className="text-base mt-0.5 flex-shrink-0 opacity-70">
                      {section.emoji}
                    </span>
                    <span className="group-hover/item:text-slate-900 transition-colors">
                      {item}
                    </span>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="text-sm text-slate-400 italic">
                    No recommendations available
                  </li>
                )}
              </ul>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export default LocalGuide;
