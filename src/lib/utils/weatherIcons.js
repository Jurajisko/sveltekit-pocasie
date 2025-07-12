// src/lib/utils/weatherIcons.js
export const weatherIcons = {
  // Denné ikony
  day: {
    0: "☀️",     // Clear sky
    1: "🌤️",     // Mainly clear  
    2: "⛅",     // Partly cloudy
    3: "☁️",     // Overcast
    45: "🌫️",    // Fog
    48: "🌫️",    // Depositing rime fog
    51: "🌦️",    // Light drizzle
    53: "🌧️",    // Moderate drizzle
    55: "🌧️",    // Dense drizzle
    61: "🌧️",    // Slight rain
    63: "🌧️",    // Moderate rain
    65: "🌧️",    // Heavy rain
    71: "🌨️",    // Slight snow
    73: "🌨️",    // Moderate snow
    75: "❄️",    // Heavy snow
    80: "🌧️",    // Slight rain showers
    81: "🌧️",    // Moderate rain showers
    82: "🌧️",    // Violent rain showers
    95: "⛈️",    // Thunderstorm
    96: "⛈️",    // Thunderstorm with slight hail
    99: "⛈️"     // Thunderstorm with heavy hail
  },
  
  // Nočné ikony
  night: {
    0: "🌙",     // Clear night
    1: "🌙",     // Mainly clear night
    2: "☁️",     // Partly cloudy night
    3: "☁️",     // Overcast night
    45: "🌫️",    // Fog (same)
    48: "🌫️",    // Depositing rime fog (same)
    51: "🌧️",    // Light drizzle (same)
    53: "🌧️",    // Moderate drizzle (same)
    55: "🌧️",    // Dense drizzle (same)
    61: "🌧️",    // Slight rain (same)
    63: "🌧️",    // Moderate rain (same)
    65: "🌧️",    // Heavy rain (same)
    71: "🌨️",    // Slight snow (same)
    73: "🌨️",    // Moderate snow (same)
    75: "❄️",    // Heavy snow (same)
    80: "🌧️",    // Slight rain showers (same)
    81: "🌧️",    // Moderate rain showers (same)
    82: "🌧️",    // Violent rain showers (same)
    95: "⛈️",    // Thunderstorm (same)
    96: "⛈️",    // Thunderstorm with slight hail (same)
    99: "⛈️"     // Thunderstorm with heavy hail (same)
  }
};

// Funkcia na určenie či je deň/noc
export function isDayTime(time = null, lat = null, lng = null) {
  const now = time ? new Date(time) : new Date();
  const hour = now.getHours();
  
  // Základná logika: 6:00 - 20:00 = deň
  // Môžeš rozšíriť o sunrise/sunset API neskôr
  return hour >= 6 && hour < 20;
}

// Hlavná funkcia pre získanie správnej ikony
export function getWeatherIcon(weatherCode, time = null, lat = null, lng = null) {
  const code = parseInt(weatherCode);
  const isDay = isDayTime(time, lat, lng);
  
  return isDay 
    ? weatherIcons.day[code] || "☀️"
    : weatherIcons.night[code] || "🌙";
}