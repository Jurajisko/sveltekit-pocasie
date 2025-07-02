<script>
import { onMount } from 'svelte';
import TimeSlider from '$lib/components/TimeSlider.svelte';

let map;
let mapDiv;
let activeLayer = null;
let isPlaying = false;
let pointerLngLat = null;
let searchText = '';
let locationResults = [];
let searchMarker = null;

let minTime = 0;
let maxTime = 0;
let currentTime = 0;
let isDragging = false;
let dayMarkers = [];

// Globálne premenné pre MapTiler SDK a Weather
let maptilersdk;
let maptilerweather;

function generateDayMarkers(start, end) {
  const markers = [];
  const current = new Date(start);
  current.setUTCHours(0, 0, 0, 0);
  while (+current <= end) {
    markers.push({
      time: +current,
      label: current.toLocaleDateString('en-US', { weekday: 'long' })
    });
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return markers;
}

function updateTime(newVal) {
  const layer = weatherLayers[activeLayer]?.layer;
  if (!layer) return;
  isDragging = true;
  currentTime = newVal;
  if (isPlaying) {
    layer.animateByFactor(0);
    layer.setAnimationTime(currentTime / 1000);
    requestAnimationFrame(() => {
      layer.animateByFactor(3600);
      isDragging = false;
    });
  } else {
    layer.setAnimationTime(currentTime / 1000);
    isDragging = false;
  }
}

function togglePlay() {
  const layer = weatherLayers[activeLayer]?.layer;
  if (!layer) return;
  if (isPlaying) {
    layer.animateByFactor(0);
    isPlaying = false;
  } else {
    layer.setAnimationTime(currentTime / 1000);
    layer.animateByFactor(3600);
    isPlaying = true;
  }
}

const weatherLayers = {
  precipitation: { layer: null, value: 'value', units: ' mm', colorRamp: null },
  pressure: { layer: null, value: 'value', units: ' hPa', colorRamp: null },
  radar: { layer: null, value: 'value', units: ' dBZ', colorRamp: null },
  temperature: { layer: null, value: 'value', units: '°', colorRamp: null },
  wind: { layer: null, value: 'speedMetersPerSecond', units: ' m/s', colorRamp: null }
};

// Funkcia na načítanie scriptov
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Funkcia na načítanie CSS
function loadCSS(href) {
  return new Promise((resolve) => {
    const link = document.createElement('link');
    link.href = href;
    link.rel = 'stylesheet';
    link.onload = resolve;
    document.head.appendChild(link);
  });
}

onMount(async () => {
  if (!mapDiv) return;
  
  try {
    // Načítaj všetky potrebné súbory
    await Promise.all([
      loadScript('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.umd.min.js'),
      loadScript('https://cdn.maptiler.com/maptiler-weather/v3.0.1/maptiler-weather.umd.min.js'),
      loadCSS('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.css')
    ]);

    // Priradí globálne objekty
    maptilersdk = window.maptilersdk;
    maptilerweather = window.maptilerweather;

    // Nastav API kľúč
    maptilersdk.config.apiKey = 'ry26WCBx6tt715jhxPwh';

    // Inicializuj mapu
    map = new maptilersdk.Map({
      container: mapDiv,
      style: maptilersdk.MapStyle.BACKDROP,
      zoom: 7,
      center: [19.5, 48.7],
      hash: true,
      projection: 'mercator'
    });

    // Nastavenia po načítaní mapy
    map.on('load', () => {
      map.setPaintProperty('Water', 'fill-color', 'rgba(0, 0, 0, 0.4)');
      
      // Nastav colorRamps
      weatherLayers.precipitation.colorRamp = maptilerweather.ColorRamp.builtin.PRECIPITATION;
      weatherLayers.pressure.colorRamp = maptilerweather.ColorRamp.builtin.PRESSURE_3;
      weatherLayers.radar.colorRamp = maptilerweather.ColorRamp.builtin.RADAR;
      weatherLayers.temperature.colorRamp = maptilerweather.ColorRamp.builtin.TEMPERATURE_3;
      weatherLayers.wind.colorRamp = maptilerweather.ColorRamp.builtin.WIND_ROCKET;
      
      changeWeatherLayer('wind');
    });

    map.on('mousemove', (e) => updatePointerValue(e.lngLat));
    map.on('mouseout', () => (pointerLngLat = null));

  } catch (error) {
    console.error('Chyba pri načítavaní MapTiler SDK:', error);
  }
});

function changeWeatherLayer(type) {
  if (!maptilerweather || !map) return;

  if (activeLayer && map.getLayer(activeLayer)) {
    map.setLayoutProperty(activeLayer, 'visibility', 'none');
  }

  activeLayer = type;

  let layer = weatherLayers[type].layer;
  if (!layer) {
    switch (type) {
      case 'precipitation': 
        layer = new maptilerweather.PrecipitationLayer({ id: type }); 
        break;
      case 'pressure': 
        layer = new maptilerweather.PressureLayer({ id: type }); 
        break;
      case 'radar': 
        layer = new maptilerweather.RadarLayer({ id: type }); 
        break;
      case 'temperature': 
        layer = new maptilerweather.TemperatureLayer({ id: type }); 
        break;
      case 'wind': 
        layer = new maptilerweather.WindLayer({ id: type }); 
        break;
    }

    // Event listenery pre layer
    layer.on('sourceReady', () => {
      setTimeout(() => {
        const startDate = layer.getAnimationStartDate();
        const endDate = layer.getAnimationEndDate();
        const timeNow = layer.getAnimationTimeDate();

        if (startDate && endDate && timeNow) {
          minTime = +startDate;
          maxTime = +endDate;
          currentTime = +timeNow;
          dayMarkers = generateDayMarkers(minTime, maxTime);

          layer.setAnimationTime(currentTime / 1000);

          if (isPlaying) {
            layer.animateByFactor(3600);
          }
        }
      }, 300);
    });

    layer.on('tick', () => {
      if (!isDragging) {
        const d = layer.getAnimationTimeDate();
        if (d) currentTime = +d;
      }
    });

    weatherLayers[type].layer = layer;
    map.addLayer(layer, 'Water');
  } else {
    map.setLayoutProperty(type, 'visibility', 'visible');
  }
}

function updatePointerValue(lngLat) {
  if (!lngLat) return;
  pointerLngLat = lngLat;
  const layer = weatherLayers[activeLayer]?.layer;
  const valueKey = weatherLayers[activeLayer]?.value;
  const units = weatherLayers[activeLayer]?.units;
  const value = layer?.pickAt(lngLat.lng, lngLat.lat);
  if (value) {
    const pointerElement = document.getElementById('pointer-data');
    if (pointerElement) {
      pointerElement.innerText = `${value[valueKey].toFixed(1)}${units}`;
    }
  }
}

async function searchLocation() {
  if (!searchText || searchText.length < 2) return;
  try {
    const query = encodeURIComponent(searchText);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${query}`);
    locationResults = await res.json();
  } catch (error) {
    console.error('Chyba pri vyhľadávaní:', error);
  }
}

function selectPlace(place) {
  if (!maptilersdk || !map) return;
  
  const lng = parseFloat(place.lon);
  const lat = parseFloat(place.lat);
  
  if (searchMarker) searchMarker.remove();
  
  searchMarker = new maptilersdk.Marker({ color: "red" })
    .setLngLat([lng, lat])
    .setPopup(new maptilersdk.Popup().setText(place.display_name))
    .addTo(map);
    
  map.flyTo({ center: [lng, lat], zoom: 10 });
  locationResults = [];
  searchText = place.display_name;
}
</script>

<style>
#map {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
}

#buttons {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 9;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

#buttons button {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

#buttons button:hover {
  background: rgba(255, 255, 255, 1);
}

.search-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 11;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 4px;
}

.search-results {
  background: white;
  color: black;
  padding: 5px;
  border: 1px solid #ccc;
  max-width: 300px;
  font-size: 14px;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 5px;
}

.search-results li {
  cursor: pointer;
  padding: 4px;
  border-bottom: 1px solid #eee;
}

.search-results li:hover {
  background: #f0f0f0;
}

#pointer-data {
  position: absolute;
  top: 50px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  color: white;
  text-shadow: 0 0 5px black;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
}

#variable-name {
  position: absolute;
  top: 80px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  color: white;
  text-shadow: 0 0 5px black;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 10px;
  border-radius: 4px;
  text-transform: capitalize;
}

.time-slider-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 11;
  width: 80%;
  max-width: 800px;
}
</style>

<div bind:this={mapDiv} id="map"></div>

<div id="buttons">
  <button on:click={() => changeWeatherLayer('precipitation')}>Zrážky</button>
  <button on:click={() => changeWeatherLayer('pressure')}>Tlak</button>
  <button on:click={() => changeWeatherLayer('radar')}>Radar</button>
  <button on:click={() => changeWeatherLayer('temperature')}>Teplota</button>
  <button on:click={() => changeWeatherLayer('wind')}>Vietor</button>
</div>

<div class="search-container">
  <input 
    type="text" 
    bind:value={searchText} 
    placeholder="Zadaj miesto…" 
    style="margin-bottom:5px; width: 200px; padding: 5px;"
  />
  <button on:click={searchLocation}>Hľadaj</button>
  
  {#if locationResults.length > 0}
    <ul class="search-results">
      {#each locationResults as place}
        <li on:click={() => selectPlace(place)}>{place.display_name}</li>
      {/each}
    </ul>
  {/if}
</div>

<div id="pointer-data"></div>
<div id="variable-name">{activeLayer}</div>

<div class="time-slider-container">
  <TimeSlider
    min={minTime}
    max={maxTime}
    value={currentTime}
    playing={isPlaying}
    dayMarkers={dayMarkers}
    onChange={updateTime}
    onPlayPause={togglePlay} 
  />
</div>