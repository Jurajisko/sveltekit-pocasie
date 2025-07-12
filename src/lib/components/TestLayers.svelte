<!-- src/lib/components/TestWeatherLayers.svelte -->
<script>
  import { onMount } from 'svelte';

  let mapDiv;
  let map;
  let maptilersdk;
  let maptilerweather;

  // EXACT COPY from support HTML
  let pointerLngLat = null;
  let activeLayer = null;
  let isPlaying = false;
  let currentTime = null;

  // EXACT COPY - Weather layers config from support
  const weatherLayers = {
    "precipitation": {
      layer: null,
      value: "value",
      units: " mm",
      colorRamp: null  // Will be set after SDK loads
    },
    "pressure": {
      layer: null,
      value: "value", 
      units: " hPa",
      colorRamp: null
    },
    "radar": {
      layer: null,
      value: "value",
      units: " dBZ", 
      colorRamp: null
    },
    "temperature": {
      layer: null,
      value: "value",
      units: "°",
      colorRamp: null
    },
    "wind": {
      layer: null,
      value: "speedMetersPerSecond",
      units: " m/s",
      colorRamp: null
    }
  };

  // EXACT COPY - Legend control from support
  class colorRampLegendControl {
    constructor(options) {
      this.colorStops = options.colorStops;
      this.units = options.units || '';
      this.container = null;
    }

    onAdd(map) {
      this.map = map;
      const container = document.createElement("div");
      container.className = "maptiler-control legend";

      const title = document.createElement("strong");
      title.innerText = `Legend (${this.units.trim()})`;
      container.appendChild(title);

      const gradientDiv = document.createElement("div");

      for (const stop of this.colorStops) {
        const value = Math.round(stop.value);
        const [r, g, b, a] = stop.color;
        const rgba = `rgba(${r},${g},${b},${a / 255})`;

        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.alignItems = "center";
        row.style.marginBottom = "2px";

        const colorBox = document.createElement("span");
        colorBox.style.background = rgba;
        colorBox.style.width = "16px";
        colorBox.style.height = "16px";
        colorBox.style.display = "inline-block";
        colorBox.style.marginRight = "6px";
        colorBox.style.border = "1px solid #ccc";

        const label = document.createElement("span");
        label.textContent = `${value}${this.units}`;

        row.appendChild(colorBox);
        row.appendChild(label);
        gradientDiv.appendChild(row);
      }

      container.appendChild(gradientDiv);
      this.container = container;
      return container;
    }

    onRemove() {
      this.container.remove();
      this.map = undefined;
    }
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadCSS(href) {
    return new Promise(resolve => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      document.head.appendChild(link);
    });
  }

  onMount(async () => {
    console.log('🧪 Loading MapTiler SDKs...');
    
    await loadCSS('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.css');
    await loadScript('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.umd.min.js');
    await loadScript('https://cdn.maptiler.com/maptiler-weather/v3.0.1/maptiler-weather.umd.min.js');

    maptilersdk = window.maptilersdk;
    maptilerweather = window.maptilerweather;
    
    console.log('📦 SDKs loaded:', {
      maptilersdk: !!maptilersdk,
      maptilerweather: !!maptilerweather,
      ColorRamp: !!maptilerweather?.ColorRamp,
      builtin: !!maptilerweather?.ColorRamp?.builtin
    });

    // Set API key
    maptilersdk.config.apiKey = 'ry26WCBx6tt715jhxPwh';
    console.log('🔑 API key set');

    // NOW set color ramps after SDK is loaded
    weatherLayers.precipitation.colorRamp = maptilerweather.ColorRamp.builtin.PRECIPITATION;
    weatherLayers.pressure.colorRamp = maptilerweather.ColorRamp.builtin.PRESSURE_3;
    weatherLayers.radar.colorRamp = maptilerweather.ColorRamp.builtin.RADAR;
    weatherLayers.temperature.colorRamp = maptilerweather.ColorRamp.builtin.TEMPERATURE_3;
    weatherLayers.wind.colorRamp = maptilerweather.ColorRamp.builtin.WIND_ROCKET;
    
    console.log('🎨 Color ramps assigned:', Object.keys(maptilerweather.ColorRamp.builtin));

    // EXACT COPY - Map creation from support
    map = new maptilersdk.Map({
      container: mapDiv,
      style: maptilersdk.MapStyle.BACKDROP,
      zoom: 6,
      center: [19.5, 48.7],  // Slovakia center
      projection: 'mercator'
    });

    map.on('load', () => {
      console.log('🗺️ Map loaded!');
      
      // EXACT COPY from support
      map.setPaintProperty("Water", 'fill-color', "rgba(0, 0, 0, 0.4)");
      
      // Start with wind layer like support
      initWeatherMap("wind");
      
      // Add mousemove handler
      map.on('mousemove', updatePointerValue);
    });
  });

  // EXACT COPY - createWeatherLayer from support
  function createWeatherLayer(type) {
    console.log('🔨 Creating weather layer:', type);
    
    let weatherLayer;
    
    switch (type) {
      case 'precipitation':
        weatherLayer = new maptilerweather.PrecipitationLayer({ id: 'precipitation' });
        break;
      case 'pressure':
        weatherLayer = new maptilerweather.PressureLayer({ opacity: 0.8, id: 'pressure' });
        break;
      case 'radar':
        weatherLayer = new maptilerweather.RadarLayer({ opacity: 0.8, id: 'radar' });
        break;
      case 'temperature':
        weatherLayer = new maptilerweather.TemperatureLayer({
          colorramp: maptilerweather.ColorRamp.builtin.TEMPERATURE_3,
          id: 'temperature'
        });
        break;
      case 'wind':
        weatherLayer = new maptilerweather.WindLayer({ id: 'wind' });
        break;
    }

    // EXACT COPY - Event handlers from support
    weatherLayer.on("tick", () => {
      updatePointerValue(pointerLngLat);
    });

    weatherLayer.on("sourceReady", () => {
      console.log('✅ Source ready for:', type);
      const start = +weatherLayer.getAnimationStartDate();
      const end = +weatherLayer.getAnimationEndDate();
      const current = +weatherLayer.getAnimationTimeDate();
      
      console.log('⏰ Time range:', {
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(), 
        current: new Date(current).toISOString()
      });
      
      if (currentTime) {
        weatherLayer.setAnimationTime(currentTime);
      }
    });

    weatherLayers[type].layer = weatherLayer;
    return weatherLayer;
  }

  // EXACT COPY - changeWeatherLayer from support
  function changeWeatherLayer(type) {
    console.log('🌪️ Changing weather layer to:', type);
    
    if (type !== activeLayer) {
      if (map.getLayer(activeLayer)) {
        const activeWeatherLayer = weatherLayers[activeLayer]?.layer;
        if (activeWeatherLayer) {
          currentTime = activeWeatherLayer.getAnimationTime();
          map.setLayoutProperty(activeLayer, 'visibility', 'none');
        }
      }

      activeLayer = type;
      const weatherLayer = weatherLayers[activeLayer].layer || createWeatherLayer(activeLayer);
      
      if (map.getLayer(activeLayer)) {
        map.setLayoutProperty(activeLayer, 'visibility', 'visible');
      } else {
        map.addLayer(weatherLayer, 'Water');
        console.log('✅ Layer added to map:', type);
      }

      // EXACT COPY - Legend handling from support
      if (map._legendControl) {
        map.removeControl(map._legendControl);
        map._legendControl = null;
      }

      const legendInfo = weatherLayers[type];
      if (legendInfo?.colorRamp && legendInfo.colorRamp.getRawColorStops) {
        try {
          const colorStops = legendInfo.colorRamp.getRawColorStops();
          const legendControl = new colorRampLegendControl({
            colorStops,
            units: legendInfo.units
          });
          map.addControl(legendControl, 'bottom-right');
          map._legendControl = legendControl;
          console.log('✅ Legend added for:', type);
        } catch (error) {
          console.error('❌ Legend error:', error);
        }
      }

      return weatherLayer;
    }
  }

  // EXACT COPY - updatePointerValue from support  
  function updatePointerValue(lngLat) {
    if (!lngLat) return;
    pointerLngLat = lngLat;
    
    const weatherLayer = weatherLayers[activeLayer]?.layer;
    const valKey = weatherLayers[activeLayer]?.value;
    const units = weatherLayers[activeLayer]?.units;
    
    if (weatherLayer) {
      try {
        const value = weatherLayer.pickAt(lngLat.lng, lngLat.lat);
        if (value && typeof value[valKey] === 'number') {
          document.getElementById('pointer-data').innerText = `${value[valKey].toFixed(1)}${units}`;
        } else {
          document.getElementById('pointer-data').innerText = '';
        }
      } catch (error) {
        document.getElementById('pointer-data').innerText = '';
      }
    }
  }

  // EXACT COPY - initWeatherMap from support
  function initWeatherMap(type) {
    console.log('🌦️ Initializing weather map with:', type);
    changeWeatherLayer(type);
  }
</script>

<!-- Simple layout matching support example -->
<div class="test-container">
  <div bind:this={mapDiv} class="test-map"></div>
  
  <!-- Layer buttons like support -->
  <div class="test-buttons">
    <button on:click={() => changeWeatherLayer('precipitation')}>Precipitation</button>
    <button on:click={() => changeWeatherLayer('pressure')}>Pressure</button>
    <button on:click={() => changeWeatherLayer('radar')}>Radar</button>
    <button on:click={() => changeWeatherLayer('temperature')}>Temperature</button>
    <button on:click={() => changeWeatherLayer('wind')}>Wind</button>
  </div>
  
  <!-- Pointer data display -->
  <div id="pointer-data" class="test-pointer-data"></div>
  
  <!-- Variable name display -->
  <div class="test-variable-name">{activeLayer || 'Wind'}</div>
</div>

<style>
  .test-container {
    width: 100vw;
    height: 100vh;
    position: relative;
    font-family: sans-serif;
  }
  
  .test-map {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    background-color: #3E4048;
  }
  
  .test-buttons {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 99;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .test-buttons button {
    padding: 8px 16px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .test-buttons button:hover {
    background: #0056b3;
  }
  
  .test-pointer-data {
    position: fixed;
    font-size: 20px;
    font-weight: 900;
    margin: 80px 0 0 20px;
    color: #fff;
    text-shadow: 0px 0px 10px rgba(0,0,0,0.7);
    z-index: 1;
  }
  
  .test-variable-name {
    position: fixed;
    font-size: 20px;
    font-weight: 500;
    margin: 50px 0 0 20px;
    color: #fff;
    text-shadow: 0px 0px 10px rgba(0,0,0,0.7);
    text-transform: capitalize;
    z-index: 1;
  }
  
  /* Legend styles */
  :global(.maptiler-control.legend) {
    background: white;
    padding: 8px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    font-size: 12px;
    max-width: 180px;
    line-height: 1.4em;
  }
</style>