<!-- src/lib/components/WeatherCharts.svelte -->
<script>
  import { i18n } from '$lib/i18n/index.js';
  import { currentLanguage } from '$lib/stores/language.js';
  import { temperatureUnit, convertTemp, unitSymbol } from '$lib/stores/temperatureUnit.js';

  $: t = $i18n;
  $: lang = $currentLanguage;
  $: unit = $temperatureUnit;

  export let weatherData = null;
  export let precipEl = null;
  export let windEl = null;
  export let syncScroll = null;

  $: precipitationData = weatherData?.extended?.daily ?
    weatherData.extended.daily.time.slice(0, 15).map((time, i) => {
      const precipitation = weatherData.extended.daily.precipitation_sum[i] || 0;
      const snowfall = weatherData.extended.daily.snowfall_sum?.[i] || 0;
      return {
        day: new Date(time).toLocaleDateString(lang, { weekday: 'short' }),
        value: precipitation,
        snowfall: snowfall,
      };
    }) : [];

  $: maxPrecip = Math.max(...(precipitationData.map(d => d.value) || [5]), 5);

  $: windData = weatherData?.extended?.daily ?
    weatherData.extended.daily.time.slice(0, 15).map((time, i) => ({
      day: new Date(time).toLocaleDateString(lang, { weekday: 'short' }),
      value: weatherData.extended.daily.wind_speed_10m_max[i] || 0,
      dir: weatherData.extended.daily.wind_direction_10m_dominant?.[i] ?? null
    })) : [];

  $: maxWind = Math.max(...(windData.map(d => d.value) || [10]), 10);

  function getWindArrow(deg) {
    if (deg === null || deg === undefined) return '↗';
    const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
    return dirs[Math.round(deg / 45) % 8];
  }
</script>

{#if !weatherData?.extended}
  <div class="loading-state">
    <div class="loading-spinner"></div>
    <p>{t('loading')}...</p>
  </div>
{:else}

<!-- ☁️ METEOGRAM (slot — rendered from parent with lat/lng) -->
<div class="chart-container" id="section-meteogram">
  <div class="chart-header">
    <h3>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
      {t('precipitation')}
    </h3>
  </div>
  <div class="precip-chart" bind:this={precipEl} on:scroll={() => syncScroll?.(precipEl)}>
    {#each precipitationData as data}
      {@const percentage = (data.value / maxPrecip) * 100}
      <div class="precip-column">
        <div class="precip-value">
          {#if data.snowfall > 0}
            ❄️ {data.snowfall.toFixed(1)}<span style="font-size:14px"> cm</span>
          {:else}
            {data.value > 0 ? data.value.toFixed(1) : '0'}<span style="font-size:14px"> mm</span>
          {/if}
        </div>
        <div class="precip-bar-container">
          <div class="precip-bar" class:snow-bar={data.snowfall > 0} style="height: {Math.max(percentage, 3)}%"></div>
        </div>
        <div class="precip-day">{data.day.toUpperCase()}</div>
      </div>
    {/each}
  </div>
</div>

<!-- 💨 WIND CHART -->
<div class="chart-container" id="section-wind">
  <div class="chart-header">
    <h3>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
      {t('wind')}
    </h3>
    <div class="unit-label">m/s</div>
  </div>

  <div class="wind-chart" bind:this={windEl} on:scroll={() => syncScroll?.(windEl)}>
    {#each windData as data}
      {@const percentage = (data.value / maxWind) * 100}
      <div class="wind-column">
        <div class="wind-value">{data.value.toFixed(1)}</div>
        <div class="wind-indicator">
          <div class="wind-circle" style="transform: scale({Math.max(percentage / 100, 0.3)});">
            <div class="wind-arrow">{getWindArrow(data.dir)}</div>
          </div>
        </div>
        <div class="wind-day">{data.day.toUpperCase()}</div>
      </div>
    {/each}
  </div>
</div>

{/if}

