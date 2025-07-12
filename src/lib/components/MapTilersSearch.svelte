<script>
  import { onMount } from 'svelte';
  import TimeSlider from '$lib/components/TimeSlider.svelte';
  import WeatherCharts from '$lib/components/WeatherCharts.svelte';

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

  // 🎨 GRADIENT S ČIERNYM ORÁMOVANÍM TEXTU - SUPER ČITATEĽNÉ
  class ColorRampLegendControl {
      constructor(options) {
          this.colorStops = options.colorStops;
          this.units = options.units || '';
          this.layerName = options.layerName || '';
          this.container = null;
      }

      onAdd(map) {
          const container = document.createElement('div');
          container.className = 'maptiler-control legend';

          // 📋 TITLE S UNITS HORE
          const title = document.createElement('div');
          title.style.cssText = `
              font-weight: bold;
              margin-bottom: 8px;
              text-align: center;
              font-size: 13px;
              color: #333;
              text-shadow: 0 1px 2px rgba(255,255,255,0.8);
              
              background: rgba(255, 255, 255, 0.9);
              width: fit-content;
              margin: 0 auto;
              margin-bottom: 0px;
              padding: 5px;
              border-radius: 4px;
              margin-bottom: 7px;
          `;
          title.innerText = `${this.getLayerDisplayName()}${this.units}`;
          container.appendChild(title);

          const scaleWrapper = document.createElement('div');
          scaleWrapper.style.cssText = `
              display: flex;
              flex-direction: column-reverse;
              align-items: center;
          `;

          const height = 200;
          const width = 30;

          // 🌈 GRADIENT BAR
          const gradient = document.createElement('div');
          gradient.style.cssText = `
              width: ${width}px;
              height: ${height}px;
              position: relative;
              background: ${this.generateGradientCSS()};
              border: 1px solid #ccc;
              border-radius: 4px;
              margin-bottom: 4px;
          `;

          // 📊 TEXTY NA GRADIENTE S ČIERNYM OUTLINE
          const min = this.colorStops[0].value;
          const max = this.colorStops[this.colorStops.length - 1].value;

          this.colorStops.forEach((stop, index) => {
              const pct = ((stop.value - min) / (max - min)) * 100;
              
              const tick = document.createElement('div');
              tick.style.cssText = `
                  position: absolute;
                  left: 0;
                  right: 0;
                  bottom: calc(${pct}% - 7px);
                  font-size: 11px;
                  font-weight: 700;
                  color: #ffffff;
                  text-align: center;
                  line-height: 14px;
                  white-space: nowrap;
                  text-shadow: 
                      -1px -1px 0 #000,
                      1px -1px 0 #000,
                      -1px 1px 0 #000,
                      1px 1px 0 #000,
                      -1px -1px 0 #000,
                      1px -1px 0 #000,
                      -1px 1px 0 #000,
                      1px 1px 0 #000,
                      0 0 2px #000,
                      0 0 4px #000;
                  z-index: 10;
                  pointer-events: none;
              `;

              
              const formattedValue = this.formatValue(stop.value);
              tick.innerText = formattedValue;
              gradient.appendChild(tick);

              // 🎯 TICK MARKS NA STRANÁCH
              /*
              if (index % 2 === 0 || this.colorStops.length <= 6) {
                  // Zobrazuj tick marks len pre párne indexy alebo ak je málo hodnôt
                  const leftTick = document.createElement('div');
                  leftTick.style.cssText = `
                      position: absolute;
                      left: -2px;
                      bottom: calc(${pct}% - 1px);
                      width: 4px;
                      height: 2px;
                      background: #000;
                      border-radius: 1px;
                  `;
                  gradient.appendChild(leftTick);

                  const rightTick = document.createElement('div');
                  rightTick.style.cssText = `
                      position: absolute;
                      right: -2px;
                      bottom: calc(${pct}% - 1px);
                      width: 4px;
                      height: 2px;
                      background: #000;
                      border-radius: 1px;
                  `;
                  gradient.appendChild(rightTick);
              } */
              
          });

          scaleWrapper.appendChild(gradient);
          container.appendChild(scaleWrapper);

          this.container = container;
          return container;
      }

      getLayerDisplayName() {
          const names = {
              'wind': 'Vietor',
              'temperature': 'Teplota', 
              'precipitation': 'Zrážky',
              'pressure': 'Tlak',
              'radar': 'Radar'
          };
          return names[this.layerName] || this.layerName;
      }

      formatValue(value) {
          // 🔢 SMART FORMATTING
          if (this.units.includes('°')) {
              return `${Math.round(value)}°`;
          } else if (this.units.includes('hPa')) {
              return `${Math.round(value)}`;
          } else if (this.units.includes('mm')) {
              return value < 1 ? `${value.toFixed(1)}` : `${Math.round(value)}`;
          } else if (this.units.includes('m/s')) {
              return `${Math.round(value)}`;
          } else if (this.units.includes('dBZ')) {
              return `${Math.round(value)}`;
          }
          return `${value}`;
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
      // 1. Spusti defaultnú veternú vrstvu
      changeWeatherLayer('wind');

      // 2. Zbav sa loga v ľavom dolnom rohu
      const bottomLeft = document.querySelector('.maplibregl-ctrl-bottom-left');
      if (bottomLeft) {
        const logoWrapper = Array.from(bottomLeft.children).find(child =>
          child.tagName === 'DIV' &&
          child.querySelector('a[href*="maptiler.com"]')
        );
        if (logoWrapper) {
          logoWrapper.remove();
        }
      }

      // 3. Mousemove – zobrazenie údajov pod kurzorom
      map.on('mousemove', (e) => updatePointerValue(e.lngLat));
    });

    // Click anywhere na mape pre nový marker: pridaj do onMount() po map.on('load', ...):
    map.on('click', async (e) => {
        const { lng, lat } = e.lngLat;
        
        // Reverse geocoding pre získanie názvu miesta
        try {
            const response = await fetch(
                `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=ry26WCBx6tt715jhxPwh&limit=1&language=sk`
            );
            const data = await response.json();
            
            let locationName = 'Neznáme miesto';
            if (data.features && data.features.length > 0) {
                locationName = data.features[0].place_name;
            }
            
            // Vytvor fake feature object pre selectLocation
            const clickedLocation = {
                center: [lng, lat],
                place_name: locationName,
                properties: { category: 'click' }
            };
            
            await selectLocation(clickedLocation);
            
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            
            // Fallback - vytvor marker bez reverse geocoding
            const clickedLocation = {
                center: [lng, lat],
                place_name: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                properties: { category: 'coordinates' }
            };
            
            await selectLocation(clickedLocation);
        }
    });

    // Listen for temperature unit changes
    window.addEventListener('temperatureUnitChanged', async (e) => {
      const unit = e.detail.unit;
      await fetchExtendedWeatherWithUnit(unit);
    });

    // 🎨 THEME CHANGE LISTENER - pridaj na koniec onMount()
    window.addEventListener('themeChanged', (e) => {
        console.log('Theme changed to:', e.detail.theme);
        
        // Ak existuje aktívny popup, aktualizuj ho
        if (marker && marker.getPopup() && marker.getPopup().isOpen() && weatherData) {
            updatePopupWithNewTheme();
        }
    });
  });
  // End of onMount

  // Upravená funkcia pre fetch s jednotkami
  async function fetchExtendedWeatherWithUnit(unit = 'celsius') {
    if (!pointerLngLat) return;
    
    const lat = pointerLngLat.lat;
    const lon = pointerLngLat.lng;
    
    // Pridaj temperature_unit parameter
    const tempUnit = unit === 'fahrenheit' ? 'fahrenheit' : 'celsius';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,wind_speed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7&temperature_unit=${tempUnit}`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.hourly) {
        // ... zvyšok kódu rovnako ...
        weatherData.extended = {
          hourly: data.hourly,
          daily: data.daily
        };
      }
    } catch (error) {
      console.error('Extended weather fetch error:', error);
    }
  }

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

    map.addControl(legendControl, 'bottom-right');
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

  // Vlastný search systém:
  let searchQuery = '';
  let suggestions = [];
  let marker = null;

  /* 
  // MapTiler SEARCH */
  async function handleSearchInput() {
    if (searchQuery.length < 3) {
        suggestions = [];
        return;
    }

    // Použiť MapTiler Geocoding API priamo
    try {
        const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=ry26WCBx6tt715jhxPwh&limit=5`);
        const data = await res.json();
        suggestions = data.features || [];
    } catch (error) {
        console.error('Search error:', error);
        suggestions = [];
    }
  }

  // handleSearch funkcia (pre Nominatim compatibility):
  async function handleSearch() {
      if (searchQuery.length < 3) return;
      
      try {
          // Nominatim search
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&accept-language=sk`);
          const results = await res.json();
          
          if (results.length > 0) {
              // Konvertuj Nominatim result na MapTiler formát
              const location = {
                  place_name: results[0].display_name,
                  center: [parseFloat(results[0].lon), parseFloat(results[0].lat)],
                  properties: {
                      category: results[0].type
                  }
              };
              
              await selectLocation(location);
              suggestions = [];
          } else {
              console.log('Žiadne výsledky pre:', searchQuery);
          }
      } catch (error) {
          console.error('Search error:', error);
      }
  }

  // 🗺️ SEARCH S MARKER FUNCTIONALITY
  // 🗺️ KOMPLETNÁ SELECTLOCATION FUNKCIA S THEME SWITCHING
  async function selectLocation(feature) {
      // Získaj súradnice (podpora pre oba formáty)
      let lng, lat;
      
      if (feature.center) {
          // MapTiler format
          [lng, lat] = feature.center;
      } else if (feature.lon && feature.lat) {
          // Nominatim format
          lng = parseFloat(feature.lon);
          lat = parseFloat(feature.lat);
      } else {
          console.error('Invalid location format:', feature);
          return;
      }

      // Fly to location s animáciou
      map.flyTo({ 
          center: [lng, lat], 
          zoom: 12,
          duration: 2000,
          essential: true
      });

      // ❌ ODSTRÁŇ starý marker ak existuje
      if (marker) {
          // Odstráň popup ak je otvorený
          if (marker.getPopup()) {
              marker.getPopup().remove();
          }
          marker.remove();
          marker = null;
      }

      // ✅ PRIDAJ nový marker
      marker = new maptilersdk.Marker({
          color: '#667eea',
          scale: 1.2,
          draggable: false
      }).setLngLat([lng, lat]).addTo(map);

      // 🌤️ FETCH weather data
      await fetchWeather(lat, lng);

      // 📝 UPDATE search query
      searchQuery = feature.place_name || feature.display_name || 'Vybraná lokácia';
      suggestions = [];

      // 🎯 VYTVOR POPUP S THEME-AWARE DIZAJNOM
      createThemedPopup();
  }

  // 🎨 FUNKCIA NA VYTVORENIE THEMED POPUP-U
  function createThemedPopup() {
      if (!weatherData || !weatherData.current) return;
      
      // const icon = weatherIcons[parseInt(weatherData.current.code)] || "❓";
      const icon = getDayNightIcon(weatherData.current.code);
      const locationName = searchQuery.split(',')[0];
      const css = getCSSVariables();
      
      const popupContent = `
          <div style="
              padding: 20px;
              position: relative;
              min-width: 240px;
              background: ${css.bgPrimary};
              border-radius: 20px;
              color: ${css.textPrimary};
              font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
              backdrop-filter: blur(30px);
              border: 1px solid ${css.borderPrimary};
              overflow: hidden;
              transition: all 0.3s ease;
          ">
              <!-- HEADER -->
              <div style="
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 16px;
                  padding-right: 30px;
              ">
                  <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="
                          font-size: 16px;
                          filter: drop-shadow(0 0 8px ${css.primaryColor});
                      ">📍</span>
                      <span style="
                          font-size: 16px;
                          font-weight: 700;
                          color: ${css.textPrimary};
                          background: ${css.gradient1};
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                      ">${locationName}</span>
                  </div>
                  <div style="
                      font-size: 12px;
                      color: ${css.textSecondary};
                      font-weight: 600;
                      background: ${css.bgGlass};
                      padding: 4px 8px;
                      border-radius: 8px;
                      border: 1px solid ${css.borderSecondary};
                  ">
                      ${new Date(weatherData.current.time).toLocaleTimeString('sk', {
                          hour: '2-digit', 
                          minute: '2-digit'
                      })}
                  </div>
              </div>
              
              <!-- MAIN WEATHER -->
              <div style="
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  margin-bottom: 20px;
                  padding: 16px;
                  background: ${css.bgGlass};
                  border-radius: 16px;
                  border: 1px solid ${css.borderPrimary};
                  position: relative;
                  backdrop-filter: blur(10px);
              ">
                  <div style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      height: 2px;
                      background: ${css.gradient1};
                  "></div>
                  
                  <div style="
                      font-size: 42px;
                      filter: drop-shadow(0 0 15px ${css.primaryColor});
                      animation: iconFloat 3s ease-in-out infinite;
                  ">${icon}</div>
                  
                  <div style="flex: 1;">
                      <div style="
                          font-size: 32px;
                          font-weight: 800;
                          line-height: 1;
                          background: ${css.gradient1};
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                          margin-bottom: 4px;
                      ">
                          ${weatherData.current.temp}<span style="font-size: 20px; opacity: 0.8;">°C</span>
                      </div>
                      <div style="
                          font-size: 13px;
                          color: ${css.textSecondary};
                          font-weight: 600;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                      ">Aktuálne počasie</div>
                  </div>
              </div>
              
              <!-- DETAILS -->
              <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      padding: 12px;
                      background: ${css.bgGlass};
                      border-radius: 12px;
                      border: 1px solid ${css.borderSecondary};
                      transition: all 0.3s ease;
                  ">
                      <div style="
                          font-size: 18px;
                          width: 24px;
                          text-align: center;
                          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.3));
                      ">💨</div>
                      <div style="
                          flex: 1;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                      ">
                          <span style="
                              font-size: 13px;
                              color: ${css.textSecondary};
                              font-weight: 600;
                          ">Vietor</span>
                          <span style="
                              font-size: 14px;
                              color: ${css.textPrimary};
                              font-weight: 700;
                              background: ${css.gradient1};
                              -webkit-background-clip: text;
                              -webkit-text-fill-color: transparent;
                              background-clip: text;
                          ">${weatherData.current.wind} m/s</span>
                      </div>
                  </div>
                  
                  <div style="
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      padding: 12px;
                      background: ${css.bgGlass};
                      border-radius: 12px;
                      border: 1px solid ${css.borderSecondary};
                      transition: all 0.3s ease;
                  ">
                      <div style="
                          font-size: 18px;
                          width: 24px;
                          text-align: center;
                          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.3));
                      ">🌡️</div>
                      <div style="
                          flex: 1;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                      ">
                          <span style="
                              font-size: 13px;
                              color: ${css.textSecondary};
                              font-weight: 600;
                          ">Pocit</span>
                          <span style="
                              font-size: 14px;
                              color: ${css.textPrimary};
                              font-weight: 700;
                              background: ${css.gradient1};
                              -webkit-background-clip: text;
                              -webkit-text-fill-color: transparent;
                              background-clip: text;
                          ">${weatherData.current.temp}°C</span>
                      </div>
                  </div>
              </div>
              
              <!-- ACCENT BAR -->
              <div style="
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: ${css.gradient1};
                  box-shadow: 0 0 12px ${css.primaryColor};
              "></div>
          </div>
      `;
      
      // 💫 INJECT CSS ANIMATIONS
      injectPopupAnimations(css);
      
      // ✅ VYTVOR POPUP
      const popup = new maptilersdk.Popup({ 
          offset: [0, -10],
          closeButton: true,
          closeOnClick: false,
          maxWidth: '300px',
          className: 'weather-popup-themed'
      }).setHTML(popupContent);
      
      // Pripoj popup k markeru a otvor ho
      marker.setPopup(popup);
      
      // Oneskor popup automaticky (po animácii)
      setTimeout(() => {
          marker.togglePopup();
      }, 2200);
  }

  // 🎨 FUNKCIA NA ZÍSKANIE CSS PREMENNÝCH
  function getCSSVariables() {
      const root = document.documentElement;
      const computedStyle = getComputedStyle(root);
      
      return {
          primaryColor: computedStyle.getPropertyValue('--primary-color').trim() || '#00ffff',
          secondaryColor: computedStyle.getPropertyValue('--secondary-color').trim() || '#00c8ff',
          bgPrimary: computedStyle.getPropertyValue('--bg-primary').trim() || 'rgba(26, 35, 50, 0.95)',
          bgGlass: computedStyle.getPropertyValue('--bg-glass').trim() || 'rgba(255, 255, 255, 0.1)',
          bgGlassHover: computedStyle.getPropertyValue('--bg-glass-hover').trim() || 'rgba(255, 255, 255, 0.2)',
          textPrimary: computedStyle.getPropertyValue('--text-primary').trim() || '#ffffff',
          textSecondary: computedStyle.getPropertyValue('--text-secondary').trim() || '#8892b0',
          borderPrimary: computedStyle.getPropertyValue('--border-primary').trim() || 'rgba(0, 255, 255, 0.3)',
          borderSecondary: computedStyle.getPropertyValue('--border-secondary').trim() || 'rgba(255, 255, 255, 0.2)',
          gradient1: computedStyle.getPropertyValue('--gradient-1').trim() || 'linear-gradient(135deg, #00ffff 0%, #00c8ff 50%, #00ff96 100%)'
      };
  }

  // 💫 INJECT CSS ANIMATIONS
  function injectPopupAnimations(css) {
      if (!document.getElementById('popup-animations')) {
          const style = document.createElement('style');
          style.id = 'popup-animations';
          style.textContent = `
              @keyframes iconFloat {
                  0%, 100% { transform: translateY(0) rotate(0deg); }
                  50% { transform: translateY(-4px) rotate(2deg); }
              }
              
              .weather-popup-themed .maplibregl-popup-content {
                  border-radius: 20px !important;
                  padding: 0 !important;
                  background: transparent !important;
                  box-shadow: none !important;
                  border: none !important;
                  animation: popupSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
              }
              
              .weather-popup-themed .maplibregl-popup-tip {
                  border-top-color: ${css.bgPrimary} !important;
                  border-width: 10px 8px 0 8px !important;
                  filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1)) !important;
              }
              
              .weather-popup-themed .maplibregl-popup-close-button {
                  font-size: 18px !important;
                  padding: 8px !important;
                  color: ${css.textSecondary} !important;
                  right: 12px !important;
                  top: 12px !important;
                  background: ${css.bgGlass} !important;
                  border-radius: 50% !important;
                  width: 32px !important;
                  height: 32px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  transition: all 0.3s ease !important;
                  border: 1px solid ${css.borderSecondary} !important;
                  backdrop-filter: blur(10px) !important;
                  z-index: 10 !important;
              }
              
              .weather-popup-themed .maplibregl-popup-close-button:hover {
                  background: ${css.bgGlassHover} !important;
                  border-color: ${css.borderPrimary} !important;
                  color: ${css.primaryColor} !important;
                  transform: scale(1.1) !important;
              }
              
              @keyframes popupSlideIn {
                  from {
                      opacity: 0;
                      transform: translateY(-20px) scale(0.9);
                  }
                  to {
                      opacity: 1;
                      transform: translateY(0) scale(1);
                  }
              }
          `;
          document.head.appendChild(style);
      }
  }

  // 🔄 FUNKCIA NA AKTUALIZÁCIU POPUP-U S NOVOU TÉMOU
  // 🚀 RÝCHLA VERZIA - nahraď updatePopupWithNewTheme() funkciu
  function updatePopupWithNewTheme() {
      if (!marker || !weatherData || !weatherData.current) return;
      
      const currentPopup = marker.getPopup();
      if (!currentPopup || !currentPopup.isOpen()) return;
      
      // ⚡ RÝCHLY UPDATE - len aktualizuj obsah
      // const icon = weatherIcons[parseInt(weatherData.current.code)] || "❓";
      const icon = getDayNightIcon(weatherData.current.code);
      const locationName = searchQuery.split(',')[0];
      const css = getCSSVariables();
      
      const popupContent = `
          <div style="
              padding: 20px;
              position: relative;
              min-width: 240px;
              background: ${css.bgPrimary};
              border-radius: 20px;
              color: ${css.textPrimary};
              font-family: 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
              backdrop-filter: blur(30px);
              border: 1px solid ${css.borderPrimary};
              overflow: hidden;
              transition: all 0.3s ease;
          ">
              <!-- HEADER -->
              <div style="
                  display: flex;
                  justify-content: space-between;
                  align-items: flex-start;
                  margin-bottom: 16px;
                  padding-right: 30px;
              ">
                  <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="
                          font-size: 16px;
                          filter: drop-shadow(0 0 8px ${css.primaryColor});
                          transition: all 0.3s ease;
                      ">📍</span>
                      <span style="
                          font-size: 16px;
                          font-weight: 700;
                          color: ${css.textPrimary};
                          background: ${css.gradient1};
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                          transition: all 0.3s ease;
                      ">${locationName}</span>
                  </div>
                  <div style="
                      font-size: 12px;
                      color: ${css.textSecondary};
                      font-weight: 600;
                      background: ${css.bgGlass};
                      padding: 4px 8px;
                      border-radius: 8px;
                      border: 1px solid ${css.borderSecondary};
                      transition: all 0.3s ease;
                  ">
                      ${new Date(weatherData.current.time).toLocaleTimeString('sk', {
                          hour: '2-digit', 
                          minute: '2-digit'
                      })}
                  </div>
              </div>
              
              <!-- MAIN WEATHER -->
              <div style="
                  display: flex;
                  align-items: center;
                  gap: 16px;
                  margin-bottom: 20px;
                  padding: 16px;
                  background: ${css.bgGlass};
                  border-radius: 16px;
                  border: 1px solid ${css.borderPrimary};
                  position: relative;
                  backdrop-filter: blur(10px);
                  transition: all 0.3s ease;
              ">
                  <div style="
                      position: absolute;
                      top: 0;
                      left: 0;
                      right: 0;
                      height: 2px;
                      background: ${css.gradient1};
                      transition: all 0.3s ease;
                  "></div>
                  
                  <div style="
                      font-size: 42px;
                      filter: drop-shadow(0 0 15px ${css.primaryColor});
                      animation: iconFloat 3s ease-in-out infinite;
                      transition: all 0.3s ease;
                  ">${icon}</div>
                  
                  <div style="flex: 1;">
                      <div style="
                          font-size: 32px;
                          font-weight: 800;
                          line-height: 1;
                          background: ${css.gradient1};
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                          margin-bottom: 4px;
                          transition: all 0.3s ease;
                      ">
                          ${weatherData.current.temp}<span style="font-size: 20px; opacity: 0.8;">°C</span>
                      </div>
                      <div style="
                          font-size: 13px;
                          color: ${css.textSecondary};
                          font-weight: 600;
                          text-transform: uppercase;
                          letter-spacing: 0.5px;
                          transition: all 0.3s ease;
                      ">Aktuálne počasie</div>
                  </div>
              </div>
              
              <!-- DETAILS -->
              <div style="display: flex; flex-direction: column; gap: 12px;">
                  <div style="
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      padding: 12px;
                      background: ${css.bgGlass};
                      border-radius: 12px;
                      border: 1px solid ${css.borderSecondary};
                      transition: all 0.3s ease;
                  ">
                      <div style="
                          font-size: 18px;
                          width: 24px;
                          text-align: center;
                          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.3));
                      ">💨</div>
                      <div style="
                          flex: 1;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                      ">
                          <span style="
                              font-size: 13px;
                              color: ${css.textSecondary};
                              font-weight: 600;
                              transition: all 0.3s ease;
                          ">Vietor</span>
                          <span style="
                              font-size: 14px;
                              color: ${css.textPrimary};
                              font-weight: 700;
                              background: ${css.gradient1};
                              -webkit-background-clip: text;
                              -webkit-text-fill-color: transparent;
                              background-clip: text;
                              transition: all 0.3s ease;
                          ">${weatherData.current.wind} m/s</span>
                      </div>
                  </div>
                  
                  <div style="
                      display: flex;
                      align-items: center;
                      gap: 12px;
                      padding: 12px;
                      background: ${css.bgGlass};
                      border-radius: 12px;
                      border: 1px solid ${css.borderSecondary};
                      transition: all 0.3s ease;
                  ">
                      <div style="
                          font-size: 18px;
                          width: 24px;
                          text-align: center;
                          filter: drop-shadow(0 0 6px rgba(255, 255, 255, 0.3));
                      ">🌡️</div>
                      <div style="
                          flex: 1;
                          display: flex;
                          justify-content: space-between;
                          align-items: center;
                      ">
                          <span style="
                              font-size: 13px;
                              color: ${css.textSecondary};
                              font-weight: 600;
                              transition: all 0.3s ease;
                          ">Pocit</span>
                          <span style="
                              font-size: 14px;
                              color: ${css.textPrimary};
                              font-weight: 700;
                              background: ${css.gradient1};
                              -webkit-background-clip: text;
                              -webkit-text-fill-color: transparent;
                              background-clip: text;
                              transition: all 0.3s ease;
                          ">${weatherData.current.temp}°C</span>
                      </div>
                  </div>
              </div>
              
              <!-- ACCENT BAR -->
              <div style="
                  position: absolute;
                  bottom: 0;
                  left: 0;
                  right: 0;
                  height: 4px;
                  background: ${css.gradient1};
                  box-shadow: 0 0 12px ${css.primaryColor};
                  transition: all 0.3s ease;
              "></div>
          </div>
      `;
      
      // ⚡ OKAMŽITÝ UPDATE obsahu
      currentPopup.setHTML(popupContent);
      
      // 🎨 UPDATE CSS štýlov
      updatePopupStyles(css);
  }

  // 🎨 RÝCHLY UPDATE CSS ŠTÝLOV
  function updatePopupStyles(css) {
      const existingStyle = document.getElementById('popup-animations');
      if (existingStyle) {
          existingStyle.textContent = `
              @keyframes iconFloat {
                  0%, 100% { transform: translateY(0) rotate(0deg); }
                  50% { transform: translateY(-4px) rotate(2deg); }
              }
              
              .weather-popup-themed .maplibregl-popup-content {
                  border-radius: 20px !important;
                  padding: 0 !important;
                  background: transparent !important;
                  box-shadow: none !important;
                  border: none !important;
                  animation: none !important;
              }
              
              .weather-popup-themed .maplibregl-popup-tip {
                  border-top-color: ${css.bgPrimary} !important;
                  border-width: 10px 8px 0 8px !important;
                  filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1)) !important;
                  transition: all 0.3s ease !important;
              }
              
              .weather-popup-themed .maplibregl-popup-close-button {
                  font-size: 18px !important;
                  padding: 8px !important;
                  color: ${css.textSecondary} !important;
                  right: 12px !important;
                  top: 12px !important;
                  background: ${css.bgGlass} !important;
                  border-radius: 50% !important;
                  width: 32px !important;
                  height: 32px !important;
                  display: flex !important;
                  align-items: center !important;
                  justify-content: center !important;
                  transition: all 0.3s ease !important;
                  border: 1px solid ${css.borderSecondary} !important;
                  backdrop-filter: blur(10px) !important;
                  z-index: 10 !important;
              }
              
              .weather-popup-themed .maplibregl-popup-close-button:hover {
                  background: ${css.bgGlassHover} !important;
                  border-color: ${css.borderPrimary} !important;
                  color: ${css.primaryColor} !important;
                  transform: scale(1.1) !important;
              }
          `;
      }
  }
  
  // Funkcia na clear marker:
  function clearMarker() {
      if (marker) {
          if (marker.getPopup()) {
              marker.getPopup().remove();
          }
          marker.remove();
          marker = null;
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

  /* Rozsirene DATA pocasia */
  let showDetailPanel = false;
  let tempChartCanvas, rainChartCanvas, windChartCanvas;
  let hourlyData = [];

  // Toggle detail panel
  function toggleDetailPanel() {
    showDetailPanel = !showDetailPanel;
    if (showDetailPanel && weatherData) {
      fetchExtendedWeather();
    }
  }

  // Close detail panel
  function closeDetailPanel() {
    showDetailPanel = false;
  }

  // ESC key to close panel
  function handleKeydown(event) {
    if (event.key === 'Escape' && showDetailPanel) {
      closeDetailPanel();
    }
  }

  // HOURLY FORECAST
  // 🌙 OPRAVENÁ FUNKCIA S NOČNÝMI IKONAMI
  function getWeatherIcon(weatherCode, hour) {
    // 🌙 URČENIE ČI JE NOC (20:00 - 06:00)
    const isNight = hour >= 20 || hour <= 6;
    
    // 🌞 DENNÉ IKONY
    const dayIcons = {
      0: "☀️",   // Clear sky
      1: "🌤️",   // Mainly clear
      2: "⛅",   // Partly cloudy
      3: "☁️",   // Overcast
      45: "🌫️",  // Fog
      48: "🌫️",  // Depositing rime fog
      51: "🌦️",  // Drizzle: Light
      53: "🌧️",  // Drizzle: Moderate
      55: "🌧️",  // Drizzle: Dense
      56: "🌧️",  // Freezing Drizzle: Light
      57: "🌧️",  // Freezing Drizzle: Dense
      61: "🌧️",  // Rain: Slight
      63: "🌧️",  // Rain: Moderate
      65: "🌧️",  // Rain: Heavy
      66: "🌧️",  // Freezing Rain: Light
      67: "🌧️",  // Freezing Rain: Heavy
      71: "🌨️",  // Snow fall: Slight
      73: "🌨️",  // Snow fall: Moderate
      75: "❄️",  // Snow fall: Heavy
      77: "❄️",  // Snow grains
      80: "🌦️",  // Rain showers: Slight
      81: "🌧️",  // Rain showers: Moderate
      82: "🌧️",  // Rain showers: Violent
      85: "🌨️",  // Snow showers: Slight
      86: "❄️",  // Snow showers: Heavy
      95: "⛈️",  // Thunderstorm: Slight or moderate
      96: "⛈️",  // Thunderstorm with slight hail
      99: "⛈️"   // Thunderstorm with heavy hail
    };
    
    // 🌙 NOČNÉ IKONY (iné pre jasné počasie)
    const nightIcons = {
      0: "🌙",   // Clear night sky
      1: "🌙",   // Mainly clear night
      2: "☁️",   // Partly cloudy night
      3: "☁️",   // Overcast (rovnaké ako cez deň)
      45: "🌫️",  // Fog (rovnaké)
      48: "🌫️",  // Depositing rime fog
      51: "🌧️",  // Drizzle (dážď je rovnaký)
      53: "🌧️",  
      55: "🌧️",  
      56: "🌧️",  
      57: "🌧️",  
      61: "🌧️",  
      63: "🌧️",  
      65: "🌧️",  
      66: "🌧️",  
      67: "🌧️",  
      71: "🌨️",  // Sneh (rovnaký)
      73: "🌨️",  
      75: "❄️",  
      77: "❄️",  
      80: "🌧️",  // Rain showers
      81: "🌧️",  
      82: "🌧️",  
      85: "🌨️",  
      86: "❄️",  
      95: "⛈️",  // Thunderstorm (rovnaký)
      96: "⛈️",  
      99: "⛈️"   
    };
    
    // 🎯 VRÁŤ SPRÁVNU IKONU PODĽA ČASU
    const icons = isNight ? nightIcons : dayIcons;
    return icons[weatherCode] || (isNight ? "🌙" : "❓");
  }

  // 🔄 UPRAVENÁ fetchExtendedWeather FUNKCIA
  async function fetchExtendedWeather() {
    if (!pointerLngLat) return;
    
    const lat = pointerLngLat.lat;
    const lon = pointerLngLat.lng;
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,wind_speed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto&forecast_days=7`;

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
        
        // 🌙 PRIDAJ HODINU DO getWeatherIcon()
        hourlyData = data.hourly.time.slice(startIndex, endIndex).map((time, i) => {
          const actualIndex = startIndex + i;
          const hour = new Date(time).getHours();
          
          return {
            time: hour + 'h',
            temp: Math.round(data.hourly.temperature_2m[actualIndex]),
            icon: getWeatherIcon(data.hourly.weathercode[actualIndex], hour), // ← PRIDAJ HODINU
            precipitation: data.hourly.precipitation[actualIndex] || 0,
            wind: data.hourly.wind_speed_10m[actualIndex] ? data.hourly.wind_speed_10m[actualIndex].toFixed(1) : '0.0'
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
  }
  // END HOURLY FORECAST

  // Add event listener for ESC key
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown);
  }

  // HOURLY SLIDER
  // Pridaj do existujúceho kódu - touch/swipe support pre slider
  let hourlySlider;

  // Touch events pre smooth scrolling
  if (typeof window !== 'undefined') {
    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse events
    function setupSliderEvents() {
      if (!hourlySlider) return;
      
      hourlySlider.addEventListener('mousedown', (e) => {
        isDown = true;
        hourlySlider.style.cursor = 'grabbing';
        startX = e.pageX - hourlySlider.offsetLeft;
        scrollLeft = hourlySlider.scrollLeft;
      });

      hourlySlider.addEventListener('mouseleave', () => {
        isDown = false;
        hourlySlider.style.cursor = 'grab';
      });

      hourlySlider.addEventListener('mouseup', () => {
        isDown = false;
        hourlySlider.style.cursor = 'grab';
      });

      hourlySlider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - hourlySlider.offsetLeft;
        const walk = (x - startX) * 2;
        hourlySlider.scrollLeft = scrollLeft - walk;
      });

      // Touch events pre mobil
      hourlySlider.addEventListener('touchstart', (e) => {
        startX = e.touches[0].pageX - hourlySlider.offsetLeft;
        scrollLeft = hourlySlider.scrollLeft;
      });

      hourlySlider.addEventListener('touchmove', (e) => {
        if (!startX) return;
        const x = e.touches[0].pageX - hourlySlider.offsetLeft;
        const walk = (x - startX) * 2;
        hourlySlider.scrollLeft = scrollLeft - walk;
      });
    }

    // Setup po načítaní
    setTimeout(setupSliderEvents, 100);
  }


  // Function to determine day/night
  function isDayTimeNow() {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 20;
  }

  // Get day/night icon
  function getDayNightIcon(weatherCode) {
    const code = parseInt(weatherCode);
    
    if (isDayTimeNow()) {
      // Day icons
      if (code === 0 || code === 1) return "☀️";
      if (code === 2) return "⛅";
      return weatherIcons[code] || "☀️";
    } else {
      // Night icons
      if (code === 0 || code === 1) return "🌙";
      if (code === 2) return "☁️";
      return weatherIcons[code] || "🌙";
    }
  }

</script>



<div bind:this={mapDiv} id="map"></div>


<!-- Nahraď existujúci search s týmto: -->
<div id="maptiler-search">
    <div>
        <input
            type="text"
            placeholder="Hľadaj miesto..."
            bind:value={searchQuery}
            on:input={handleSearchInput}
            on:keydown={(e) => {
                if (e.key === 'Enter' && suggestions[0]) selectLocation(suggestions[0]);
            }}
        />
    </div>
    
    {#if suggestions.length > 0}
        <ul class="autocomplete-list">
            {#each suggestions as suggestion}
                <li on:click={() => selectLocation(suggestion)}>
                    {suggestion.place_name}
                </li>
            {/each}
        </ul>
    {/if}
</div>

<!-- Open Meteo -->
{#if weatherData}
  <div class="weather-display">
    <!-- PÔVODNÝ OBSAH - nezmenený -->
    <div class="weather-header">
      <div class="weather-location">{searchQuery.split(',')[0]}</div>
      <div class="weather-header-right">
        <!-- NOVÉ: expand tlačidlo -->
        <button class="expand-btn" on:click={toggleDetailPanel} title="Zobraziť grafy">
          {#if showDetailPanel}
            ⚙️📡📈
          {:else}
            📈⚙️📡
          {/if}
        </button>
        <div class="weather-icon">{getDayNightIcon(weatherData.current.code)}</div>
      </div>
    </div>
    
    <!--
    <div class="weather-temp">{weatherData.current.temp}°C</div>
    <div class="weather-description">Aktuálne počasie</div>
    
    <div class="weather-details">
      <div class="weather-detail">
        <span class="weather-detail-icon">💨</span>
        <span>{weatherData.current.wind} m/s</span>
      </div>
      <div class="weather-detail">
        <span class="weather-detail-icon">🕐</span>
        <span>{new Date(weatherData.current.time).toLocaleTimeString('sk', {hour: '2-digit', minute: '2-digit'})}</span>
      </div>
    </div> -->
    
    <!-- PÔVODNÁ 5-dňová predpoveď - nezmenená -->
    {#if weatherData.daily}
      <div class="forecast-section">
        <div class="forecast-title">5-dňová predpoveď</div>
        {#each weatherData.daily.temperature_2m_max.slice(0, 5) as maxTemp, i}
          <div class="forecast-item">
            <span class="forecast-day">
              {i === 0 ? 'Dnes' : i === 1 ? 'Zajtra' : new Date(weatherData.daily.time[i]).toLocaleDateString('sk', {weekday: 'short'})}
            </span>
            <span>{weatherIcons[parseInt(weatherData.daily.weathercode[i])] || "❓"}</span>
            <div class="forecast-temps">
              <span class="forecast-temp-max">{Math.round(maxTemp)}°</span>
              <span class="forecast-temp-min">{Math.round(weatherData.daily.temperature_2m_min[i])}°</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- NOVÝ: Separátny detail panel (overlay) -->
  {#if showDetailPanel}
    <div class="weather-detail-overlay" on:click={closeDetailPanel}>
      <div class="weather-detail-panel" on:click|stopPropagation>
        <div class="detail-header">
          <h3>📊 Detailné grafy a štatistiky</h3>
          <button class="close-btn" on:click={closeDetailPanel}>✕</button>
        </div>
        
        <div class="detail-content">
          <!-- Additional Stats -->
          <div class="stats-section">
            <h4>📈 Štatistiky</h4>
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
            
          <!-- HOURLY FORECAST - Horizontal Slider -->
          <div class="hourly-section">
            <h4>🕐 Hodinová predpoveď (24h)</h4>
            <div class="hourly-slider-container">
              <div class="hourly-slider" bind:this={hourlySlider}>
                {#each hourlyData as hour}
                  <div class="hourly-card">
                    <div class="hour-time">{hour.time}</div>
                    <div class="hour-icon">{hour.icon}</div>
                    <div class="hour-temp">{hour.temp}°</div>
                    <div class="hour-wind">💨{hour.wind}</div>
                    <div class="hour-precip">💧{hour.precipitation || 0}mm</div>
                  </div>
                {/each}
              </div>
            </div>
          </div>
          
          

          <!-- WEATHER CHARTS -->
          <WeatherCharts {weatherData} />
        </div>
      </div>
    </div>
  {/if}
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
