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
      min: convertTemp(weatherData.extended.daily.temperature_2m_min[i]),
       time: time  // ✅ PRIDAJ TOTO!
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


  // function getDayWeatherIcon(temp, precipitation, index, date) {
  //   // Simuluj denný čas pre forecast
  //   const dayTime = new Date(date);
  //   dayTime.setHours(14); // 14:00 = deň
    
  //   // Základný weather code na základe podmienok
  //   let weatherCode = 0; // sunny default
  //   if (precipitation > 5) weatherCode = 95; // thunderstorm
  //   else if (precipitation > 1) weatherCode = 61; // rain
  //   else if (temp > 25) weatherCode = 0; // sunny
  //   else if (temp > 20) weatherCode = index % 2 === 0 ? 0 : 2; // sunny/partly cloudy
  //   else if (temp > 15) weatherCode = index % 2 === 0 ? 2 : 3; // partly/cloudy
  //   else weatherCode = 3; // cloudy
    
  //   return getWeatherIcon(weatherCode, dayTime);
  // }
  
  // function getNightWeatherIcon(temp, precipitation, index, date) {
  //   // Simuluj nočný čas pre forecast
  //   const nightTime = new Date(date);
  //   nightTime.setHours(22); // 22:00 = noc
    
  //   // Rovnaká logika ako pre deň
  //   let weatherCode = 0;
  //   if (precipitation > 5) weatherCode = 95;
  //   else if (precipitation > 1) weatherCode = 61;
  //   else if (temp > 15) weatherCode = index % 2 === 0 ? 0 : 3;
  //   else weatherCode = 3;
    
  //   return getWeatherIcon(weatherCode, nightTime);
  // }
  
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
        <!-- {@const dayIcon = getDayWeatherIcon(originalTemp, precip, i, data.time)}
        {@const nightIcon = getNightWeatherIcon(originalTemp, precip, i, data.time)} -->
        <!-- ✅ OPRAVENÉ - správny path k weather codes: -->
        {@const realWeatherCode = weatherData.daily.weathercode[i]}
        {@const dayIcon = getWeatherIcon(realWeatherCode, weatherData.daily.time[i] + 'T12:00')}
        {@const nightIcon = getWeatherIcon(realWeatherCode, weatherData.daily.time[i] + 'T22:00')}
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