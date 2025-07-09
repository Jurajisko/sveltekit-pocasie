<script>
  import { onMount } from 'svelte';

  // Props (nastavenia z vonku)
  export let width = "100vw";
  export let height = "100vh";
  export let center = [19.5, 48.7]; // Slovensko
  export let zoom = 7;

  let mapDiv;
  let activeLayer = null;
  let pointerLngLat = null;

  const weatherLayers = {
    precipitation: { layer: null, value: 'value', units: ' mm' },
    pressure: { layer: null, value: 'value', units: ' hPa' },
    radar: { layer: null, value: 'value', units: ' dBZ' },
    temperature: { layer: null, value: 'value', units: '°' },
    wind: { layer: null, value: 'speedMetersPerSecond', units: ' m/s' }
  };

  onMount(() => {
    loadMapTiler();
  });

  async function loadMapTiler() {
    // Načítaj CSS
    const cssLink = document.createElement('link');
    cssLink.href = 'https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.css';
    cssLink.rel = 'stylesheet';
    document.head.appendChild(cssLink);

    // Načítaj MapTiler SDK
    const sdkScript = document.createElement('script');
    sdkScript.src = 'https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.umd.min.js';
    document.head.appendChild(sdkScript);

    sdkScript.onload = () => {
      // Načítaj Weather SDK
      const weatherScript = document.createElement('script');
      weatherScript.src = 'https://cdn.maptiler.com/maptiler-weather/v3.0.1/maptiler-weather.umd.min.js';
      document.head.appendChild(weatherScript);

      weatherScript.onload = () => {
        initializeMap();
      };
    };
  }

  function initializeMap() {
    // Nastav API kľúč
    window.maptilersdk.config.apiKey = 'ry26WCBx6tt715jhxPwh';

    // Vytvor mapu
    const map = new window.maptilersdk.Map({
      container: mapDiv,
      style: window.maptilersdk.MapStyle.BACKDROP,
      zoom: zoom,
      center: center,
      projection: 'mercator'
    });

    map.on('load', () => {
      map.setPaintProperty('Water', 'fill-color', 'rgba(0, 0, 0, 0.4)');
      changeWeatherLayer('temperature');
    });

    map.on('mousemove', (e) => {
      pointerLngLat = e.lngLat;
      updatePointerValue();
    });

    // Globálne dostupné
    window.weatherMap = map;
  }

  function changeWeatherLayer(type) {
    const map = window.weatherMap;
    if (!map || !window.maptilerweather) return;

    // Skry aktívny layer
    if (activeLayer && map.getLayer(activeLayer)) {
      map.setLayoutProperty(activeLayer, 'visibility', 'none');
    }

    activeLayer = type;
    let layer = weatherLayers[type].layer;

    // Vytvor layer ak neexistuje
    if (!layer) {
      switch (type) {
        case 'precipitation':
          layer = new window.maptilerweather.PrecipitationLayer({ id: type });
          break;
        case 'pressure':
          layer = new window.maptilerweather.PressureLayer({ id: type });
          break;
        case 'radar':
          layer = new window.maptilerweather.RadarLayer({ id: type });
          break;
        case 'temperature':
          layer = new window.maptilerweather.TemperatureLayer({ id: type });
          break;
        case 'wind':
          layer = new window.maptilerweather.WindLayer({ id: type });
          break;
      }

      weatherLayers[type].layer = layer;
      map.addLayer(layer, 'Water');
    } else {
      map.setLayoutProperty(type, 'visibility', 'visible');
    }
  }

  function updatePointerValue() {
    if (!pointerLngLat || !activeLayer) return;
    
    const layer = weatherLayers[activeLayer]?.layer;
    const valueKey = weatherLayers[activeLayer]?.value;
    const units = weatherLayers[activeLayer]?.units;
    
    if (layer) {
      const value = layer.pickAt(pointerLngLat.lng, pointerLngLat.lat);
      if (value) {
        const pointerElement = document.getElementById('pointer-data');
        if (pointerElement) {
          pointerElement.innerText = `${value[valueKey].toFixed(1)}${units}`;
        }
      }
    }
  }
</script>

<!-- Kontajner pre mapu -->
<div class="weather-map-container" style="width: {width}; height: {height};">
  
  <!-- Mapa -->
  <div bind:this={mapDiv} class="map"></div>

  <!-- Tlačidlá -->
  <div class="buttons">
    <button class="btn" on:click={() => changeWeatherLayer('precipitation')}>
      🌧️ Zrážky
    </button>
    <button class="btn" on:click={() => changeWeatherLayer('pressure')}>
      🌀 Tlak
    </button>
    <button class="btn" on:click={() => changeWeatherLayer('radar')}>
      📡 Radar
    </button>
    <button class="btn" on:click={() => changeWeatherLayer('temperature')}>
      🌡️ Teplota
    </button>
    <button class="btn" on:click={() => changeWeatherLayer('wind')}>
      💨 Vietor
    </button>
  </div>

  <!-- Info panely -->
  <div id="pointer-data"></div>
  <div id="variable-name">{activeLayer}</div>

</div>

<style>
  .weather-map-container {
    position: relative;
    overflow: hidden;
  }

  .map {
    width: 100%;
    height: 100%;
  }

  .buttons {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.9);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .btn:hover {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  #pointer-data {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    color: white;
    text-shadow: 0 0 5px black;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 18px;
  }

  #variable-name {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    color: white;
    text-shadow: 0 0 5px black;
    background: rgba(0, 0, 0, 0.5);
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: bold;
    text-transform: capitalize;
  }

  /* Mobile */
  @media (max-width: 768px) {
    .buttons {
      flex-direction: row;
      flex-wrap: wrap;
      top: 10px;
      left: 10px;
      right: 10px;
    }

    .btn {
      padding: 8px 12px;
      font-size: 14px;
    }

    #pointer-data {
      top: 80px;
      font-size: 16px;
    }
  }
</style>