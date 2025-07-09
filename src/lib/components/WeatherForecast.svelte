<!-- WeatherForecast.svelte -->
<script>
  // Remove onMount since we're using props
  // import { onMount } from 'svelte';

  export let location = 'Martin, SK';
  export let days = 7; // 7 alebo 14
  export let forecastData = []; // Dynamické dáta z props
  export let isLoading = false;
  export let errorMessage = null;
  
  let selectedView = 'BY DAY';

  // Reactive statement - automaticky sa updatuje keď sa zmenia props
  $: forecast = forecastData.length > 0 ? forecastData.slice(0, days) : [];
  $: loading = isLoading;
  $: error = errorMessage;

  function getBarHeight(temp, minTemp, maxTemp) {
    const range = maxTemp - minTemp;
    const ratio = (temp - minTemp) / range;
    return Math.max(20, ratio * 100);
  }

  const allTemps = forecast.length > 0 
    ? forecast.flatMap(d => [d.high, d.low])
    : [0, 30]; // Fallback values
  const minTemp = Math.min(...allTemps);
  const maxTemp = Math.max(...allTemps);
</script>

<div class="forecast-container">
  <!-- Header -->
  <div class="header">
    <h2 class="month">July</h2>
    <div class="view-toggle">
      <button 
        class="toggle-btn {selectedView === 'BY DAY' ? 'active' : ''}"
        on:click={() => selectedView = 'BY DAY'}
      >
        BY DAY
      </button>
      <button 
        class="toggle-btn {selectedView === days + ' DAYS' ? 'active' : ''}"
        on:click={() => selectedView = days + ' DAYS'}
      >
        {days} DAYS
      </button>
    </div>
    <div class="temp-unit">°C</div>
  </div>

  {#if loading}
    <div class="loading">Načítavam predpoveď...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <!-- Forecast Grid -->
    <div class="forecast-grid">
      <!-- Days row -->
      <div class="days-row">
        {#each forecast as day}
          <div class="day-cell">
            <div class="day-letter">{day.day}</div>
            <div class="day-number">{day.date.split(' ')[1]}</div>
          </div>
        {/each}
      </div>

      <!-- Weather icons row -->
      <div class="icons-row">
        {#each forecast as day}
          <div class="icon-cell">
            <div class="weather-icon">{day.icon}</div>
          </div>
        {/each}
      </div>

      <!-- Temperature bars -->
      <div class="temp-bars">
        {#each forecast as day}
          <div class="temp-column">
            <!-- High temp -->
            <div class="high-temp">{day.high}°</div>
            
            <!-- Temperature bar -->
            <div class="temp-bar-container">
              <div 
                class="temp-bar"
                style="height: {getBarHeight(day.high, minTemp, maxTemp)}px"
              ></div>
            </div>
            
            <!-- Low temp -->
            <div class="low-temp">{day.low}°</div>
            
            <!-- Rain probability -->
            <div class="rain-prob">
              <span class="rain-icon">💧</span>
              {day.rain}%
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .forecast-container {
    background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
    color: white;
    border-radius: 16px;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
  }

  .month {
    font-size: 24px;
    font-weight: 300;
    margin: 0;
  }

  .view-toggle {
    display: flex;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 2px;
  }

  .toggle-btn {
    background: none;
    border: none;
    color: white;
    padding: 8px 16px;
    border-radius: 18px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .toggle-btn.active {
    background: rgba(255, 255, 255, 0.2);
  }

  .temp-unit {
    font-size: 18px;
    font-weight: 300;
  }

  .loading, .error {
    text-align: center;
    padding: 40px;
    font-size: 16px;
  }

  .error {
    color: #ff6b6b;
  }

  .forecast-grid {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .days-row, .icons-row {
    display: flex;
    justify-content: space-between;
  }

  .day-cell {
    text-align: center;
    min-width: 40px;
  }

  .day-letter {
    font-size: 14px;
    font-weight: 400;
    margin-bottom: 4px;
  }

  .day-number {
    font-size: 18px;
    font-weight: 300;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .icon-cell {
    text-align: center;
    min-width: 40px;
  }

  .weather-icon {
    font-size: 24px;
  }

  .temp-bars {
    display: flex;
    justify-content: space-between;
    align-items: end;
    height: 200px;
    margin-top: 20px;
  }

  .temp-column {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 40px;
    height: 100%;
  }

  .high-temp {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .temp-bar-container {
    flex: 1;
    display: flex;
    align-items: end;
    margin: 8px 0;
  }

  .temp-bar {
    width: 12px;
    background: linear-gradient(to top, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.8));
    border-radius: 6px;
    min-height: 20px;
  }

  .low-temp {
    font-size: 14px;
    font-weight: 400;
    margin-top: 8px;
    opacity: 0.8;
  }

  .rain-prob {
    display: flex;
    align-items: center;
    gap: 2px;
    font-size: 12px;
    margin-top: 8px;
    opacity: 0.9;
  }

  .rain-icon {
    font-size: 10px;
  }

  /* Mobile responsive */
  @media (max-width: 640px) {
    .forecast-container {
      padding: 16px;
    }
    
    .header {
      flex-direction: column;
      gap: 16px;
      text-align: center;
    }
    
    .temp-bars {
      height: 150px;
    }
    
    .day-number {
      width: 28px;
      height: 28px;
      font-size: 16px;
    }
    
    .weather-icon {
      font-size: 20px;
    }
  }
</style>