<script>
  import { onMount } from 'svelte';

  // Props
  export let width = "100vw";
  export let height = "100vh";
  export let center = [19.5, 48.7];
  export let zoom = 7;

  let mapDiv;
  let windyEmbedDiv;
  let map;
  let activeLayer = null;
  let pointerLngLat = null;
  let pointerValue = '';
  let isLoading = true;
  let maptilersdk;
  let maptilerweather;
  let legendControl = null;
  let windyEmbedReady = false;

  const MAPTILER_KEY = 'ry26WCBx6tt715jhxPwh';

  // Simplified configuration: MapTiler + Windy Embed
  const weatherLayers = {
    temperature: { 
      layer: null, 
      value: 'value', 
      units: '°C', 
      name: 'Teplota',
      icon: '🌡️',
      type: 'maptiler',
      colorRamp: null
    },
    precipitation: { 
      layer: null, 
      value: 'value', 
      units: ' mm', 
      name: 'Zrážky',
      icon: '🌧️',
      type: 'maptiler',
      colorRamp: null
    },
    pressure: { 
      layer: null, 
      value: 'value', 
      units: ' hPa', 
      name: 'Tlak',
      icon: '🌀',
      type: 'maptiler',
      colorRamp: null
    },
    radar: { 
      layer: null, 
      value: 'value', 
      units: ' dBZ', 
      name: 'Radar',
      icon: '📡',
      type: 'maptiler',
      colorRamp: null
    },
    wind: { 
      layer: null, 
      value: 'wind', 
      units: ' m/s', 
      name: 'Vietor',
      icon: '💨',
      type: 'windy_embed',
      status: 'ready'
    }
  };

  onMount(async () => {
    if (typeof window === 'undefined') return;
    
    try {
      console.log('🚀 Loading Weather Map with Windy Embed...');
      
      // Load MapTiler modules
      await loadMapTilerModules();
      
      // Initialize base map
      await initializeMap();
      
      // Setup Windy embed
      setupWindyEmbed();
      
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      isLoading = false;
    }
  });

  async function loadMapTilerModules() {
    console.log('📦 Loading MapTiler ES modules...');
    
    const [sdkModule, weatherModule] = await Promise.all([
      import('@maptiler/sdk'),
      import('@maptiler/weather')
    ]);

    maptilersdk = sdkModule;
    maptilerweather = weatherModule;

    // Import CSS
    await import('@maptiler/sdk/dist/maptiler-sdk.css');
    
    // Set color ramps
    weatherLayers.temperature.colorRamp = maptilerweather.ColorRamp.builtin.TEMPERATURE_3;
    weatherLayers.precipitation.colorRamp = maptilerweather.ColorRamp.builtin.PRECIPITATION;
    weatherLayers.pressure.colorRamp = maptilerweather.ColorRamp.builtin.PRESSURE_3;
    weatherLayers.radar.colorRamp = maptilerweather.ColorRamp.builtin.RADAR;
    
    console.log('✅ MapTiler modules loaded');
  }

  async function initializeMap() {
    console.log('🗺️ Initializing MapTiler base map...');

    maptilersdk.config.apiKey = MAPTILER_KEY;

    map = new maptilersdk.Map({
      container: mapDiv,
      style: maptilersdk.MapStyle.BACKDROP,
      zoom: zoom,
      center: center,
      projection: 'mercator'
    });

    map.on('load', () => {
      console.log('✅ Map loaded successfully');
      
      try {
        if (map.getLayer('Water')) {
          map.setPaintProperty('Water', 'fill-color', 'rgba(0, 0, 0, 0.4)');
        }
      } catch (e) {
        console.warn('⚠️ Cannot style water layer:', e);
      }
      
      // Load default layer
      changeWeatherLayer('temperature');
      isLoading = false;
    });

    map.on('mousemove', (e) => {
      pointerLngLat = e.lngLat;
      updatePointerValue();
    });

    map.on('mouseout', (evt) => {
      if (!evt.originalEvent.relatedTarget) {
        pointerValue = '';
        pointerLngLat = null;
      }
    });
  }

  function setupWindyEmbed() {
    console.log('🌪️ Setting up Windy Embed...');
    
    // Create Windy embed URL
    const lat = center[1];
    const lon = center[0];
    const windyUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=${zoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;
    
    // Create iframe for Windy embed
    const iframe = document.createElement('iframe');
    iframe.src = windyUrl;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = 'none';
    iframe.style.display = 'none'; // Hidden initially
    
    windyEmbedDiv.appendChild(iframe);
    windyEmbedReady = true;
    
    console.log('✅ Windy Embed ready');
  }

  function changeWeatherLayer(type) {
    if (!map) return;

    const layerConfig = weatherLayers[type];
    if (!layerConfig) return;

    // Hide all MapTiler layers
    Object.keys(weatherLayers).forEach(layerKey => {
      if (layerKey !== 'wind' && map.getLayer(layerKey)) {
        map.setLayoutProperty(layerKey, 'visibility', 'none');
      }
    });

    // Hide Windy embed
    if (windyEmbedDiv && windyEmbedDiv.firstChild) {
      windyEmbedDiv.firstChild.style.display = 'none';
    }

    // Remove existing legend
    if (legendControl) {
      map.removeControl(legendControl);
      legendControl = null;
    }

    activeLayer = type;

    if (type === 'wind') {
      showWindEmbed();
    } else {
      showMapTilerLayer(type, layerConfig);
    }
  }

  function showWindEmbed() {
    console.log('🌪️ Showing Windy embed...');
    
    if (windyEmbedDiv && windyEmbedDiv.firstChild) {
      windyEmbedDiv.firstChild.style.display = 'block';
      
      // Update iframe URL with current map position
      const lat = map.getCenter().lat;
      const lon = map.getCenter().lng;
      const currentZoom = map.getZoom();
      
      const newUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=${currentZoom}&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=default&metricTemp=default&radarRange=-1`;
      
      windyEmbedDiv.firstChild.src = newUrl;
    }
  }

  function showMapTilerLayer(type, layerConfig) {
    let layer = layerConfig.layer;

    // Create layer if doesn't exist
    if (!layer) {
      console.log(`🔨 Creating ${type} layer...`);
      
      try {
        switch (type) {
          case 'temperature':
            layer = new maptilerweather.TemperatureLayer({ 
              id: type,
              opacity: 0.8,
              colorramp: layerConfig.colorRamp
            });
            break;
          case 'precipitation':
            layer = new maptilerweather.PrecipitationLayer({ 
              id: type,
              opacity: 0.8
            });
            break;
          case 'pressure':
            layer = new maptilerweather.PressureLayer({ 
              id: type,
              opacity: 0.8
            });
            break;
          case 'radar':
            layer = new maptilerweather.RadarLayer({ 
              id: type,
              opacity: 0.8
            });
            break;
        }

        if (layer) {
          weatherLayers[type].layer = layer;
          map.addLayer(layer, 'Water');
          console.log(`✅ ${type} layer created successfully`);
          
          // Add legend
          addLegend(type, layerConfig);
        }
      } catch (error) {
        console.error(`❌ Error creating ${type} layer:`, error);
      }
    } else {
      // Show existing layer
      map.setLayoutProperty(type, 'visibility', 'visible');
      addLegend(type, layerConfig);
    }
  }

  function addLegend(type, layerConfig) {
    if (!layerConfig.colorRamp) return;
    
    try {
      const colorStops = layerConfig.colorRamp.getRawColorStops();
      
      legendControl = new ColorRampLegendControl({
        colorStops: colorStops,
        units: layerConfig.units,
        title: layerConfig.name
      });
      
      map.addControl(legendControl, 'bottom-left');
      
    } catch (error) {
      console.warn(`⚠️ Could not create legend for ${type}:`, error);
    }
  }

  function updatePointerValue() {
    if (!pointerLngLat || !activeLayer) {
      pointerValue = '';
      return;
    }
    
    if (activeLayer === 'wind') {
      // For Windy embed, we can't get precise values
      // But we can show that wind layer is active
      pointerValue = 'Wind data (Windy)';
      return;
    }
    
    // Get data from MapTiler layers
    const layerConfig = weatherLayers[activeLayer];
    const layer = layerConfig?.layer;
    
    if (layer && typeof layer.pickAt === 'function') {
      try {
        const value = layer.pickAt(pointerLngLat.lng, pointerLngLat.lat);
        if (value && value[layerConfig.value] !== undefined) {
          pointerValue = `${value[layerConfig.value].toFixed(1)}${layerConfig.units}`;
        } else {
          pointerValue = 'N/A';
        }
      } catch (error) {
        pointerValue = '';
      }
    }
  }

  function getLayerStatus(key) {
    return 'ready';
  }

  function getLayerIcon(key) {
    return '✅';
  }

  // Legend Control Class
  class ColorRampLegendControl {
    constructor(options) {
      this.colorStops = options.colorStops || [];
      this.units = options.units || '';
      this.title = options.title || 'Legend';
      this.container = null;
    }

    onAdd(map) {
      this.map = map;
      const container = document.createElement("div");
      container.className = "legend-control";

      const title = document.createElement("div");
      title.className = "legend-title";
      title.textContent = `${this.title} (${this.units.trim()})`;
      container.appendChild(title);

      const gradientDiv = document.createElement("div");
      gradientDiv.className = "legend-gradient";

      const displayStops = this.sampleColorStops(this.colorStops, 6);

      for (const stop of displayStops) {
        const value = Math.round(stop.value * 10) / 10;
        const [r, g, b, a] = stop.color;
        const rgba = `rgba(${r},${g},${b},${a / 255})`;

        const row = document.createElement("div");
        row.className = "legend-row";

        const colorBox = document.createElement("span");
        colorBox.className = "legend-color";
        colorBox.style.backgroundColor = rgba;

        const label = document.createElement("span");
        label.className = "legend-label";
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
      if (this.container) {
        this.container.remove();
      }
      this.map = undefined;
    }

    sampleColorStops(stops, maxStops) {
      if (stops.length <= maxStops) return stops;
      
      const sampled = [];
      const step = Math.floor(stops.length / maxStops);
      
      for (let i = 0; i < stops.length; i += step) {
        sampled.push(stops[i]);
      }
      
      if (sampled[sampled.length - 1] !== stops[stops.length - 1]) {
        sampled.push(stops[stops.length - 1]);
      }
      
      return sampled;
    }
  }
</script>

<!-- Weather Map Container -->
<div class="weather-map-container" style="width: {width}; height: {height};">
  
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>Načítavam météo mapu...</p>
      <small>MapTiler ES Modules + Windy Embed</small>
    </div>
  {/if}

  <!-- MapTiler Base Map -->
  <div bind:this={mapDiv} class="map"></div>

  <!-- Windy Embed Container -->
  <div bind:this={windyEmbedDiv} class="windy-embed-container"></div>

  <!-- Weather Layer Controls -->
  <div class="buttons">
    {#each Object.entries(weatherLayers) as [key, config]}
      <button 
        class="btn" 
        class:active={activeLayer === key}
        class:windy-btn={config.type === 'windy_embed'}
        on:click={() => changeWeatherLayer(key)}
        disabled={isLoading}
      >
        <div class="btn-content">
          <div class="btn-main">
            {config.icon}
            {config.name}
          </div>
          <div class="btn-status">
            <span class="status-icon">{getLayerIcon(key)}</span>
            <span class="status-text">{config.type === 'windy_embed' ? 'embed' : 'maptiler'}</span>
          </div>
        </div>
      </button>
    {/each}
  </div>

  <!-- Data Display -->
  {#if pointerValue}
    <div class="pointer-data">{pointerValue}</div>
  {/if}
  
  {#if activeLayer}
    <div class="variable-name">
      {weatherLayers[activeLayer]?.name || 'Loading...'}
      <small>({weatherLayers[activeLayer]?.type === 'windy_embed' ? 'Windy' : 'MapTiler'})</small>
    </div>
  {/if}

  <!-- Architecture Status -->
  <div class="status-info">
    <div class="status-title">🌤️ Hybrid Weather</div>
    <div class="layer-count">4 MapTiler + 1 Windy Embed</div>
    <div class="tech-stack">
      <span class="tech-item">✅ ES Modules</span>
      <span class="tech-item">✅ Windy Embed</span>
      <span class="tech-item">✅ No CDN Issues</span>
    </div>
  </div>
</div>

<style>
  .weather-map-container {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .map, .windy-embed-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .windy-embed-container {
    z-index: 1;
    pointer-events: auto;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    color: white;
    text-align: center;
  }

  .loading-overlay small {
    margin-top: 8px;
    opacity: 0.7;
    font-size: 12px;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .buttons {
    position: absolute;
    top: 20px;
    left: 20px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .btn {
    padding: 12px 16px;
    background: rgba(255, 255, 255, 0.95);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    font-size: 14px;
    min-width: 160px;
    backdrop-filter: blur(10px);
  }

  .btn-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .btn-main {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 10px;
  }

  .btn:hover:not(:disabled) {
    background: white;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn.active {
    background: #667eea;
    color: white;
  }

  .btn.active:hover {
    background: #5a6fd8;
  }

  .windy-btn {
    border-left: 4px solid #ff6b35;
  }

  .windy-btn.active {
    background: #ff6b35;
  }

  .windy-btn.active:hover {
    background: #e55a2b;
  }

  .pointer-data {
    position: absolute;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10;
    color: white;
    text-shadow: 0 0 5px black;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 18px;
    backdrop-filter: blur(10px);
  }

  .variable-name {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    color: white;
    text-shadow: 0 0 5px black;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px 16px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 16px;
    backdrop-filter: blur(10px);
  }

  .variable-name small {
    font-size: 12px;
    opacity: 0.8;
    margin-left: 4px;
  }

  .status-info {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .status-title {
    font-weight: bold;
    margin-bottom: 6px;
  }

  .layer-count {
    margin-bottom: 8px;
    color: #4ade80;
    font-weight: 500;
  }

  .tech-stack {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tech-item {
    font-size: 10px;
    opacity: 0.9;
  }

  /* Legend Styles */
  :global(.legend-control) {
    background: white;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    font-size: 12px;
    max-width: 180px;
    line-height: 1.4;
    border: 1px solid rgba(0,0,0,0.1);
  }

  :global(.legend-title) {
    font-weight: bold;
    margin-bottom: 8px;
    color: #333;
    border-bottom: 1px solid #eee;
    padding-bottom: 4px;
  }

  :global(.legend-gradient) {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  :global(.legend-row) {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  :global(.legend-color) {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    border: 1px solid rgba(0,0,0,0.2);
    flex-shrink: 0;
  }

  :global(.legend-label) {
    font-size: 11px;
    color: #555;
    font-weight: 500;
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .buttons {
      flex-direction: row;
      flex-wrap: wrap;
      top: 10px;
      left: 10px;
      right: 10px;
      gap: 6px;
    }

    .btn {
      flex: 1;
      min-width: auto;
      padding: 8px 12px;
      font-size: 12px;
    }

    .btn-content {
      flex-direction: column;
      gap: 4px;
    }

    .pointer-data {
      top: 70px;
      font-size: 16px;
    }

    .variable-name {
      top: 10px;
      right: 10px;
      font-size: 14px;
    }

    .status-info {
      bottom: 10px;
      left: 10px;
      font-size: 10px;
    }
  }
</style>