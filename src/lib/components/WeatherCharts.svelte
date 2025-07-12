<!-- src/lib/components/WeatherCharts.svelte -->
<script>
  import { getWeatherIcon } from '$lib/utils/weatherIcons.js';

  export let weatherData = null;
  
  // Temperature unit state
  let temperatureUnit = 'celsius'; // 'celsius' or 'fahrenheit'
  
  // Switch temperature unit
  function switchTemperatureUnit(unit) {
    temperatureUnit = unit;
    // Trigger re-fetch with new unit
    if (weatherData?.extended) {
      dispatchUnitChange(unit);
    }
  }
  
  // Dispatch event to parent component to re-fetch weather data
  function dispatchUnitChange(unit) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('temperatureUnitChanged', { 
        detail: { unit } 
      }));
    }
  }
  
  // Convert temperature for display (if needed as fallback)
  function convertTemp(tempC) {
    if (temperatureUnit === 'fahrenheit') {
      return Math.round((tempC * 9/5) + 32);
    }
    return Math.round(tempC);
  }
  
  // Get unit symbol
  function getUnitSymbol() {
    return temperatureUnit === 'fahrenheit' ? '°F' : '°C';
  }
  
  // Extract data from weatherData with temperature conversion
  $: temperatureData = weatherData?.extended?.daily ? 
    weatherData.extended.daily.time.slice(0, 7).map((time, i) => ({
      day: new Date(time).toLocaleDateString('sk', {weekday: 'short'}),
      max: convertTemp(weatherData.extended.daily.temperature_2m_max[i]),
      min: convertTemp(weatherData.extended.daily.temperature_2m_min[i])
    })) : [];
    
  $: precipitationData = weatherData?.extended?.daily ? 
    weatherData.extended.daily.time.slice(0, 7).map((time, i) => {
      const precipitation = weatherData.extended.daily.precipitation_sum[i] || 0;
      // Calculate chance based on precipitation amount (stable calculation)
      const chance = precipitation > 0 ? Math.min(Math.round(precipitation * 15 + 10), 100) : 0;
      
      return {
        day: new Date(time).toLocaleDateString('sk', {weekday: 'short'}),
        value: precipitation,
        chance: chance
      };
    }) : [];
    
  $: windData = weatherData?.extended?.daily ? 
    weatherData.extended.daily.time.slice(0, 7).map((time, i) => ({
      day: new Date(time).toLocaleDateString('sk', {weekday: 'short'}),
      value: weatherData.extended.daily.wind_speed_10m_max[i] || 0
    })) : [];
  
  // Calculate ranges for temperature bars
  $: maxTemp = Math.max(...(temperatureData.map(d => d.max) || [30]));
  $: minTemp = Math.min(...(temperatureData.map(d => d.min) || [10]));
  $: tempRange = maxTemp - minTemp + 10;
  
  $: maxPrecip = Math.max(...(precipitationData.map(d => d.value) || [5]), 5);
  $: maxWind = Math.max(...(windData.map(d => d.value) || [10]), 10);
  
  // Generate weather icons based on temp/conditions and time (stable logic)
  /*
  function getDayWeatherIcon(temp, precipitation, index) {
    // Use index for consistent weather patterns across renders
    const weatherSeed = index % 4;
    
    if (precipitation > 5) return "⛈️"; // Heavy rain
    if (precipitation > 1) return "🌧️"; // Light rain  
    if (temp > 25) return "☀️"; // Hot sunny
    if (temp > 20) return weatherSeed === 0 ? "☀️" : "⛅"; // Warm
    if (temp > 15) return weatherSeed <= 1 ? "⛅" : "☁️"; // Mild
    return "☁️"; // Cool
  }
  
  function getNightWeatherIcon(temp, precipitation, index) {
    const weatherSeed = index % 4;
    
    if (precipitation > 5) return "⛈️"; // Heavy rain
    if (precipitation > 1) return "🌧️"; // Light rain
    if (temp > 15) return weatherSeed <= 1 ? "🌙" : "☁️"; // Clear/cloudy night
    return "☁️"; // Cool cloudy night
  }
    */

  function getDayWeatherIcon(temp, precipitation, index, date) {
    // Simuluj denný čas pre forecast
    const dayTime = new Date(date);
    dayTime.setHours(14); // 14:00 = deň
    
    // Základný weather code na základe podmienok
    let weatherCode = 0; // sunny default
    if (precipitation > 5) weatherCode = 95; // thunderstorm
    else if (precipitation > 1) weatherCode = 61; // rain
    else if (temp > 25) weatherCode = 0; // sunny
    else if (temp > 20) weatherCode = index % 2 === 0 ? 0 : 2; // sunny/partly cloudy
    else if (temp > 15) weatherCode = index % 2 === 0 ? 2 : 3; // partly/cloudy
    else weatherCode = 3; // cloudy
    
    return getWeatherIcon(weatherCode, dayTime);
  }
  
  function getNightWeatherIcon(temp, precipitation, index, date) {
    // Simuluj nočný čas pre forecast
    const nightTime = new Date(date);
    nightTime.setHours(22); // 22:00 = noc
    
    // Rovnaká logika ako pre deň
    let weatherCode = 0;
    if (precipitation > 5) weatherCode = 95;
    else if (precipitation > 1) weatherCode = 61;
    else if (temp > 15) weatherCode = index % 2 === 0 ? 0 : 3;
    else weatherCode = 3;
    
    return getWeatherIcon(weatherCode, nightTime);
  }
  
  // Dynamic temperature positioning with safe boundaries
  function getTempPosition(temp) {
    // Calculate actual min/max from current data for dynamic range
    const actualMin = Math.min(...temperatureData.flatMap(d => [d.min, d.max]));
    const actualMax = Math.max(...temperatureData.flatMap(d => [d.min, d.max]));
    
    // Add small padding for better visual
    const padding = (actualMax - actualMin) * 0.1;
    const minScale = actualMin - padding;
    const maxScale = actualMax + padding;
    const range = maxScale - minScale;
    
    // Calculate position with safe boundaries (20% = bottom, 80% = top)
    const position = ((temp - minScale) / range) * 60 + 20;
    return Math.max(20, Math.min(80, position));
  }
</script>

{#if !weatherData?.extended}
  <div class="loading-state">
    <div class="loading-spinner"></div>
    <p>Načítavam počasie...</p>
  </div>
{:else}

<!-- 🌡️ TEMPERATURE CHART - Consistent with weather-display -->
<div class="chart-container">
  <div class="chart-header">
    <h3>7-dňová predpoveď</h3>
    <div class="temp-switch">
      <button 
        class:active={temperatureUnit === 'celsius'}
        on:click={() => switchTemperatureUnit('celsius')}
      >
        °C
      </button>
      <button 
        class:active={temperatureUnit === 'fahrenheit'}
        on:click={() => switchTemperatureUnit('fahrenheit')}
      >
        °F
      </button>
    </div>
  </div>
  
  <div class="temp-chart-wrapper">
    <div class="temp-chart">
      {#each temperatureData as data, i}
        {@const precip = precipitationData[i]?.value || 0}
        {@const originalTemp = weatherData?.extended?.daily ? weatherData.extended.daily.temperature_2m_max[i] : data.max}
        <!-- {@const dayIcon = getDayWeatherIcon(originalTemp, precip, i)}
        {@const nightIcon = getNightWeatherIcon(originalTemp, precip, i)} -->
        {@const dayIcon = getDayWeatherIcon(originalTemp, precip, i, data.time)}
        {@const nightIcon = getNightWeatherIcon(originalTemp, precip, i, data.time)}
        {@const maxPos = getTempPosition(data.max)}
        {@const minPos = getTempPosition(data.min)}
        {@const barHeight = Math.abs(maxPos - minPos)}
        {@const barBottom = Math.min(maxPos, minPos)}
        
        <div class="temp-day-column">
          <!-- Day label -->
          <div class="day-label">
            {data.day.toUpperCase()}
          </div>
          
          <!-- Day weather icon (above max temp) -->
          <div class="weather-icon-day" style="position: absolute; bottom: {Math.min(maxPos + 18, 95)}%; left: 50%; transform: translateX(-50%);">
            {dayIcon}
          </div>
          
          <!-- Max temperature (above bar) -->
          <div class="temp-max" style="position: absolute; bottom: {Math.min(maxPos + 8, 88)}%; left: 50%; transform: translateX(-50%);">
            {data.max}{getUnitSymbol()}
          </div>
          
          <!-- Temperature bar showing range -->
          <div 
            class="temp-bar"
            style="
              position: absolute;
              bottom: {barBottom}%;
              height: {barHeight}%;
              width: 20px;
              left: 50%;
              transform: translateX(-50%);
            "
          ></div>
          
          <!-- Min temperature (below bar) -->
          <div class="temp-min" style="position: absolute; bottom: {Math.max(minPos - 8, 12)}%; left: 50%; transform: translateX(-50%);">
            {data.min}{getUnitSymbol()}
          </div>
          
          <!-- Night weather icon (below min temp) -->
          <div class="weather-icon-night" style="position: absolute; bottom: {Math.max(minPos - 18, 5)}%; left: 50%; transform: translateX(-50%);">
            {nightIcon}
          </div>
          
          <!-- Precipitation chance at bottom -->
          {#if precipitationData[i] && precipitationData[i].chance > 0}
            <div class="precip-chance" style="position: absolute; bottom: -45px; left: 50%; transform: translateX(-50%);">
              <span class="rain-icon">💧</span>
              {precipitationData[i].chance}%
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- 🌧️ PRECIPITATION CHART - Consistent styling -->
<div class="chart-container">
  <div class="chart-header">
    <h3>Zrážky tento týždeň</h3>
    <div class="unit-label">mm</div>
  </div>
  
  <div class="precip-chart">
    {#each precipitationData as data, i}
      {@const percentage = (data.value / maxPrecip) * 100}
      
      <div class="precip-column">
        <div class="precip-value">
          {data.value > 0 ? data.value.toFixed(1) : '0'}
        </div>
        
        <div class="precip-bar-container">
          <div 
            class="precip-bar"
            style="height: {Math.max(percentage, 3)}%"
          ></div>
        </div>
        
        <div class="precip-day">
          {data.day.toUpperCase()}
        </div>
      </div>
    {/each}
  </div>
</div>

<!-- 💨 WIND CHART - Consistent styling -->
<div class="chart-container">
  <div class="chart-header">
    <h3>Vietor</h3>
    <div class="unit-label">m/s</div>
  </div>
  
  <div class="wind-chart">
    {#each windData as data, i}
      {@const percentage = (data.value / maxWind) * 100}
      
      <div class="wind-column">
        <div class="wind-value">
          {data.value.toFixed(1)}
        </div>
        
        <div class="wind-indicator">
          <div 
            class="wind-circle"
            style="transform: scale({Math.max(percentage / 100, 0.3)});"
          >
            <div class="wind-arrow">↗</div>
          </div>
        </div>
        
        <div class="wind-day">
          {data.day.toUpperCase()}
        </div>
      </div>
    {/each}
  </div>
</div>

{/if}

<!-- <style>
  /* 🎨 CONSISTENT WITH WEATHER-DISPLAY THEME SYSTEM */
  .chart-container {
    background: var(--bg-primary);
    backdrop-filter: blur(30px);
    border: 1px solid var(--border-primary);
    box-shadow: var(--shadow-primary);
    color: var(--text-primary);
    border-radius: 20px;
    padding: 24px;
    margin-bottom: 20px;
    font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    transition: all 0.3s ease;
    animation: slideInUp 0.6s ease-out;
  }
  
  .chart-container:hover {
    box-shadow: var(--shadow-hover);
    border-color: var(--primary-color);
  }
  
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .chart-header h3 {
    color: var(--text-primary);
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }
  
  .temp-switch {
    display: flex;
    background: var(--bg-glass);
    border: 1px solid var(--border-secondary);
    border-radius: 20px;
    overflow: hidden;
  }
  
  .temp-switch button {
    background: none;
    border: none;
    color: var(--text-secondary);
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .temp-switch button.active {
    background: var(--gradient-2);
    color: var(--text-primary);
    border: 1px solid var(--border-primary);
  }
  
  .temp-switch button:hover {
    color: var(--primary-color);
  }
  
  .unit-label {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 500;
  }
  
  /* 🌡️ TEMPERATURE CHART */
  .temp-chart-wrapper {
    background: var(--gradient-2);
    border: 1px solid var(--border-secondary);
    border-radius: 16px;
    padding: 50px 16px 60px 16px;
    backdrop-filter: blur(5px);
    overflow: hidden;
  }
  
  .temp-chart {
    display: flex;
    justify-content: space-between;
    align-items: end;
    height: 300px;
    gap: 8px;
    position: relative;
  }
  
  .temp-day-column {
    flex: 1;
    position: relative;
    height: 100%;
    min-height: 300px;
  }
  
  .day-label {
    color: var(--text-secondary);
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.5px;
    position: absolute;
    bottom: -30px;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  
  .weather-icon-day {
    font-size: 22px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    position: absolute;
    z-index: 3;
  }
  
  .weather-icon-night {
    font-size: 18px;
    filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
    opacity: 0.8;
    position: absolute;
    z-index: 3;
  }
  
  .temp-max {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: 700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    position: absolute;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    white-space: nowrap;
    z-index: 2;
  }
  
  .temp-bar {
    background: var(--gradient-1);
    border-radius: 10px;
    border: 1px solid var(--border-primary);
    box-shadow: 
      inset 0 2px 4px var(--bg-glass),
      0 2px 8px var(--shadow-primary);
    transition: all 0.3s ease;
    min-height: 20px;
  }
  
  .temp-bar:hover {
    border-color: var(--primary-color);
    box-shadow: 
      inset 0 2px 4px var(--bg-glass),
      0 4px 16px var(--shadow-hover);
  }
  
  .temp-bar::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    height: 30%;
    background: var(--bg-glass-hover);
    border-radius: 8px 8px 0 0;
  }
  
  .temp-min {
    color: var(--text-secondary);
    font-size: 14px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    position: absolute;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
    white-space: nowrap;
    z-index: 2;
  }
  
  .precip-chance {
    color: var(--text-secondary);
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 2px;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  
  .rain-icon {
    font-size: 10px;
  }
  
  /* 🌧️ PRECIPITATION CHART */
  .precip-chart {
    display: flex;
    justify-content: space-between;
    align-items: end;
    height: 120px;
    gap: 12px;
    padding: 0 8px;
  }
  
  .precip-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }
  
  .precip-value {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
    min-height: 16px;
  }
  
  .precip-bar-container {
    flex: 1;
    width: 16px;
    position: relative;
    margin: 4px 0;
    min-height: 40px;
  }
  
  .precip-bar {
    width: 100%;
    background: var(--gradient-1);
    border: 1px solid var(--border-primary);
    border-radius: 8px;
    box-shadow: 0 2px 8px var(--shadow-primary);
    position: absolute;
    bottom: 0;
    transition: all 0.3s ease;
  }
  
  .precip-bar:hover {
    transform: scaleX(1.2);
    border-color: var(--primary-color);
    box-shadow: 0 4px 16px var(--shadow-hover);
  }
  
  .precip-day {
    color: var(--text-secondary);
    font-size: 10px;
    font-weight: 600;
    margin-top: 8px;
    letter-spacing: 0.5px;
  }
  
  /* 💨 WIND CHART */
  .wind-chart {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 100px;
    gap: 12px;
    padding: 0 8px;
  }
  
  .wind-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .wind-value {
    color: var(--text-primary);
    font-size: 13px;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  }
  
  .wind-indicator {
    position: relative;
  }
  
  .wind-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    border: 2px solid var(--border-primary);
    background: var(--gradient-2);
    backdrop-filter: blur(10px);
  }
  
  .wind-circle:hover {
    border-color: var(--primary-color);
    background: var(--bg-glass-hover);
    transform: scale(1.1) !important;
  }
  
  .wind-arrow {
    color: var(--text-primary);
    font-size: 16px;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
    transform: rotate(45deg);
  }
  
  .wind-day {
    color: var(--text-secondary);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  
  /* 📱 LOADING STATE */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--text-secondary);
    background: var(--bg-primary);
    backdrop-filter: blur(30px);
    border: 1px solid var(--border-primary);
    border-radius: 20px;
    margin-bottom: 20px;
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--border-secondary);
    border-top: 3px solid var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .loading-state p {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }
  
  /* 📱 RESPONSIVE */
  @media (max-width: 1195px) {
    .chart-container {
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .temp-chart {
      height: 160px;
      gap: 4px;
    }
    
    .weather-icon-temp {
      font-size: 16px;
    }
    
    .temp-max, .precip-value, .wind-value {
      font-size: 12px;
    }
    
    .temp-min, .precip-day, .wind-day {
      font-size: 9px;
    }
    
    .temp-bar-container {
      width: 16px;
      min-height: 40px;
    }
    
    .wind-circle {
      width: 32px;
      height: 32px;
    }
    
    .wind-arrow {
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    .chart-header h3 {
      font-size: 16px;
    }
    
    .temp-chart {
      height: 140px;
    }
    
    .precip-chart, .wind-chart {
      height: 80px;
    }
  }
</style> -->

