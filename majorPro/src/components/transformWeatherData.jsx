function transformWeatherData(weatherData) {
  if (!weatherData) return [];

  const { startDate, endDate, weatherForecast } = weatherData;
  const apiResponse = weatherForecast;

  if (!apiResponse || !Array.isArray(apiResponse.list)) {
    console.warn("transformWeatherData: invalid apiResponse");
    return [];
  }

  // ---------- 1️⃣ GROUP API DATA BY DATE ----------
  const dailyMap = {};

  apiResponse.list.forEach(item => {
    if (!item?.dt_txt || !item?.main || !item?.weather?.length) return;

    const date = item.dt_txt.split(" ")[0];

    if (!dailyMap[date]) {
      dailyMap[date] = {
        temps: [],
        humidities: [],
        winds: [],
        times: [],
      };
    }

    dailyMap[date].temps.push(item.main.temp);
    dailyMap[date].humidities.push(item.main.humidity);
    dailyMap[date].winds.push(item.wind.speed);
    dailyMap[date].times.push({
      time: item.dt_txt,
      condition: item.weather[0].main,
    });
  });

  // ---------- 2️⃣ CREATE DATE RANGE FROM USER INPUT ----------
  const results = [];
  let current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    const dayData = dailyMap[dateStr];

    // ---------- 3️⃣ IF WEATHER EXISTS ----------
    if (dayData && dayData.temps.length) {
      const minTemp = Math.min(...dayData.temps);
      const maxTemp = Math.max(...dayData.temps);

      const midday =
        dayData.times.find(t => t.time.includes("12:00:00")) ||
        dayData.times[Math.floor(dayData.times.length / 2)];

      // API is called with units: "metric", so temps are already in Celsius
      results.push({
        date: dateStr,
        temperature: {
          min: Math.round(minTemp),
          max: Math.round(maxTemp),
        },
        condition: midday?.condition || "Unknown",
        humidity: Math.round(
          dayData.humidities.reduce((a, b) => a + b, 0) /
            dayData.humidities.length
        ),
        wind_speed: Math.round(
          dayData.winds.reduce((a, b) => a + b, 0) /
            dayData.winds.length
        ),
      });
    }
    // ---------- 4️⃣ IF WEATHER DOES NOT EXIST ----------
    else {
      results.push({
        date: dateStr,
        temperature: {
          min: "-",
          max: "-",
        },
        condition: "-",
        humidity: "-",
        wind_speed: "-",
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return results;
}

export default transformWeatherData;
