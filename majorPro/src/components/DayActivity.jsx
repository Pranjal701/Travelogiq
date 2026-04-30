import React from 'react';
import { motion } from 'framer-motion';

const TIME_SLOT_STYLES = {
  Morning: {
    icon: 'routine',
    badge: 'bg-blue-50 text-blue-600 border-blue-200',
    color: 'text-blue-500',
    timeRange: '09:00 AM - 12:00 PM'
  },
  Afternoon: {
    icon: 'light_mode',
    badge: 'bg-amber-50 text-amber-600 border-amber-200',
    color: 'text-amber-500',
    timeRange: '01:00 PM - 05:00 PM'
  },
  Evening: {
    icon: 'partly_cloudy_night',
    badge: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    color: 'text-indigo-500',
    timeRange: '06:00 PM - 10:00 PM'
  }
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3 } }
};

function DayActivity({ day, timeSlots, hub, date, weatherCondition, temperature }) {
  let stopNumber = 0;

  return (
    <div className="relative pl-6 pb-8 border-l-2 border-slate-200/60 last:border-0 last:pb-0">
      {/* Day marker node */}
      <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-primary ring-4 ring-white shadow-sm" />

      {/* Header */}
      <div className="mb-5 bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">{day}</h2>
            {date && <p className="text-xs font-bold text-slate-400 mt-0.5">{date}</p>}
          </div>

          <div className="flex items-center gap-3">
            {hub && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="material-symbols-outlined text-sm text-primary">location_on</span>
                {hub}
              </span>
            )}
            {(weatherCondition || temperature) && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
                <span className="material-symbols-outlined text-sm text-amber-500">partly_cloudy_day</span>
                {weatherCondition} {temperature ? `• ${temperature}` : ''}
              </span>
            )}
          </div>
        </div>

        {/* Time Slots */}
        <motion.div variants={container} initial="hidden" animate="show" className="divide-y divide-slate-100">
          {timeSlots?.map((slot, slotIdx) => {
            if (!slot.activities || slot.activities.length === 0) return null;
            const style = TIME_SLOT_STYLES[slot.time] || TIME_SLOT_STYLES.Morning;

            return (
              <div key={slotIdx} className="px-5 py-4">
                {/* Time Slot Label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${style.badge}`}>
                    <span className={`material-symbols-outlined text-sm ${style.color}`}>{style.icon}</span>
                    {slot.time}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">{style.timeRange}</span>
                </div>

                {/* Activities */}
                <div className="space-y-2 ml-0.5">
                  {slot.activities.map((activity, actIdx) => {
                    stopNumber++;
                    const actData = typeof activity === 'string'
                      ? { text: activity, place: '', type: 'outdoor', duration: '', description: '' }
                      : activity;

                    return (
                      <motion.div
                        key={actIdx}
                        variants={item}
                        className="group rounded-xl bg-white border border-slate-100 hover:border-primary/20 hover:shadow-md hover:shadow-primary/5 transition-all cursor-default overflow-hidden"
                      >
                        <div className="flex gap-3 p-3 items-center">
                          {/* Stop Number Circle */}
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="text-[11px] font-black">{stopNumber}</span>
                          </div>

                          {/* Activity content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[14px] font-bold text-slate-800 leading-snug truncate">
                                {actData.text || actData.activity}
                              </p>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {actData.duration && (
                                  <span className="inline-flex items-center gap-1 leading-none text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                                    <span className="material-symbols-outlined text-[12px]">schedule</span>
                                    {actData.duration}
                                  </span>
                                )}
                                {actData.type && (
                                  <span className={`inline-flex items-center gap-1 leading-none text-[10px] font-bold px-2 py-1 rounded-full ${
                                    actData.type.toLowerCase() === 'indoor' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                                  }`}>
                                    <span className="material-symbols-outlined text-[12px]">
                                      {actData.type.toLowerCase() === 'indoor' ? 'meeting_room' : 'nature'}
                                    </span>
                                    {actData.type}
                                  </span>
                                )}
                              </div>
                            </div>
                            {actData.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {actData.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

export default DayActivity;