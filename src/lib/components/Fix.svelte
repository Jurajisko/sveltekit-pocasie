<!-- src/lib/components/Fix.svelte -->
<script>
  import { onMount } from 'svelte';
  import TimeSlider from '$lib/components/TimeSlider.svelte';
  import WeatherCharts from '$lib/components/WeatherCharts.svelte';
  import MarkerPopup from '$lib/components/MarkerPopup.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import { getWeatherIcon } from '$lib/utils/weatherIcons.js';

  // Mobile side panel
  import MobileSidePanel from '$lib/components/MobileSidePanel.svelte';
  
  let showMobilePanel = false;
  let currentTheme = 'cyan'; // ✅ PRIDAJ túto premennú
  
  // Handlers
  function handleLayerChange(layerId) {
    changeWeatherLayer(layerId);
  }
  
  function handleThemeChange(themeId) {
    console.log('🎨 Main component theme change:', themeId); // DEBUG
    
    currentTheme = themeId; // ✅ AKTUALIZUJ local state
    
    // Apply theme
    if (themeId === 'cyan') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('weather-app-theme', themeId);
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: { theme: themeId }
    }));
  }
  
  // ✅ PRIDAJ: Load saved theme on mount
  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('weather-app-theme') || 'cyan';
      handleThemeChange(savedTheme);
    }
  });

  let mapDiv;
  let map;
  let maptilersdk;
  let maptilerweather;
  let markerPopup; // 🆕 REFERENCIA NA POPUP KOMPONENTU

  // ✅ FUNGUJÚCE ZÁKLADY Z TEST KÓDU
  let pointerLngLat = null;
  let activeLayer = null;
  let isPlaying = false;
  let currentTime = null;

  // 🆕 PRIDANÉ: Time management pre animation
  let minTime = 0;
  let maxTime = 0;
  let currentTimeForSlider = 0;
  let isDragging = false;
  let dayMarkers = [];
  let timeText = '';
  let playLabel = '▶️';

  // ✅ FUNGUJÚCE: Weather layers config (zachováva working verziu)
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

  // ✅ FUNGUJÚCE: Legend control (zachováva working verziu)
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

  // ✅ FUNGUJÚCE: SDK loading functions
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

  // 🆕 PRIDANÉ: Search functionality
  let searchQuery = '';
  let suggestions = [];
  let marker = null;

  // 🔄 UPRAVENÁ selectLocation - teraz dostáva event
  /*
  async function selectLocation(event) {
    const feature = event.detail; // Z komponentu event
    
    // ✅ ZACHOVÁ SA CELÁ TVOJA LOGIKA
    let lng, lat;
    
    if (feature.center) {
      [lng, lat] = feature.center;
    } else if (feature.lon && feature.lat) {
      lng = parseFloat(feature.lon);
      lat = parseFloat(feature.lat);
    } else {
      console.error('Invalid location format:', feature);
      return;
    }

    // Fly to location
    map.flyTo({ 
      center: [lng, lat], 
      zoom: 12,
      duration: 2000,
      essential: true
    });

    // Remove old marker
    if (marker) {
      if (marker.getPopup()) {
        marker.getPopup().remove();
      }
      marker.remove();
      marker = null;
    }

    // Add new marker
    marker = new maptilersdk.Marker({
      color: '#667eea',
      scale: 1.2,
      draggable: false
    }).setLngLat([lng, lat]).addTo(map);

    // 📝 UPDATE searchQuery (dôležité pre WeatherPopup!)
    searchQuery = feature.place_name || feature.display_name || 'Vybraná lokácia';

    // ✅ JEDNODUCHO VOLAJ handleLocationClick - má už všetko správne!
    await handleLocationClick(lng, lat, locationName);

    // Fetch weather data
    await fetchWeather(lat, lng);

    // Create themed popup
    if (markerPopup) {
        markerPopup.createPopup();
    }
  }
  */

  // async function selectLocation(event) {
  //     const feature = event.detail;
      
  //     // Získaj súradnice
  //     let lng, lat;
      
  //     if (feature.center) {
  //         [lng, lat] = feature.center;
  //     } else if (feature.lon && feature.lat) {
  //         lng = parseFloat(feature.lon);
  //         lat = parseFloat(feature.lat);
  //     } else {
  //         console.error('Invalid location format:', feature);
  //         return;
  //     }

  //     const locationName = feature.place_name || feature.display_name || 'Vybraná lokácia';
      
  //     // ✅ TOTO JE VŠETKO ČO POTREBUJEŠ:
  //     await handleLocationClick(lng, lat, locationName);

  //     // ✅ PRIDAJ TOTO NA KONIEC:
  //     await fetchExtendedWeather(lat, lng);
      
  //     // Update search query
  //     searchQuery = locationName;
  // }

  // ✅ UPRAŤ selectLocation - jedno volanie
async function selectLocation(event) {
  const feature = event.detail;
  
  let lng, lat;
  
  if (feature.center) {
    [lng, lat] = feature.center;
  } else if (feature.lon && feature.lat) {
    lng = parseFloat(feature.lon);
    lat = parseFloat(feature.lat);
  } else {
    console.error('Invalid location format:', feature);
    return;
  }

  const locationName = feature.place_name || feature.display_name || 'Vybraná lokácia';
  
  // ✅ JEDNO VOLANIE - všetko sa načíta súčasne
  await handleLocationClick(lng, lat, locationName);
  
  searchQuery = locationName;
}
  
  // 🆕 PRIDANÉ: Weather data fetching
  let weatherData = null;

  async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
  

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.current && data.daily) {
        weatherData = {
          current: {
            temp: data.current.temperature_2m,
            wind: data.current.wind_speed_10m,
            pressure: data.current.pressure_msl, // ✅ PRIDAJ TLAK
            code: data.current.weathercode,
            time: data.current.time
          },
          daily: data.daily
        };
      } else {
        weatherData = null;
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
      weatherData = null;
    }
  }

  // 🆕 PRIDANÉ: Time and animation functions
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

  function refreshTime() {
    const weatherLayer = weatherLayers[activeLayer]?.layer;
    if (weatherLayer) {
      const d = weatherLayer.getAnimationTimeDate();
      if (d) {
        timeText = d.toLocaleString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
        }).replace(',', '');
      }
    }
  }

  function updateTime(newVal) {
    const weatherLayer = weatherLayers[activeLayer]?.layer;
    if (!weatherLayer) return;
    
    isDragging = true;
    currentTimeForSlider = newVal;
    
    if (isPlaying) {
      weatherLayer.animateByFactor(0);
      weatherLayer.setAnimationTime(currentTimeForSlider / 1000);
      requestAnimationFrame(() => {
        weatherLayer.animateByFactor(3600);
        isDragging = false;
      });
    } else {
      weatherLayer.setAnimationTime(currentTimeForSlider / 1000);
      isDragging = false;
    }
  }

  function togglePlay() {
    const weatherLayer = weatherLayers[activeLayer]?.layer;
    if (!weatherLayer) return;
    
    if (isPlaying) {
      weatherLayer.animateByFactor(0);
      isPlaying = false;
      playLabel = '▶️';
    } else {
      weatherLayer.setAnimationTime(currentTimeForSlider / 1000);
      weatherLayer.animateByFactor(3600);
      isPlaying = true;
      playLabel = '⏸️';
    }
  }

  // 🆕 PRIDANÉ: Detail panel functionality
  let showDetailPanel = false;
  let hourlyData = [];

  // ✅ UPRAŤ toggleDetailPanel - už nebude čakať na data
  // function toggleDetailPanel() {
  //   showDetailPanel = !showDetailPanel;
  //   if (showDetailPanel && weatherData) {
  //     fetchExtendedWeather();
  //   }
  // }
  function toggleDetailPanel() {
    showDetailPanel = !showDetailPanel;
    // ✅ ODSTRÁŇ fetchExtendedWeather() - data už sú načítané!
  }

  function closeDetailPanel() {
    showDetailPanel = false;
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && showDetailPanel) {
      closeDetailPanel();
    }
  }

  /*
  async function fetchExtendedWeather() {
    if (!pointerLngLat) return;
    
    const lat = pointerLngLat.lat;
    const lon = pointerLngLat.lng;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,wind_speed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.hourly) {
        const now = new Date();           // ⏰ Zisti aktuálny čas
        const currentHour = now.getHours(); // 🕐 Napríklad: 14 (ak je 14:30)
        
        // 🔍 NÁJDI INDEX aktuálnej hodiny v API dátach
        const currentTimeIndex = data.hourly.time.findIndex(time => {
          const hour = new Date(time).getHours();
          return hour === currentHour;    // Nájde pozíciu kde je 14h v API
        });
        
        // 📍 NASTAV ROZSAH - od aktuálnej hodiny na 24h dopredu
        const startIndex = currentTimeIndex >= 0 ? currentTimeIndex : 0;
        const endIndex = Math.min(startIndex + 24, data.hourly.time.length);
        
        // 🎯 VYTVOR hourlyData OD AKTUÁLNEJ HODINY
        hourlyData = data.hourly.time.slice(startIndex, endIndex).map((time, i) => {
    const actualIndex = startIndex + i;
    const hour = new Date(time).getHours();
    
    return {
      time: hour + 'h',
      temp: Math.round(data.hourly.temperature_2m[actualIndex]),
      // ✅ PRIDAJ TIETO DVA RIADKY:
      code: data.hourly.weathercode[actualIndex],
      originalTime: time,
      // ✅ SPRÁVNE VOLANIE S ČASOM:
      icon: getWeatherIcon(data.hourly.weathercode[actualIndex], time),
      precipitation: data.hourly.precipitation[actualIndex] || 0,
      wind: data.hourly.wind_speed_10m[actualIndex] ? 
            data.hourly.wind_speed_10m[actualIndex].toFixed(1) : '0.0'
    };
  });

        weatherData.extended = {
          hourly: data.hourly,
          daily: data.daily
        };
      }
    } catch (error) {
      console.error('Extended weather fetch error:', error);
    }
  } */

  // ✅ HLAVNÁ INICIALIZÁCIA (zachováva working verziu)
  onMount(async () => {
    console.log('🧪 Loading MapTiler SDKs...');
    
    await loadCSS('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.css');
    await loadScript('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.umd.min.js');
    await loadScript('https://cdn.maptiler.com/maptiler-weather/v3.0.1/maptiler-weather.umd.min.js');

    maptilersdk = window.maptilersdk;
    maptilerweather = window.maptilerweather;

    maptilersdk.config.apiKey = 'ry26WCBx6tt715jhxPwh';

    // Set color ramps after SDK is loaded
    weatherLayers.precipitation.colorRamp = maptilerweather.ColorRamp.builtin.PRECIPITATION;
    weatherLayers.pressure.colorRamp = maptilerweather.ColorRamp.builtin.PRESSURE_3;
    weatherLayers.radar.colorRamp = maptilerweather.ColorRamp.builtin.RADAR;
    weatherLayers.temperature.colorRamp = maptilerweather.ColorRamp.builtin.TEMPERATURE_3;
    weatherLayers.wind.colorRamp = maptilerweather.ColorRamp.builtin.WIND_ROCKET;

    // Create map
    map = new maptilersdk.Map({
      container: mapDiv,
      style: maptilersdk.MapStyle.BACKDROP,
      zoom: 3,
      // center: [19.5, 48.7], // Slovakia center
      center: [10, 54],
      projection: 'mercator'
    });

    map.on('load', () => {
      console.log('🗺️ Map loaded!');
      
      map.setPaintProperty("Water", 'fill-color', "rgba(0, 0, 0, 0.4)");
      
      // Start with wind layer
      initWeatherMap("wind");
      
      // Add event handlers
      map.on('mousemove', (e) => updatePointerValue(e.lngLat));
      
        // Click handler for location selection
        map.on('click', async (e) => {
            const { lng, lat } = e.lngLat;
            
            try {
                const response = await fetch(
                    `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=ry26WCBx6tt715jhxPwh&limit=1&language=sk`
                );
                const data = await response.json();
                
                let locationName = 'Neznáme miesto';
                if (data.features && data.features.length > 0) {
                    locationName = data.features[0].place_name;
                }
                
                // ✅ PRIAMO VOLAJ handleLocationClick namiesto selectLocation
                await handleLocationClick(lng, lat, locationName);
                
            } catch (error) {
                console.error('Reverse geocoding error:', error);
                await handleLocationClick(lng, lat, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
        });
    });

    // Add event listeners
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', handleKeydown);
      
      // 🆕 PRIDAJ THEME CHANGE LISTENER
      window.addEventListener('themeChanged', (e) => {
          console.log('Theme changed to:', e.detail.theme);
          
          // Aktualizuj popup cez komponentu
          if (markerPopup) {
              markerPopup.updateTheme();
          }
      });
    }
  });

  // 🆕 NOVÁ FUNKCIA - priamo spracuje click na mapu
  // ✅ OPRVAENÝ handleLocationClick - načíta všetko súčasne
async function handleLocationClick(lng, lat, locationName) {
  const isMobile = window.innerWidth <= 991;
  
  // Fly to location (rovnaké ako pred tým)
  const flyToOptions = {
    center: [lng, lat],
    duration: 2000,
    essential: true
  };
  
  if (isMobile) {
    flyToOptions.zoom = 12;
    flyToOptions.center = [lng, lat + 0.03];
    flyToOptions.padding = { top: 80, bottom: 300, left: 20, right: 20 };
  } else {
    flyToOptions.zoom = 12;
    flyToOptions.center = [lng, lat + 0.006];
  }
  
  map.flyTo(flyToOptions);

  // Remove old marker (rovnaké)
  if (marker) {
    if (marker.getPopup()) {
      marker.getPopup().remove();
    }
    marker.remove();
    marker = null;
  }

  // Add new marker (rovnaké)
  marker = new maptilersdk.Marker({
    color: '#667eea',
    scale: 1.2,
    draggable: false
  }).setLngLat([lng, lat]).addTo(map);

  // Update search query
  searchQuery = locationName;
  
  // ✅ SET pointerLngLat PRED volaním API!
  pointerLngLat = { lat, lng };

  // ✅ ZAVOLAJ OBE API SÚČASNE - paralelne!
  try {
    console.log('🔄 Loading weather data...');
    
    // Základné + rozšírené data paralelne
    await Promise.all([
      fetchWeather(lat, lng),           // 5-dňová
      fetchExtendedWeatherFixed(lat, lng) // 7-dňová + hodinová
    ]);
    
    console.log('✅ All weather data loaded!');
    
    // Create popup
    if (markerPopup) {
      markerPopup.createPopup();
    }
    
  } catch (error) {
    console.error('❌ Weather fetch error:', error);
    
    // Fallback - basic data only
    await fetchWeather(lat, lng);
    if (markerPopup) {
      markerPopup.createPopup();
    }
  }
}


// ✅ NOVÁ fetchExtendedWeatherFixed - berie parametre priamo
async function fetchExtendedWeatherFixed(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,wind_speed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.hourly) {
      const now = new Date();
      const currentHour = now.getHours();
      
      const currentTimeIndex = data.hourly.time.findIndex(time => {
        const hour = new Date(time).getHours();
        return hour === currentHour;
      });
      
      const startIndex = currentTimeIndex >= 0 ? currentTimeIndex : 0;
      const endIndex = Math.min(startIndex + 24, data.hourly.time.length);
      
      hourlyData = data.hourly.time.slice(startIndex, endIndex).map((time, i) => {
        const actualIndex = startIndex + i;
        const hour = new Date(time).getHours();
        
        return {
          time: hour + 'h',
          temp: Math.round(data.hourly.temperature_2m[actualIndex]),
          code: data.hourly.weathercode[actualIndex],
          originalTime: time,
          icon: getWeatherIcon(data.hourly.weathercode[actualIndex], time),
          precipitation: data.hourly.precipitation[actualIndex] || 0,
          wind: data.hourly.wind_speed_10m[actualIndex] ? 
                data.hourly.wind_speed_10m[actualIndex].toFixed(1) : '0.0'
        };
      });

      // ✅ AKTUALIZUJ weatherData.extended
      if (weatherData) {
        weatherData.extended = {
          hourly: data.hourly,
          daily: data.daily
        };
      }
      
      console.log('✅ Extended weather data loaded!');
    }
  } catch (error) {
    console.error('Extended weather fetch error:', error);
  }
}

  // ✅ FUNGUJÚCE: createWeatherLayer (zachováva working verziu)
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

    // Event handlers
    weatherLayer.on("tick", () => {
      if (!isDragging) {
        const d = weatherLayer.getAnimationTimeDate();
        if (d) {
          currentTimeForSlider = +d;
          refreshTime();
        }
      }
      updatePointerValue(pointerLngLat);
    });

    weatherLayer.on("sourceReady", () => {
      console.log('✅ Source ready for:', type);
      
      minTime = +weatherLayer.getAnimationStartDate();
      maxTime = +weatherLayer.getAnimationEndDate();
      currentTimeForSlider = +weatherLayer.getAnimationTimeDate();
      dayMarkers = generateDayMarkers(minTime, maxTime);
      
      weatherLayer.setAnimationTime(currentTimeForSlider / 1000);
      if (isPlaying) weatherLayer.animateByFactor(3600);
      
      if (currentTime) {
        weatherLayer.setAnimationTime(currentTime);
      }
    });

    weatherLayers[type].layer = weatherLayer;
    return weatherLayer;
  }

  // ✅ FUNGUJÚCE: changeWeatherLayer (zachováva working verziu) 
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

      /*
      // Legend handling
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
      } */

      return weatherLayer;
    }
  }

  // ✅ FUNGUJÚCE: updatePointerValue (zachováva working verziu)
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

  // ✅ FUNGUJÚCE: initWeatherMap (zachováva working verziu)
  function initWeatherMap(type) {
    console.log('🌦️ Initializing weather map with:', type);
    changeWeatherLayer(type);
  }

  // Otvor Developer Console a testuj:
  console.log(getWeatherIcon(0, "2024-01-01T14:00")); // Mala by byť ☀️
  console.log(getWeatherIcon(0, "2024-01-01T22:00")); // Mala by byť 🌙
  console.log(getWeatherIcon(61)); // Bez času - môže byť mesiacik
</script>

<!-- 🗺️ MAP CONTAINER -->
<div bind:this={mapDiv} id="map"></div>



<!-- 🔍 SEARCH S BIND:VALUE -->
<SearchBar 
  bind:value={searchQuery}
  on:locationSelected={selectLocation}
  apiKey="ry26WCBx6tt715jhxPwh"
  placeholder="Hľadaj miesto..."
/>

<!-- 🆕 PRIDAJ WEATHER POPUP KOMPONENTU -->
<MarkerPopup 
    bind:this={markerPopup}
    {marker}
    {weatherData}
    locationName={searchQuery.split(',')[0]}
    {maptilersdk}
    onToggleDetailPanel={toggleDetailPanel}
/>

<!-- 🌤️ WEATHER DISPLAY -->
{#if weatherData}
  <div class="weather-display">
    <div class="weather-header">
      <div class="weather-location">{searchQuery.split(',')[0]}</div>
      <div class="weather-header-right">
        <button class="expand-btn" on:click={toggleDetailPanel} title="👆 Zobraziť detailné grafy">
          👆
        </button>
         <div class="weather-icon">
            {getWeatherIcon(weatherData.current.code, weatherData.current.time)}
        </div>
      </div>
    </div>
    
    {#if weatherData.daily}
      <div class="forecast-section">
        <div class="forecast-title">5-dňová predpoveď</div>
        {#each weatherData.daily.temperature_2m_max.slice(0, 5) as maxTemp, i}
          <div class="forecast-item">
            <span class="forecast-day">
              {i === 0 ? 'Dnes' : i === 1 ? 'Zajtra' : new Date(weatherData.daily.time[i]).toLocaleDateString('sk', {weekday: 'short'})}
            </span>
            <!-- <span>{weatherIcons[parseInt(weatherData.daily.weathercode[i])] || "❓"}</span> -->
            <span>{getWeatherIcon(weatherData.daily.weathercode[i], weatherData.daily.time[i] + 'T12:00')}</span>
            <div class="forecast-temps">
              <span class="forecast-temp-max">{Math.round(maxTemp)}°</span>
              <span class="forecast-temp-min">{Math.round(weatherData.daily.temperature_2m_min[i])}°</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- 📊 DETAIL PANEL -->
  {#if showDetailPanel}
    <div class="weather-detail-overlay" on:click={closeDetailPanel}>
      <div class="weather-detail-panel" on:click|stopPropagation>
        <div class="detail-header">
          <h3>📊 Detailné grafy a štatistiky: {searchQuery.split(',')[0]}</h3>
          <button class="close-btn" on:click={closeDetailPanel}>✕</button>
        </div>
        
        <div class="detail-content">
          <!-- Additional Stats -->
          <div class="chart-container">
            <div class="chart-header">
              <!-- <div class="hourly-section"> -->
              <h3>📈 Štatistiky</h3>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Max teplota (7d)</span>
                <span class="stat-value">{weatherData.extended ? Math.max(...weatherData.extended.daily.temperature_2m_max.slice(0, 7)) : '--'}°C</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Min teplota (7d)</span>
                <span class="stat-value">{weatherData.extended ? Math.min(...weatherData.extended.daily.temperature_2m_min.slice(0, 7)) : '--'}°C</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Celkové zrážky</span>
                <span class="stat-value">{weatherData.extended ? weatherData.extended.daily.precipitation_sum.slice(0, 7).reduce((a,b) => a+b, 0).toFixed(1) : '--'}mm</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Max vietor</span>
                <span class="stat-value">{weatherData.extended ? Math.max(...weatherData.extended.daily.wind_speed_10m_max.slice(0, 7)).toFixed(1) : '--'}m/s</span>
              </div>
            </div>
          </div>

          <!-- HOURLY FORECAST -->
          <div class="chart-container">
            <div class="chart-header">
              <!-- <div class="hourly-section"> -->
              <h3>🕐 Hodinová predpoveď (24h)</h3>
            </div>
            <div class="hourly-slider-container">
              <div class="hourly-slider">
                {#each hourlyData as hour}
                  <div class="hourly-card">
                    <div class="hour-time">{hour.time}</div>
                    <!-- <div class="hour-icon">{hour.icon}</div> -->
                    <div class="hour-icon"> {getWeatherIcon(hour.code, hour.originalTime)}</div>
                    
                    <div class="hour-temp">{hour.temp}°</div>
                    <div class="hour-wind">💨{hour.wind}</div>
                    <div class="hour-precip">💧{hour.precipitation || 0}mm</div>
                  </div>
                {/each}
              </div>
            </div>
          </div> 

          {#if weatherData.daily}
            <div class="chart-container mobile-show">
              <div class="chart-header">
                <!-- <div class="forecast-section"> -->
                <h3>5-dňová predpoveď</h3>
              </div>
              <div class="row-boxes">
                {#each weatherData.daily.temperature_2m_max.slice(0, 5) as maxTemp, i}
                  <div class="forecast-item">
                    <span class="forecast-day">
                      {i === 0 ? 'Dnes' : i === 1 ? 'Zajtra' : new Date(weatherData.daily.time[i]).toLocaleDateString('sk', {weekday: 'short'})}
                    </span>
                    <!-- <span>{weatherIcons[parseInt(weatherData.daily.weathercode[i])] || "❓"}</span> -->
                    <span>{getWeatherIcon(weatherData.daily.weathercode[i])}</span>
                    <div class="forecast-temps">
                      <span class="forecast-temp-max">{Math.round(maxTemp)}°</span>
                      <span class="forecast-temp-min">{Math.round(weatherData.daily.temperature_2m_min[i])}°</span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- WEATHER CHARTS -->
          <WeatherCharts {weatherData} />
        </div>
      </div>
    </div>
  {/if}
{/if}

<!-- 🎛️ LAYER BUTTONS -->
<div id="buttons">
  <button on:click={() => changeWeatherLayer('precipitation')}>Zrážky</button>
  <button on:click={() => changeWeatherLayer('pressure')}>Tlak</button>
  <button on:click={() => changeWeatherLayer('radar')}>Radar</button>
  <button on:click={() => changeWeatherLayer('temperature')}>Teplota</button>
  <button on:click={() => changeWeatherLayer('wind')}>Vietor</button>
</div>

<!-- ⏯️ TIME SLIDER -->
<div class="time-slider-wrapper">
  <TimeSlider
    min={minTime}
    max={maxTime}
    value={currentTimeForSlider}
    playing={isPlaying}
    dayMarkers={dayMarkers}
    onChange={updateTime}
    onPlayPause={togglePlay}
  />
</div>

<!-- 📊 POINTER DATA -->
<div id="pointer-data"></div>

<MobileSidePanel 
  bind:isOpen={showMobilePanel}
  {activeLayer}
  currentTheme="cyan"
  onLayerChange={handleLayerChange}
  onThemeChange={handleThemeChange}
/>

<style>
  /* ===== CORE MAP STYLES ===== */
  #map {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100vh;
  }

  /* ===== SEARCH STYLES ===== */
  #maptiler-search {
    z-index: 99;
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    max-width: 90vw;
  }

  #maptiler-search > div {
    position: relative;
  }

  #maptiler-search > div::before {
    content: "🔍";
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    z-index: 1;
    font-size: 16px;
    pointer-events: none;
  }

  .autocomplete-list {
    list-style: none;
    padding: 0;
    margin: 0;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 0 0 16px 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    margin-top: 2px;
  }

  .autocomplete-list li {
    padding: 12px 20px;
    color: #333;
    cursor: pointer;
    transition: background-color 0.2s ease;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
  }

  .autocomplete-list li:hover {
    background: rgba(102, 126, 234, 0.1);
  }

  .autocomplete-list li:last-child {
    border-bottom: none;
  }

  /* ===== WEATHER DISPLAY STYLES ===== */
  .weather-display {
    position: absolute;
    bottom: 20px;
    left: 20px;
    z-index: 100;
    background: var(--bg-primary, rgba(26, 35, 50, 0.95));
    backdrop-filter: blur(30px);
    border-radius: 20px;
    padding: 24px;
    min-width: 280px;
    max-width: 320px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    border: 1px solid var(--border-primary, rgba(0, 255, 255, 0.2));
    color: var(--text-primary, #ffffff);
    font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    animation: slideInUp 0.6s ease-out;
  }

  .weather-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .weather-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .weather-location {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary, #ffffff);
  }

  .weather-icon {
    font-size: 32px;
    filter: drop-shadow(0 0 10px var(--primary-color, #00ffff));
    animation: iconFloat 3s ease-in-out infinite;
  }

  .weather-temp {
    font-size: 48px;
    font-weight: 800;
    line-height: 1;
    background: var(--gradient-1, linear-gradient(135deg, #00ffff 0%, #00c8ff 50%, #00ff96 100%));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 8px;
  }

  .weather-description {
    color: var(--text-secondary, #8892b0);
    font-size: 14px;
    margin-bottom: 20px;
  }

  .weather-details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }

  .weather-detail {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px;
    background: var(--bg-glass, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    transition: all 0.3s ease;
  }

  .weather-detail:hover {
    border-color: var(--primary-color, #00ffff);
  }

  .weather-detail-icon {
    font-size: 16px;
  }

 

  /* ===== FORECAST STYLES ===== */
  .forecast-section {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
  }

  .forecast-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary, #ffffff);
  }

  .forecast-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    margin: 4px 0;
    background: var(--bg-glass, rgba(255, 255, 255, 0.1));
    border-radius: 12px;
    border-left: 3px solid var(--primary-color, #00ffff);
    transition: all 0.3s ease;
  }

  .forecast-item:hover {
    transform: translateX(8px);
    border-left-color: var(--accent-color, #00ff96);
  }

  .forecast-day {
    font-size: 14px;
    color: var(--text-secondary, #8892b0);
    min-width: 60px;
  }

  .forecast-temps {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
  }

  .forecast-temp-max {
    font-weight: 600;
    color: var(--text-primary, #ffffff);
  }

  .forecast-temp-min {
    color: var(--text-muted, #666);
  }

  /* ===== DETAIL PANEL STYLES ===== */
  .weather-detail-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.8);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .weather-detail-panel {
    background: var(--bg-primary, rgba(26, 35, 50, 0.95));
    border-radius: 20px;
    width: 90vw;
    max-width: 1200px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border-primary, rgba(0, 255, 255, 0.2));
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    position: sticky;
    top: 0;
    background: var(--bg-primary, rgba(26, 35, 50, 0.95));
    backdrop-filter: blur(10px);
    z-index: 10;
  }

  .detail-header h3 {
    margin: 0;
    font-size: 24px;
    font-weight: 800;
    color: var(--text-primary, #ffffff);
  }



  .detail-content {
    padding: 24px;
  }



  /* ===== CONTROL BUTTONS ===== */


  /* ===== TIME CONTROLS ===== */
  .timebar {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 99;
    background: var(--bg-glass, rgba(255, 255, 255, 0.1));
    backdrop-filter: blur(20px);
    padding: 12px 16px;
    border-radius: 12px;
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text-primary, #ffffff);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .time-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-secondary, #8892b0);
  }

  .timebar button {
    background: var(--primary-color, #00ffff);
    border: none;
    color: #000;
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: 700;
    transition: all 0.3s ease;
  }

  .timebar button:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(0, 255, 255, 0.3);
  }

  .time-slider-wrapper {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 90%;
    max-width: 800px;
    z-index: 20;
  }

  /* ===== POINTER DATA ===== */
  #pointer-data {
    position: absolute;
    top: 100px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 20px;
    font-weight: 900;
    margin: 0;
    color: var(--text-primary, #ffffff);
    text-shadow: 0px 0px 10px rgba(0,0,0,0.7);
    z-index: 1;
    background: var(--bg-glass, rgba(0, 0, 0, 0.5));
    padding: 8px 12px;
    border-radius: 8px;
    backdrop-filter: blur(10px);
  }

  /* ===== ANIMATIONS ===== */
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

  @keyframes iconFloat {
    0%, 100% { 
      transform: translateY(0); 
    }
    50% { 
      transform: translateY(-8px); 
    }
  }

  /* ===== LEGEND STYLES ===== */
  :global(.maptiler-control.legend) {
    background: white;
    padding: 8px;
    border-radius: 6px;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    font-size: 12px;
    max-width: 180px;
    line-height: 1.4em;
  }

  /* ===== RESPONSIVE ===== */
  @media (max-width: 1195px) {
    .weather-display {
      bottom: 10px;
      left: 10px;
      right: 10px;
      min-width: auto;
      max-width: none;
    }

    #buttons {
      top: 10px;
      left: 10px;
    }

    .timebar {
      top: 10px;
      right: 10px;
      padding: 8px 12px;
    }

    .time-slider-wrapper {
      bottom: 10px;
      width: 95%;
    }

    .detail-content {
      padding: 16px;
    }

    .hourly-card {
      width: 70px;
      padding: 12px 8px;
    }
  }
</style>