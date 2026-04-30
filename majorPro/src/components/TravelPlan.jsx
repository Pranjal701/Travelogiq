import React from 'react'
import { motion } from "framer-motion"
import DayActivity from './DayActivity';

function TravelPlan({ planner }) {
  return (
    <motion.div
      className="flex flex-col gap-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {planner.map((plan, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
        >
          <DayActivity
            day={plan.day}
            timeSlots={plan.timeSlots}
            hub={plan.hub}
            date={plan.date}
            weatherCondition={plan.weatherCondition}
            weatherAdvisory={plan.weatherAdvisory}
            temperature={plan.temperature}
            travelNote={plan.travelNote}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

export default TravelPlan
