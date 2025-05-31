<!-- src/lib/components/WeatherCard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { WeatherAPI } from '../api/weather.js';

  // Props
  export let location = '';
  export let autoRefresh = false;
  export let refreshInterval = 300000; // 5 minutes

  // State
  let weatherData = null;
  let loading = true;
  let error = null;
  let lastUpdated = null;

  // Reactive weather info
  $: temperature = weatherData?.weather?.temperature || 0;
  $: weatherCode = weatherData?.weather?.weatherCode || 1000;
  $: weatherIcon = WeatherAPI.getWeatherIcon(weatherCode);
  $: weatherDescription = WeatherAPI.getLocalWeatherDescription(weatherCode);
  $: windDirection = WeatherAPI.getWindDirection(weatherData?.weather?.windDirection || 0);
  $: temperatureColor = WeatherAPI.getWeatherColor(weatherCode);

  /**
   * Fetch weather data for location
   */
  async function fetchWeather() {
    if (!location) return;
    
    try {
      loading = true;
      error = null;
      
      console.log(`🌤️ Fetching weather for: ${location}`);
      
      const data = await WeatherAPI.getCurrentWeather(location);
      weatherData = data;
      lastUpdated = new Date();
      
      console.log('✅ Weather data received:', data);
      
    } catch (err) {
      console.error('❌ Weather fetch error:', err);
      error = err.message || 'Chyba pri načítaní počasia';
      weatherData = null;
    } finally {
      loading = false;
    }
  }

  /**
   * Format last updated time
   */
  function formatLastUpdated(date) {
    if (!date) return '';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return 'pred chvíľou';
    if (diff < 3600) return `pred ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `pred ${Math.floor(diff / 3600)} h`;
    
    return date.toLocaleDateString('sk-SK');
  }

  /**
   * Refresh weather data
   */
  function refreshWeather() {
    fetchWeather();
  }

  // Auto-refresh setup
  let refreshTimer;
  
  $: if (autoRefresh && refreshInterval > 0) {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(fetchWeather, refreshInterval);
  }

  // Fetch weather on mount and location change
  onMount(() => {
    if (location) {
      fetchWeather();
    }
    
    // Cleanup on unmount
    return () => {
      if (refreshTimer) clearInterval(refreshTimer);
    };
  });

  // Refetch when location changes
  $: if (location) {
    fetchWeather();
  }
</script>

<div class="weather-card">
  <!-- Header -->
  <div class="weather-header">
    <h2 class="location-name">
      📍 {location || 'Vyberte lokalitu'}
    </h2>
    
    <button 
      class="refresh-btn"
      on:click={refreshWeather}
      disabled={loading}
      title="Obnoviť počasie"
    >
      <span class="refresh-icon" class:spinning={loading}>🔄</span>
    </button>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="loading-state">
      <div class="loading-spinner">⏳</div>
      <p>Načítavam počasie...</p>
    </div>
  
  <!-- Error State -->
  {:else if error}
    <div class="error-state">
      <div class="error-icon">❌</div>
      <p class="error-message">{error}</p>
      <button class="retry-btn" on:click={refreshWeather}>
        Skúsiť znovu
      </button>
    </div>

  <!-- Weather Data -->
  {:else if weatherData}
    <div class="weather-content">
      
      <!-- Main Weather Display -->
      <div class="main-weather">
        <div class="weather-icon-large">
          {weatherIcon}
        </div>
        
        <div class="temperature-section">
          <div class="temperature {temperatureColor}">
            {WeatherAPI.formatTemperature(temperature)}
          </div>
          <div class="weather-description">
            {weatherDescription}
          </div>
        </div>
      </div>

      <!-- Weather Details Grid -->
      <div class="weather-details">
        
        <div class="detail-item">
          <div class="detail-icon">💧</div>
          <div class="detail-content">
            <div class="detail-label">Vlhkosť</div>
            <div class="detail-value">{weatherData.weather.humidity}%</div>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">💨</div>
          <div class="detail-content">
            <div class="detail-label">Vietor</div>
            <div class="detail-value">
              {WeatherAPI.formatWindSpeed(weatherData.weather.windSpeed)}
              <br>
              <span class="wind-direction">{windDirection}</span>
            </div>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">👁️</div>
          <div class="detail-content">
            <div class="detail-label">Viditeľnosť</div>
            <div class="detail-value">{weatherData.weather.visibility} km</div>
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-icon">☁️</div>
          <div class="detail-content">
            <div class="detail-label">Oblačnosť</div>
            <div class="detail-value">{weatherData.weather.cloudCover}%</div>
          </div>
        </div>

      </div>

      <!-- Footer Info -->
      <div class="weather-footer">
        <div class="last-updated">
          Aktualizované: {formatLastUpdated(lastUpdated)}
        </div>
        
        <div class="data-source">
          Powered by Tomorrow.io
        </div>
      </div>

    </div>

  <!-- No Data State -->
  {:else}
    <div class="no-data-state">
      <div class="no-data-icon">🌤️</div>
      <p>Zadajte lokalitu pre zobrazenie počasia</p>
    </div>
  {/if}
</div>

<style>
  .weather-card {
    max-width: 400px;
    margin: 0 auto;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 24px;
    color: white;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .weather-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .location-name {
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    flex: 1;
  }

  .refresh-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .refresh-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.05);
  }

  .refresh-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .refresh-icon {
    font-size: 1.2rem;
    transition: transform 0.3s ease;
  }

  .refresh-icon.spinning {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .loading-state, .error-state, .no-data-state {
    text-align: center;
    padding: 40px 20px;
  }

  .loading-spinner, .error-icon, .no-data-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .error-message {
    margin: 16px 0;
    opacity: 0.9;
  }

  .retry-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    color: white;
    cursor: pointer;
    transition: background 0.3s ease;
  }

  .retry-btn:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  .main-weather {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32px;
    gap: 24px;
  }

  .weather-icon-large {
    font-size: 4rem;
  }

  .temperature-section {
    text-align: center;
  }

  .temperature {
    font-size: 3rem;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 8px;
  }

  .weather-description {
    font-size: 1.1rem;
    opacity: 0.9;
    font-weight: 500;
  }

  .weather-details {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .detail-item {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 12px;
    border-radius: 12px;
  }

  .detail-icon {
    font-size: 1.5rem;
  }

  .detail-content {
    flex: 1;
  }

  .detail-label {
    font-size: 0.85rem;
    opacity: 0.8;
    margin-bottom: 4px;
  }

  .detail-value {
    font-weight: 600;
    font-size: 0.95rem;
  }

  .wind-direction {
    font-size: 0.8rem;
    opacity: 0.8;
  }

  .weather-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    opacity: 0.7;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    padding-top: 16px;
  }

  /* Responsive design */
  @media (max-width: 480px) {
    .weather-card {
      margin: 16px;
      padding: 20px;
    }

    .main-weather {
      flex-direction: column;
      gap: 16px;
    }

    .weather-details {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .weather-footer {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }
  }

  /* Color utilities */
  .text-yellow-500 { color: #eab308; }
  .text-blue-400 { color: #60a5fa; }
  .text-blue-600 { color: #2563eb; }
  .text-blue-200 { color: #bfdbfe; }
  .text-purple-500 { color: #a855f7; }
  .text-gray-500 { color: #6b7280; }
</style>
