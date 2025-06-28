// src/lib/api/weather.js
// const API_BASE_URL = 'https://weather-app-backend-ug2o.onrender.com'; // Stary render.com backend python
const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;


/**
 * Weather API Client for Tomorrow.io integration
 */
export class WeatherAPI {
  
  /**
   * Get current weather for location
   * @param {string} location - City name, coordinates, or address
   * @returns {Promise<Object>} Weather data
   */
  static async getCurrentWeather(location) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/${encodeURIComponent(location)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Weather API Error:', error);
      throw error;
    }
  }

  /**
   * Get weather description from weather code
   * @param {number} weatherCode - Tomorrow.io weather code
   * @returns {Promise<Object>} Weather description
   */
  static async getWeatherDescription(weatherCode) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/weather/description/${weatherCode}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Weather Description Error:', error);
      // Fallback descriptions
      return {
        weather_code: weatherCode,
        description: WeatherAPI.getLocalWeatherDescription(weatherCode)
      };
    }
  }

  /**
   * Local fallback weather descriptions
   * @param {number} code - Weather code
   * @returns {string} Description
   */
  static getLocalWeatherDescription(code) {
    const descriptions = {
      1000: "Jasno, slnečno",
      1100: "Prevažne jasno", 
      1101: "Čiastočne zamračené",
      1102: "Prevažne zamračené",
      1001: "Zamračené",
      2000: "Hmla",
      2100: "Ľahká hmla",
      4000: "Mrholenie",
      4001: "Dážď",
      4200: "Ľahký dážď",
      4201: "Silný dážď",
      5000: "Sneh",
      5001: "Snehové vločky",
      5100: "Ľahký sneh",
      5101: "Silný sneh",
      6000: "Mrznúce mrholenie",
      6001: "Mrznúci dážď",
      6200: "Ľahký mrznúci dážď",
      6201: "Silný mrznúci dážď",
      7000: "Ľadové guľôčky",
      7101: "Silné ľadové guľôčky",
      7102: "Ľahké ľadové guľôčky",
      8000: "Búrka"
    };
    
    return descriptions[code] || "Neznáme počasie";
  }

  /**
   * Get weather icon for weather code
   * @param {number} code - Weather code
   * @returns {string} Icon emoji
   */
  static getWeatherIcon(code) {
    const icons = {
      1000: "☀️",   // Clear
      1100: "🌤️",   // Mostly Clear
      1101: "⛅",   // Partly Cloudy
      1102: "🌥️",   // Mostly Cloudy
      1001: "☁️",   // Cloudy
      2000: "🌫️",   // Fog
      2100: "🌫️",   // Light Fog
      4000: "🌦️",   // Drizzle
      4001: "🌧️",   // Rain
      4200: "🌦️",   // Light Rain
      4201: "⛈️",   // Heavy Rain
      5000: "🌨️",   // Snow
      5001: "❄️",   // Flurries
      5100: "🌨️",   // Light Snow
      5101: "❄️",   // Heavy Snow
      6000: "🌧️",   // Freezing Drizzle
      6001: "🧊",   // Freezing Rain
      6200: "🧊",   // Light Freezing Rain
      6201: "🧊",   // Heavy Freezing Rain
      7000: "🧊",   // Ice Pellets
      7101: "🧊",   // Heavy Ice Pellets
      7102: "🧊",   // Light Ice Pellets
      8000: "⛈️"    // Thunderstorm
    };
    
    return icons[code] || "🌤️";
  }

  /**
   * Format wind direction from degrees to text
   * @param {number} degrees - Wind direction in degrees
   * @returns {string} Direction text
   */
  static getWindDirection(degrees) {
    const directions = [
      "Sever", "Severovýchod", "Východ", "Juhovýchod",
      "Juh", "Juhozápad", "Západ", "Severozápad"
    ];
    
    const index = Math.round(degrees / 45) % 8;
    return directions[index];
  }

  /**
   * Format temperature with unit
   * @param {number} temp - Temperature in Celsius
   * @returns {string} Formatted temperature
   */
  static formatTemperature(temp) {
    return `${Math.round(temp)}°C`;
  }

  /**
   * Format wind speed
   * @param {number} speed - Wind speed in m/s
   * @returns {string} Formatted wind speed
   */
  static formatWindSpeed(speed) {
    return `${speed.toFixed(1)} m/s`;
  }

  /**
   * Get weather status color based on conditions
   * @param {number} weatherCode - Weather code
   * @returns {string} CSS color class
   */
  static getWeatherColor(weatherCode) {
    if (weatherCode === 1000) return 'text-yellow-500'; // Sunny
    if (weatherCode >= 1100 && weatherCode <= 1102) return 'text-blue-400'; // Cloudy
    if (weatherCode >= 4000 && weatherCode <= 4201) return 'text-blue-600'; // Rain
    if (weatherCode >= 5000 && weatherCode <= 5101) return 'text-blue-200'; // Snow
    if (weatherCode === 8000) return 'text-purple-500'; // Thunderstorm
    return 'text-gray-500'; // Default
  }
}

/**
 * Weather data cache to reduce API calls
 */
export class WeatherCache {
  static cache = new Map();
  static CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static set(location, data) {
    this.cache.set(location.toLowerCase(), {
      data,
      timestamp: Date.now()
    });
  }

  static get(location) {
    const cached = this.cache.get(location.toLowerCase());
    
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > this.CACHE_DURATION;
    
    if (isExpired) {
      this.cache.delete(location.toLowerCase());
      return null;
    }
    
    return cached.data;
  }

  static clear() {
    this.cache.clear();
  }
}
