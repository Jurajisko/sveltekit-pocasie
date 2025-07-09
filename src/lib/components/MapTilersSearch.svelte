<script>
    import { onMount } from 'svelte';
    import TimeSlider from '$lib/components/TimeSlider.svelte';

    let mapDiv;
    let map;
    let maptilersdk;
    let maptilerweather;
    let activeLayer = null;
    let isPlaying = false;
    let pointerLngLat = null;

    let minTime = 0;
    let maxTime = 0;
    let currentTime = 0;
    let isDragging = false;
    let dayMarkers = [];
    let timeText = '';
    let playLabel = '▶️';

    const customWindLegend = [
        { value: 0, color: [68, 1, 84, 255] },     // tmavo fialová
        { value: 5, color: [72, 34, 116, 255] },
        { value: 10, color: [64, 67, 135, 255] },
        { value: 15, color: [52, 94, 141, 255] },
        { value: 20, color: [41, 120, 142, 255] },
        { value: 30, color: [38, 146, 140, 255] },
        { value: 40, color: [53, 183, 121, 255] }  // zeleno-modrá
    ];
    
    const temperatureColorRamp = [
  { value: -40, color: [128, 0, 128, 255] },   // fialová
  { value: -20, color: [153, 50, 204, 255] },  // svetlofialová
  { value: -10, color: [186, 85, 211, 255] },
  { value: 0, color: [176, 224, 230, 255] },
  { value: 10, color: [144, 238, 144, 255] },
  { value: 20, color: [173, 255, 47, 255] },
  { value: 40, color: [255, 69, 0, 255] }
];

const precipitationColorRamp = [
  { value: 0, color: [255, 255, 255, 255] },
  { value: 5, color: [135, 206, 250, 255] },   // svetlomodrá
  { value: 10, color: [0, 255, 255, 255] },    // tyrkysová
  { value: 15, color: [255, 255, 0, 255] },    // žltá
  { value: 20, color: [255, 165, 0, 255] },    // oranžová
  { value: 30, color: [255, 0, 255, 255] },    // ružová
  { value: 40, color: [128, 0, 128, 255] }     // fialová
];

const pressureColorRamp = [
  { value: 930, color: [64, 0, 64, 255] },
  { value: 950, color: [75, 0, 130, 255] },
  { value: 970, color: [0, 0, 205, 255] },
  { value: 990, color: [100, 149, 237, 255] },
  { value: 1010, color: [135, 206, 250, 255] },
  { value: 1030, color: [255, 160, 122, 255] },
  { value: 1050, color: [139, 0, 0, 255] }
];

const radarColorRamp = [
  { value: 0, color: [255, 255, 255, 255] },
  { value: 10, color: [0, 191, 255, 255] },
  { value: 15, color: [30, 144, 255, 255] },
  { value: 25, color: [0, 255, 0, 255] },
  { value: 40, color: [255, 255, 0, 255] },
  { value: 50, color: [255, 140, 0, 255] },
  { value: 60, color: [255, 0, 255, 255] }
];





  let weatherLayers = {};

  class ColorRampLegendControl {
    constructor(options) {
      this.colorStops = options.colorStops;
      this.units = options.units || '';
      this.container = null;
    }

onAdd(map) {
  const container = document.createElement('div');
  container.className = 'maptiler-control legend';

  const title = document.createElement('div');
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '6px';
  title.innerText = `${this.units.trim()}`;
  container.appendChild(title);

  const scaleWrapper = document.createElement('div');
  scaleWrapper.style.display = 'flex';
  scaleWrapper.style.flexDirection = 'column-reverse';
  scaleWrapper.style.alignItems = 'center';

  const height = 200;
  const width = 30;

  const gradient = document.createElement('div');
  gradient.style.width = `${width}px`;
  gradient.style.height = `${height}px`;
  gradient.style.position = 'relative';
  gradient.style.background = this.generateGradientCSS();
  gradient.style.border = '1px solid #ccc';
  gradient.style.borderRadius = '4px';
  gradient.style.marginBottom = '4px';

  // Create ticks
  const min = this.colorStops[0].value;
  const max = this.colorStops[this.colorStops.length - 1].value;
  const steps = this.colorStops.length;

  for (let i = 0; i < steps; i++) {
    const value = this.colorStops[i].value;
    const pct = ((value - min) / (max - min)) * 100;

    const tick = document.createElement('div');
    tick.style.position = 'absolute';
    tick.style.left = '0'; //`${width + 6}px`;
    tick.style.bottom = `calc(${pct}% - 7px)`;
    tick.style.fontSize = '11px';
    tick.style.color = '#fff';
    tick.style.whiteSpace = 'nowrap';
    tick.style.textShadow = `
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px  1px 0 #000,
    1px  1px 0 #000
    `;

    tick.style.fontWeight = 'bold';
    tick.innerText = `${value}${this.units}`;
    gradient.appendChild(tick);
  }

  scaleWrapper.appendChild(gradient);
  container.appendChild(scaleWrapper);

  this.container = container;
  return container;
}

generateGradientCSS() {
  const min = this.colorStops[0].value;
  const max = this.colorStops[this.colorStops.length - 1].value;

  const colorStopsCSS = this.colorStops
    .map(stop => {
      const pct = ((stop.value - min) / (max - min)) * 100;
      const [r, g, b, a] = stop.color;
      return `rgba(${r},${g},${b},${a / 255}) ${pct}%`;
    })
    .join(', ');

  return `linear-gradient(to top, ${colorStopsCSS})`;
}


    onRemove() {
      this.container?.remove();
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
    await loadCSS('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.css');
    await loadScript('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.umd.min.js');
    await loadScript('https://cdn.maptiler.com/maptiler-weather/v3.0.1/maptiler-weather.umd.min.js');

    maptilersdk = window.maptilersdk;
    maptilerweather = window.maptilerweather;

    /*
    weatherLayers = {
        precipitation: {
            layer: null,
            value: 'value',
            units: ' mm',
            colorRamp: maptilerweather.ColorRamp.builtin.PRECIPITATION
        },
        pressure: {
            layer: null,
            value: 'value',
            units: ' hPa',
            colorRamp: maptilerweather.ColorRamp.builtin.PRESSURE_3
        },
        radar: {
            layer: null,
            value: 'value',
            units: ' dBZ',
            colorRamp: maptilerweather.ColorRamp.builtin.RADAR
        },
        temperature: {
            layer: null,
            value: 'value',
            units: '°',
            colorRamp: maptilerweather.ColorRamp.builtin.TEMPERATURE_3
        },
        wind: {
            layer: null,
            value: 'speedMetersPerSecond',
            units: ' m/s',
            colorRamp: customWindLegend
        }
    }; */
weatherLayers = {
  precipitation: {
    layer: null,
    value: 'value',
    units: ' mm/h',
    colorRamp: precipitationColorRamp
  },
  pressure: {
    layer: null,
    value: 'value',
    units: ' hPa',
    colorRamp: pressureColorRamp
  },
  radar: {
    layer: null,
    value: 'value',
    units: ' dBZ',
    colorRamp: radarColorRamp
  },
  temperature: {
    layer: null,
    value: 'value',
    units: '°C',
    colorRamp: temperatureColorRamp
  },
  wind: {
    layer: null,
    value: 'speedMetersPerSecond',
    units: ' m/s',
    colorRamp: customWindLegend
  }
};




    maptilersdk.config.apiKey = 'ry26WCBx6tt715jhxPwh';

    map = new maptilersdk.Map({
      container: mapDiv,
      style: maptilersdk.MapStyle.BACKDROP,
      zoom: 6,
      center: [19.5, 48.7],
      projection: 'mercator'
    });

    map.on('load', () => {
      changeWeatherLayer('wind');
      map.on('mousemove', (e) => updatePointerValue(e.lngLat));
    });
  });

  function changeWeatherLayer(type) {
    if (!map) return;

    if (activeLayer && map.getLayer(activeLayer)) {
      map.setLayoutProperty(activeLayer, 'visibility', 'none');
    }

    if (map._legendControl) {
      map.removeControl(map._legendControl);
      map._legendControl = null;
    }

    activeLayer = type;
    let layer = weatherLayers[type].layer;

    if (!layer) {
        switch (type) {
            case 'wind':
                layer = new maptilerweather.WindLayer({
                    id: type,
                    colorramp: customWindLegend
                });
                break;
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
        }

      layer.on('sourceReady', () => {
        minTime = +layer.getAnimationStartDate();
        maxTime = +layer.getAnimationEndDate();
        currentTime = +layer.getAnimationTimeDate();
        dayMarkers = generateDayMarkers(minTime, maxTime);
        layer.setAnimationTime(currentTime / 1000);
        if (isPlaying) layer.animateByFactor(3600);
      });

      layer.on('tick', () => {
        if (!isDragging) {
          const d = layer.getAnimationTimeDate();
          if (d) {
            currentTime = +d;
            refreshTime();
          }
        }
      });

      weatherLayers[type].layer = layer;
      map.addLayer(layer, 'Water');
    } 
    else {
      map.setLayoutProperty(type, 'visibility', 'visible');
    }

    // Na konci changeWeatherLayer()

    let rawStops = [];

    const ramp = weatherLayers[type]?.colorRamp;
    if (Array.isArray(ramp)) {
    rawStops = ramp;
    } else if (ramp && typeof ramp.getRawColorStops === 'function') {
    rawStops = ramp.getRawColorStops();
    } else {
    console.warn(`⚠️ colorRamp for '${type}' is invalid or null`, ramp);
    }


    const legendControl = new ColorRampLegendControl({
        colorStops: rawStops,
        units: weatherLayers[type].units
    });

    map.addControl(legendControl, 'bottom-left');
    map._legendControl = legendControl;

  }

  function updatePointerValue(lngLat) {
    if (!lngLat) return;
    pointerLngLat = lngLat;
    const layer = weatherLayers[activeLayer]?.layer;
    const key = weatherLayers[activeLayer]?.value;
    const units = weatherLayers[activeLayer]?.units;
    const value = layer?.pickAt(lngLat.lng, lngLat.lat);
    if (value && typeof value[key] === 'number') {
  document.getElementById('pointer-data').innerText = `${value[key].toFixed(1)}${units}`;
} else {
  document.getElementById('pointer-data').innerText = '';
}

  }

  function refreshTime() {
    const layer = weatherLayers[activeLayer]?.layer;
    if (layer) {
      const d = layer.getAnimationTimeDate();
      timeText = d.toLocaleString('en-GB', {
        weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).replace(',', '');
    }
  }

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
      playLabel = '▶️';
    } else {
      layer.setAnimationTime(currentTime / 1000);
      layer.animateByFactor(3600);
      isPlaying = true;
      playLabel = '⏸️';
    }
  }

  // MapTiler SEARCH
  let searchQuery = '';
let suggestions = [];
let marker = null;

async function handleSearchInput() {
  if (searchQuery.length < 3) {
    suggestions = [];
    return;
  }

  const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`);
  suggestions = await res.json();
}

async function selectLocation(location) {
    const lon = parseFloat(location.lon);
    const lat = parseFloat(location.lat);

    map.flyTo({ center: [lon, lat], zoom: 10 });

    // Odstráň starý marker aj popup, ak existujú
    if (marker) {
        if (marker.getPopup()) {
            marker.getPopup().remove();
        }
        marker.remove();
    }

    marker = new maptilersdk.Marker().setLngLat([lon, lat]).addTo(map);

    await fetchWeather(lat, lon);

    suggestions = [];
    searchQuery = location.display_name;

    // Počasie ako popup
    if (weatherData && weatherData.current) {
        const icon = weatherIcons[parseInt(weatherData.current.code)] || "❓";

        const popupContent = `
            <div style="font-size:14px;">
                <div><strong>${searchQuery}</strong></div>
                <div>${icon} ${weatherData.current.temp}°C</div>
                <div>💨 ${weatherData.current.wind} m/s</div>
            </div>
        `;
        const popup = new maptilersdk.Popup({ offset: 25 }).setHTML(popupContent);
        marker.setPopup(popup).togglePopup();
    }
}

// Open-Meteo API
let weatherData = null;

async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;

  const res = await fetch(url);
  const data = await res.json();

  if (data.current && data.daily) {
    weatherData = {
      current: {
        temp: data.current.temperature_2m,
        wind: data.current.wind_speed_10m,
        code: data.current.weathercode,
        time: data.current.time
      },
      daily: data.daily
    };
  } else {
    weatherData = null;
  }
}

const weatherIcons = {
  0: "☀️",   // clear
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌧️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "🌨️",
  73: "🌨️",
  75: "❄️",
  80: "🌧️",
  81: "🌧️",
  82: "🌧️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️"
};


</script>

<style>
#map {
  position: absolute;
  inset: 0;
}

#buttons {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}

#buttons button {
  display: block;
  margin-bottom: 4px;
  padding: 6px 10px;
  font-size: 14px;
}

#pointer-data {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 12;
  color: white;
  background: rgba(0, 0, 0, 0.6);
  padding: 4px 8px;
  border-radius: 4px;
}

.maptiler-control.legend {
  background: white;
  padding: 8px;
  border-radius: 6px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  font-size: 12px;
  max-width: 80px;
  text-align: center;
  line-height: 1.4em;
}

.legend-gradient {
  border-radius: 4px;
}

.timebar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 15;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 10px;
  border-radius: 6px;
  color: white;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.timebar button {
  background: white;
  color: black;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
}

/* MapTiler SEARCH */
#maptiler-search {
     z-index: 99;
    position: absolute;
    width: 100%;
    left: 50%;
    transform: translateX(-50%);
}
.autocomplete-list li:hover {
   
    background-color: #f0f0f0;
}

</style>

<div bind:this={mapDiv} id="map"></div>

<div id="maptiler-search" style="margin-bottom: 8px;">
  <input
    type="text"
    placeholder="Hľadaj mesto..."
    bind:value={searchQuery}
    on:input={handleSearchInput}
    style="padding: 6px; width: 200px;"
  />
  <ul style="list-style:none; padding:0; margin-top:4px; background:white;" class="autocomplete-list">
    {#each suggestions as suggestion}
      <li
        style="cursor:pointer; padding:4px; border-bottom:1px solid #eee;"
        on:click={() => selectLocation(suggestion)}
      >
        {suggestion.display_name}
      </li>
    {/each}
  </ul>
</div>

<!-- Open Meteo -->
{#if weatherData}
  <div style="position:absolute; bottom:80px; left:10px; background:white; padding:8px; border-radius:4px; font-size:14px; z-index:100;">
    <strong>Aktuálne počasie</strong><br />
    Teplota: {weatherData.temp}°C<br />
    Vietor: {weatherData.wind} m/s<br />
    Čas: {weatherData.time}
  </div>
{/if}

<!-- MapTiler Swittch Layers -->
<div id="buttons">
  <button on:click={() => changeWeatherLayer('precipitation')}>Zrážky</button>
  <button on:click={() => changeWeatherLayer('pressure')}>Tlak</button>
  <button on:click={() => changeWeatherLayer('radar')}>Radar</button>
  <button on:click={() => changeWeatherLayer('temperature')}>Teplota</button>
  <button on:click={() => changeWeatherLayer('wind')}>Vietor</button>
</div>

<div class="timebar">
  <div class="time-label">{timeText}</div>
  <button on:click={togglePlay}>{playLabel}</button>
</div>

<div class="time-slider-wrapper" style="position:absolute; bottom:20px; left:50%; transform:translateX(-50%); width:90%; max-width:1000px; z-index:20;">
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


<div id="pointer-data"></div>
