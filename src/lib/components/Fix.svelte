<!-- src/lib/components/Fix.svelte -->
<script>
  import { onDestroy, onMount, tick } from 'svelte';
  import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
  import TimeSlider from '$lib/components/TimeSlider.svelte';
  import WeatherCharts from '$lib/components/WeatherCharts.svelte';
  import MarkerPopup from '$lib/components/MarkerPopup.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import MobileSidePanel from '$lib/components/MobileSidePanel.svelte';
  import { getWeatherIcon } from '$lib/utils/weatherIcons.js';
  import { i18n } from '$lib/i18n/index.js';
  import { currentLanguage } from '$lib/stores/language.js';
  import WeatherLegend from '$lib/components/WeatherLegend.svelte';
  import SavedPlaces from '$lib/components/SavedPlaces.svelte';
  import { savedPlaces } from '$lib/stores/savedPlaces.js';
  import { switchLanguage } from '$lib/stores/language.js';
  import { temperatureUnit, convertTemp, unitSymbol } from '$lib/stores/temperatureUnit.js';
  import {
    addInlineAdaptiveBannerListener,
    destroyInlineAdaptiveBanner,
    initializeInlineAdaptiveBanner,
    showInlineAdaptiveBanner,
    supportsInlineAdaptiveBanner,
    updateInlineAdaptiveBanner
  } from '$lib/plugins/inlineAdaptiveBanner.js';

  $: t = $i18n;
  $: lang = $currentLanguage;
  $: unit = $temperatureUnit;

  function getUVColor(uv) {
    if (uv <= 2) return '#4caf50';
    if (uv <= 5) return '#ffeb3b';
    if (uv <= 7) return '#ff9800';
    if (uv <= 10) return '#f44336';
    return '#9c27b0';
  }

  function getWindArrow(deg) {
    if (deg === undefined || deg === null) return '–';
    const dirs = ['↑','↗','→','↘','↓','↙','←','↖'];
    return dirs[Math.round(deg / 45) % 8];
  }

  function formatTime(isoStr) {
    if (!isoStr) return '';
    return isoStr.slice(11, 16);
  }

  function getTimeOfDay(timeStr) {
    // timeStr = "08:00"
    const h = parseInt(timeStr);
    if (h >= 5 && h < 10) return 'morning';   // 05–09 ráno
    if (h >= 10 && h < 18) return 'day';       // 10–17 deň
    if (h >= 18 && h < 20) return 'evening';   // 18–19 večer
    return 'night';                             // 20–04 noc
  }

  // Preregeneruj dayMarkers pri zmene jazyka
  $: if (lang && minTime && maxTime) {
    dayMarkers = generateDayMarkers(minTime, maxTime);
  }
  
  let showMobilePanel = false;
  let currentTheme = 'cyan'; 
  
  // Handlers
  function handleLayerChange(layerId) {
    changeWeatherLayer(layerId);
  }
  
  function handleThemeChange(themeId) {
    console.log('🎨 Main component theme change:', themeId); // DEBUG
    
    currentTheme = themeId;
    
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
  

  let showLangPicker = false;
  let showSavedPlaces = false;

  onMount(async () => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('weather-app-theme') || 'cyan';
      handleThemeChange(savedTheme);

      const isMobile = window.innerWidth <= 991;
      const hasLang = localStorage.getItem('preferred_language');
      if (isMobile && !hasLang) {
        showLangPicker = true;
      }
    }

    // Inicializácia natívneho AdMob bannera dole na mape
    try {
      await AdMob.initialize({ testingDevices: ['3f43eef5'] });
      await initializeInlineAdaptiveBanner({ testingDevices: ['3f43eef5'] });
      await AdMob.showBanner({
        adId: 'ca-app-pub-3940256099942544/6300978111',
        adSize: BannerAdSize.BANNER,
        position: BannerAdPosition.BOTTOM_CENTER,
        margin: 0,
        isTesting: true
      });
    } catch (e) {
      // Na webe sa AdMob nezobrazí - len na Android
    }
  });

  onMount(() => {
    if (!supportsInlineAdaptiveBanner()) {
      return;
    }

    addInlineAdaptiveBannerListener('bannerLoaded', (event) => {
      if (event.slotId) {
        setInlineBannerHeight(event.slotId, event.height || getInlineBannerHeight(event.slotId) || 50);
      }
    }).then((listener) => {
      inlineBannerLoadedListener = listener;
    });

    addInlineAdaptiveBannerListener('bannerFailed', (event) => {
      if (event.slotId) {
        console.warn('Inline adaptive banner failed', event.message);
      }
    }).then((listener) => {
      inlineBannerFailedListener = listener;
    });
  });

  onDestroy(() => {
    stopInlineBanner();
    inlineBannerLoadedListener?.remove?.();
    inlineBannerFailedListener?.remove?.();
  });

  function pickLanguage(lang) {
    switchLanguage(lang);
    showLangPicker = false;
  }

  let mapDiv;
  /** @type {any} */
  let map;
  /** @type {any} */
  let maptilersdk;
  let maptilerweather;
  let markerPopup;

  let pointerLngLat = null;
  let activeLayer = 'wind';
  /** @type {any} */
  let activeColorRamp = null;
  let isPlaying = false;
  let currentTime = null;

  let minTime = 0;
  let maxTime = 0;
  let currentTimeForSlider = 0;
  let isDragging = false;
  let dayMarkers = [];
  let timeText = '';
  let playLabel = '▶️';
  let currentLat = null;
  let currentLng = null;

  /** @type {Record<string, any>} */
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

  let searchQuery = '';
  let suggestions = [];
  let marker = null;
  let selectedPlace = null;

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

  currentLat = lat;
  currentLng = lng;

  const locationName = feature.place_name || feature.display_name || 'Vybraná lokácia';
  

  await handleLocationClick(lng, lat, locationName);
  
  searchQuery = locationName;
}
  

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
            pressure: data.current.pressure_msl,
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

  function generateDayMarkers(start, end) {
    const markers = [];
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);
    while (+current <= end) {
      markers.push({
        time: +current,
        label: current.toLocaleDateString(lang, { weekday: 'short' })
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
        timeText = d.toLocaleString(lang, {
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

  let showDetailPanel = false;
  let hourlyData = [];
  $: hMinTemp = hourlyData.length ? Math.min(...hourlyData.map(h => h.temp)) : 0;
  $: hMaxTemp = hourlyData.length ? Math.max(...hourlyData.map(h => h.temp)) : 10;
  $: hRange = (hMaxTemp - hMinTemp) || 1;
  let detailPanelEl;
  let inlineBannerFrame = null;
  let inlineBannerScrollHandler;
  let inlineBannerResizeHandler;
  let inlineBannerLoadedListener;
  let inlineBannerFailedListener;
  let inlineBannerResizeObserver;
  let inlineStatsBannerEl;
  let inlineHourlyBannerEl;
  let inlineWeeklyBannerEl;
  const inlineBannerConfigs = [
    {
      slotId: 'detail-inline-stats',
      adUnitId: 'ca-app-pub-3940256099942544/9214589741',
      label: 'Banner 1 - statistiky'
    },
    {
      slotId: 'detail-inline-hourly',
      adUnitId: 'ca-app-pub-3940256099942544/9214589741',
      label: 'Banner 2 - hodinova predpoved'
    },
    {
      slotId: 'detail-inline-weekly',
      adUnitId: 'ca-app-pub-3940256099942544/9214589741',
      label: 'Banner 3 - 7-denna predpoved'
    }
  ];
  let inlineBannerHeights = {};
  let inlineBannerMounted = {};

  function getInlineBannerElement(slotId) {
    if (slotId === 'detail-inline-stats') return inlineStatsBannerEl;
    if (slotId === 'detail-inline-hourly') return inlineHourlyBannerEl;
    if (slotId === 'detail-inline-weekly') return inlineWeeklyBannerEl;
    return null;
  }

  function setInlineBannerHeight(slotId, height) {
    inlineBannerHeights = { ...inlineBannerHeights, [slotId]: height };
  }

  function setInlineBannerMounted(slotId, mounted) {
    inlineBannerMounted = { ...inlineBannerMounted, [slotId]: mounted };
  }

  function getInlineBannerHeight(slotId) {
    return inlineBannerHeights[slotId] || 60;
  }

  function scheduleInlineBannerSync(forceReload = false) {
    if (!supportsInlineAdaptiveBanner() || !showDetailPanel || !detailPanelEl) {
      return;
    }

    if (inlineBannerFrame !== null) {
      cancelAnimationFrame(inlineBannerFrame);
    }

    inlineBannerFrame = requestAnimationFrame(async () => {
      inlineBannerFrame = null;

      for (const config of inlineBannerConfigs) {
        const element = getInlineBannerElement(config.slotId);
        if (!element) {
          continue;
        }

        const rect = element.getBoundingClientRect();
        const width = Math.round(rect.width);
        if (width < 200) {
          continue;
        }

        const payload = {
          slotId: config.slotId,
          adUnitId: config.adUnitId,
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width,
          maxHeight: Math.round(Math.min(window.innerHeight * 0.4, 320))
        };

        try {
          if (!inlineBannerMounted[config.slotId] || forceReload) {
            await showInlineAdaptiveBanner(payload);
            setInlineBannerMounted(config.slotId, true);
          } else {
            await updateInlineAdaptiveBanner(payload);
          }
        } catch (e) {
          console.warn(`Inline banner sync failed for ${config.slotId}`, e);
        }
      }
    });
  }

  async function startInlineBanner() {
    if (!supportsInlineAdaptiveBanner() || !showDetailPanel) {
      return;
    }

    await tick();

    if (!detailPanelEl) {
      return;
    }

    inlineBannerScrollHandler = () => scheduleInlineBannerSync();
    inlineBannerResizeHandler = () => scheduleInlineBannerSync();

    detailPanelEl.addEventListener('scroll', inlineBannerScrollHandler, { passive: true });
    window.addEventListener('resize', inlineBannerResizeHandler);
    window.addEventListener('orientationchange', inlineBannerResizeHandler);

    if (typeof ResizeObserver !== 'undefined') {
      inlineBannerResizeObserver = new ResizeObserver(() => scheduleInlineBannerSync(true));
      inlineBannerResizeObserver.observe(detailPanelEl);
      for (const config of inlineBannerConfigs) {
        const element = getInlineBannerElement(config.slotId);
        if (element) {
          inlineBannerResizeObserver.observe(element);
        }
      }
    }

    scheduleInlineBannerSync(true);
  }

  async function stopInlineBanner() {
    if (inlineBannerFrame !== null) {
      cancelAnimationFrame(inlineBannerFrame);
      inlineBannerFrame = null;
    }

    if (detailPanelEl && inlineBannerScrollHandler) {
      detailPanelEl.removeEventListener('scroll', inlineBannerScrollHandler);
    }

    if (inlineBannerResizeHandler) {
      window.removeEventListener('resize', inlineBannerResizeHandler);
      window.removeEventListener('orientationchange', inlineBannerResizeHandler);
    }

    inlineBannerResizeObserver?.disconnect();
    inlineBannerResizeObserver = null;
    inlineBannerScrollHandler = null;
    inlineBannerResizeHandler = null;

    for (const config of inlineBannerConfigs) {
      if (inlineBannerMounted[config.slotId]) {
        await destroyInlineAdaptiveBanner(config.slotId);
      }
      setInlineBannerMounted(config.slotId, false);
      setInlineBannerHeight(config.slotId, 0);
    }
  }

  // function toggleDetailPanel() {
  //   showDetailPanel = !showDetailPanel;
  //   if (showDetailPanel && weatherData) {
  //     fetchExtendedWeather();
  //   }
  // }
  async function toggleDetailPanel() {
    showDetailPanel = !showDetailPanel;

    if (showDetailPanel) {
      try {
        await AdMob.hideBanner();
        await AdMob.prepareInterstitial({ adId: 'ca-app-pub-3940256099942544/1033173712', isTesting: true });
        await AdMob.showInterstitial();
      } catch (e) {}

      await startInlineBanner();
    } else {
      await stopInlineBanner();
      try {
        await AdMob.resumeBanner();
      } catch (e) {}
    }
  }

  async function closeDetailPanel() {
    showDetailPanel = false;
    await stopInlineBanner();
    try {
      await AdMob.resumeBanner();
    } catch (e) {}
  }

  function handleKeydown(event) {
    if (event.key === 'Escape' && showDetailPanel) {
      closeDetailPanel();
    }
  }

  onMount(async () => {
    await loadCSS('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.css');
    await loadScript('https://cdn.maptiler.com/maptiler-sdk-js/v3.2.0/maptiler-sdk.umd.min.js');
    await loadScript('https://cdn.maptiler.com/maptiler-weather/v3.0.1/maptiler-weather.umd.min.js');

    maptilersdk = window.maptilersdk;
    maptilerweather = window.maptilerweather;

    maptilersdk.config.apiKey = import.meta.env.VITE_MAPTILER_KEY;

    // Set color ramps after SDK is loaded
    weatherLayers.precipitation.colorRamp = maptilerweather.ColorRamp.builtin.PRECIPITATION;
    weatherLayers.pressure.colorRamp = maptilerweather.ColorRamp.builtin.PRESSURE_3;
    weatherLayers.radar.colorRamp = maptilerweather.ColorRamp.builtin.RADAR;
    weatherLayers.temperature.colorRamp = maptilerweather.ColorRamp.builtin.TEMPERATURE_3;
    weatherLayers.wind.colorRamp = maptilerweather.ColorRamp.builtin.WIND_ROCKET;
    // Trigger reactivity pre legendu
    activeColorRamp = weatherLayers[activeLayer]?.colorRamp;

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
      map.setPaintProperty("Water", 'fill-color', "rgba(0, 0, 0, 0.4)");
      initWeatherMap("wind");

      // Načítaj predvolené miesto pri štarte
      const defaultPlace = savedPlaces.getDefault();
      if (defaultPlace) {
        setTimeout(() => {
          handleLocationClick(defaultPlace.lng, defaultPlace.lat, defaultPlace.name);
        }, 800);
      }
      map.on('mousemove', (e) => updatePointerValue(e.lngLat));

        map.on('click', async (e) => {
            const { lng, lat } = e.lngLat;

            try {
                const response = await fetch(
                    `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${import.meta.env.VITE_MAPTILER_KEY}&limit=1&language=sk`
                );
                const data = await response.json();

                let locationName = 'Neznáme miesto';
                if (data.features && data.features.length > 0) {
                    locationName = data.features[0].place_name;
                }
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
      

      window.addEventListener('themeChanged', (e) => {
          console.log('Theme changed to:', e.detail.theme);
          
          // Aktualizuj popup cez komponentu
          if (markerPopup) {
              markerPopup.updateTheme();
          }
      });
    }
  });

async function handleLocationClick(lng, lat, locationName) {
  currentLat = lat;
  currentLng = lng;
  const isMobile = window.innerWidth <= 991;
  
  // Fly to location (rovnaké ako pred tým)
  const flyToOptions = {
    center: [lng, lat],
    duration: 2000,
    essential: true
  };
  
  if (isMobile) {
    flyToOptions.zoom = 11;
    flyToOptions.center = [lng, lat + 0.07];
    flyToOptions.padding = { top: 60, bottom: 160, left: 20, right: 20 };
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
  selectedPlace = { name: locationName.split(',')[0], lat, lng };

  pointerLngLat = { lat, lng };

  try {
    await fetchWeather(lat, lng);
    await fetchExtendedWeatherFixed(lat, lng);
    await tick(); // počkaj kým Svelte aktualizuje props v MarkerPopup

    if (markerPopup) {
      markerPopup.removeMiniBar();
      markerPopup.createPopup();
    }
  } catch (error) {
    console.error('Weather fetch error:', error);
    await tick();
    if (markerPopup) {
      markerPopup.removeMiniBar();
      markerPopup.createPopup();
    }
  }
}

async function fetchExtendedWeatherFixed(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,snowfall,wind_speed_10m,wind_direction_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset,wind_direction_10m_dominant&timezone=auto&forecast_days=7`;

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
          tempC: data.hourly.temperature_2m[actualIndex],
          temp: Math.round(data.hourly.temperature_2m[actualIndex]),
          code: data.hourly.weathercode[actualIndex],
          originalTime: time,
          icon: getWeatherIcon(data.hourly.weathercode[actualIndex], time),
          precipitation: data.hourly.precipitation[actualIndex] || 0,
          snowfall: data.hourly.snowfall?.[actualIndex] || 0,
          wind: data.hourly.wind_speed_10m[actualIndex] ?
                data.hourly.wind_speed_10m[actualIndex].toFixed(1) : '0.0',
          windDir: data.hourly.wind_direction_10m?.[actualIndex] ?? null
        };
      });

      if (weatherData) {
        weatherData = {
          ...weatherData,
          extended: {
            hourly: data.hourly,
            daily: data.daily
          }
        };
      }
    }
  } catch (error) {
    console.error('Extended weather fetch error:', error);
  }
}

  function createWeatherLayer(type) {
    
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

  function changeWeatherLayer(type) {
    // Skip only if already active AND actually added to map
    if (type === activeLayer && map.getLayer(activeLayer)) return;

    // Hide previous layer
    if (activeLayer && activeLayer !== type && map.getLayer(activeLayer)) {
      const activeWeatherLayer = weatherLayers[activeLayer]?.layer;
      if (activeWeatherLayer) {
        currentTime = activeWeatherLayer.getAnimationTime();
        map.setLayoutProperty(activeLayer, 'visibility', 'none');
      }
    }

    activeLayer = type;
    activeColorRamp = weatherLayers[activeLayer]?.colorRamp;
    const weatherLayer = weatherLayers[activeLayer].layer || createWeatherLayer(activeLayer);

    if (map.getLayer(activeLayer)) {
      map.setLayoutProperty(activeLayer, 'visibility', 'visible');
    } else {
      map.addLayer(weatherLayer, 'Water');
    }

    return weatherLayer;
  }

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

  function initWeatherMap(type) {
    console.log('🌦️ Initializing weather map with:', type);
    changeWeatherLayer(type);
  }

  // Otvor Developer Console a testuj:
  console.log(getWeatherIcon(0, "2024-01-01T14:00")); // Mala by byť ☀️
  console.log(getWeatherIcon(0, "2024-01-01T22:00")); // Mala by byť 🌙
  console.log(getWeatherIcon(61)); // Bez času - môže byť mesiacik
</script>

<div bind:this={mapDiv} id="map"></div>

<!-- 🌐 LANGUAGE PICKER - prvá návšteva mobile -->
{#if showLangPicker}
  <div class="lang-picker-overlay">
    <div class="lang-picker-sheet">
      <div class="lang-picker-title">🌍 Vyber jazyk / Choose language / Sprache wählen</div>
      <div class="lang-picker-btns">
        <button class="lang-pick-btn" on:click={() => pickLanguage('sk')}>
          <span class="lang-flag">🇸🇰</span>
          <span>Slovenčina</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('en')}>
          <span class="lang-flag">🇬🇧</span>
          <span>English</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('de')}>
          <span class="lang-flag">🇩🇪</span>
          <span>Deutsch</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- 🔍 SEARCH S BIND:VALUE -->
<SearchBar 
  bind:value={searchQuery}
  on:locationSelected={selectLocation}
  apiKey={import.meta.env.VITE_MAPTILER_KEY}
  placeholder={t('search_placeholder')}
/>

<MarkerPopup
    bind:this={markerPopup}
    {marker}
    {weatherData}
    locationName={searchQuery.split(',')[0]}
    {maptilersdk}
    onToggleDetailPanel={toggleDetailPanel}
    onSavePlace={() => {
      if (currentLat !== null && currentLng !== null) {
        savedPlaces.add({
          id: `${currentLat.toFixed(4)}_${currentLng.toFixed(4)}`,
          name: selectedPlace?.name || searchQuery.split(',')[0] || 'Miesto',
          lat: currentLat,
          lng: currentLng,
          isDefault: false
        });
      }
    }}
/>

{#if weatherData}
  <div class="weather-display">
    <div class="weather-header">
      <div class="weather-location">{searchQuery.split(',')[0]}</div>
      <div class="weather-header-right">
        <button class="expand-btn" on:click={toggleDetailPanel} title={t('show_detail')}>
          👆
        </button>
         <div class="weather-icon">
            {getWeatherIcon(weatherData.current.code, weatherData.current.time)}
        </div>
      </div>
    </div>
    
    {#if weatherData.daily}
      <div class="forecast-section">
        <div class="forecast-title">{t('forecast_5day')}</div>
        {#each weatherData.daily.temperature_2m_max.slice(0, 5) as maxTemp, i}
          <div class="forecast-item">
            <span class="forecast-day">
              {i === 0 ? t('today') : i === 1 ? t('tomorrow') : new Date(weatherData.daily.time[i]).toLocaleDateString(lang, {weekday: 'short'})}
            </span>
            <!-- <span>{weatherIcons[parseInt(weatherData.daily.weathercode[i])] || "❓"}</span> -->
            <span>{getWeatherIcon(weatherData.daily.weathercode[i], weatherData.daily.time[i] + 'T12:00')}</span>
            <div class="forecast-temps">
              <span class="forecast-temp-max">{convertTemp(maxTemp, unit)}{unitSymbol(unit)}</span>
              <span class="forecast-temp-min">{convertTemp(weatherData.daily.temperature_2m_min[i], unit)}{unitSymbol(unit)}</span>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <!-- 📊 DETAIL PANEL -->
  {#if showDetailPanel}
    <div class="weather-detail-overlay" on:click={closeDetailPanel} on:keydown={(e) => e.key === 'Escape' && closeDetailPanel()} role="presentation">
      <div class="weather-detail-panel" bind:this={detailPanelEl} on:click|stopPropagation on:keydown|stopPropagation role="dialog" aria-modal="true">
        <div class="detail-header">
          <h3>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            {searchQuery.split(',')[0]}
          </h3>
          <button class="close-btn" on:click={closeDetailPanel}>✕</button>
        </div>
        
        <div class="detail-content">
          <!-- Additional Stats -->
          <div class="chart-container" id="section-statistics">
            <div class="chart-header">
              <!-- <div class="hourly-section"> -->
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
                {t('statistics')}
              </h3>
            </div>
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">{t('max_temp_7d')}</span>
                <span class="stat-value">{weatherData.extended ? convertTemp(Math.max(...weatherData.extended.daily.temperature_2m_max.slice(0, 7)), unit) : '--'}{unitSymbol(unit)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{t('min_temp_7d')}</span>
                <span class="stat-value">{weatherData.extended ? convertTemp(Math.min(...weatherData.extended.daily.temperature_2m_min.slice(0, 7)), unit) : '--'}{unitSymbol(unit)}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{t('total_precip')}</span>
                <span class="stat-value">{weatherData.extended ? weatherData.extended.daily.precipitation_sum.slice(0, 7).reduce((a,b) => a+b, 0).toFixed(1) : '--'}mm</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">{t('max_wind')}</span>
                <span class="stat-value">{weatherData.extended ? Math.max(...weatherData.extended.daily.wind_speed_10m_max.slice(0, 7)).toFixed(1) : '--'}m/s</span>
              </div>
            </div>
          </div>

          <div
            class="inline-ad-slot"
            class:is-native={supportsInlineAdaptiveBanner()}
            bind:this={inlineStatsBannerEl}
            style:min-height={`${getInlineBannerHeight('detail-inline-stats')}px`}
            aria-label="Advertisement"
          >
            {#if !supportsInlineAdaptiveBanner()}
              <span class="test-ad-label">Ad</span>
              <span class="test-ad-text">Inline adaptive banner sa zobrazí len v Android appke.</span>
            {/if}
          </div>

          <!-- HOURLY FORECAST BAR CHART -->
          <div class="chart-container" id="section-hourly">
            <div class="chart-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {t('hourly_forecast')}
              </h3>
            </div>
            <div class="hourly-chart-wrapper">
              {#each hourlyData as hour}
                {@const barPct = ((hour.temp - hMinTemp) / hRange) * 55 + 15}
                <div class="hourly-col">
                  <div class="hourly-col-inner" style="height: 160px; position: relative;">
                    <div class="h-icon" style="position:absolute; bottom:{Math.min(barPct+18, 90)}%; left:50%; transform:translateX(-50%);">
                      {getWeatherIcon(hour.code, hour.originalTime)}
                    </div>
                    <div class="h-temp" style="position:absolute; bottom:{Math.min(barPct+7, 82)}%; left:50%; transform:translateX(-50%);">
                      {convertTemp(hour.temp, unit)}{unitSymbol(unit)}
                    </div>
                    <div class="h-bar" style="position:absolute; bottom:0; height:{barPct}%; left:50%; transform:translateX(-50%); width:10px;"></div>
                  </div>
                  <div class="h-time h-time--{getTimeOfDay(hour.time)}">{hour.time}</div>
                  <div class="h-precip">
                    {#if hour.snowfall > 0}
                      ❄️{hour.snowfall.toFixed(1)}<span class="h-unit">cm</span>
                    {:else if hour.precipitation > 0}
                      💧{hour.precipitation}<span class="h-unit">mm</span>
                    {:else}
                      <span style="opacity:0.3">—</span><span class="h-unit">mm</span>
                    {/if}
                  </div>
                  <div class="h-wind"><span class="h-wind-arrow">{hour.windDir !== null ? getWindArrow(hour.windDir) : '·'}</span>{hour.wind}<span class="h-unit">m/s</span></div>
                </div>
              {/each}
            </div>
          </div> 

          <div
            class="inline-ad-slot"
            class:is-native={supportsInlineAdaptiveBanner()}
            bind:this={inlineHourlyBannerEl}
            style:min-height={`${getInlineBannerHeight('detail-inline-hourly')}px`}
            aria-label="Advertisement"
          >
            {#if !supportsInlineAdaptiveBanner()}
              <span class="test-ad-label">Ad</span>
              <span class="test-ad-text">Banner 2 - hodinova predpoved</span>
            {/if}
          </div>

          {#if weatherData.daily}
            {@const f5AllMax = weatherData.daily.temperature_2m_max.slice(0, 5)}
            {@const f5AllMin = weatherData.daily.temperature_2m_min.slice(0, 5)}
            {@const f5ActualMin = Math.min(...f5AllMin)}
            {@const f5ActualMax = Math.max(...f5AllMax)}
            {@const f5Pad = (f5ActualMax - f5ActualMin) * 0.1}
            {@const f5ScaleMin = f5ActualMin - f5Pad}
            {@const f5ScaleMax = f5ActualMax + f5Pad}
            {@const f5Range = (f5ScaleMax - f5ScaleMin) || 1}
            <div class="chart-container" id="section-forecast-5day">
              <div class="chart-header">
                <h3>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {t('forecast_5day')}
                </h3>
                <div class="unit-label">{unitSymbol(unit)}</div>
              </div>
              <div class="temp-chart-wrapper f5-wrapper">
                <div class="temp-chart">
                  {#each f5AllMax as maxTemp, i}
                    {@const minTemp = f5AllMin[i]}
                    {@const code = weatherData.daily.weathercode[i]}
                    {@const dateStr = weatherData.daily.time[i]}
                    {@const dayIcon = getWeatherIcon(code, dateStr + 'T12:00')}
                    {@const nightIcon = getWeatherIcon(code, dateStr + 'T22:00')}
                    {@const precip = weatherData.extended?.daily?.precipitation_sum?.[i] || 0}
                    {@const uv = weatherData.extended?.daily?.uv_index_max?.[i]}
                    {@const windDir = weatherData.extended?.daily?.wind_direction_10m_dominant?.[i]}
                    {@const windSpd = weatherData.extended?.daily?.wind_speed_10m_max?.[i]}
                    {@const sunrise = weatherData.extended?.daily?.sunrise?.[i]}
                    {@const sunset = weatherData.extended?.daily?.sunset?.[i]}
                    {@const maxPos = Math.max(20, Math.min(80, ((maxTemp - f5ScaleMin) / f5Range) * 60 + 20))}
                    {@const minPos = Math.max(20, Math.min(80, ((minTemp - f5ScaleMin) / f5Range) * 60 + 20))}
                    {@const barHeight = Math.abs(maxPos - minPos)}
                    {@const barBottom = Math.min(maxPos, minPos)}
                    <div class="temp-day-column">
                      <div class="day-label">
                        {i === 0 ? t('today').toUpperCase() : i === 1 ? t('tomorrow').toUpperCase() : new Date(dateStr).toLocaleDateString(lang, {weekday: 'short'}).toUpperCase()}
                      </div>
                      <!-- Väčšia animovaná denná ikonka -->
                      <div class="f5-icon-day-wrap" style="position:absolute; bottom:{Math.min(maxPos+22,94)}%; left:50%; transform:translateX(-50%);">
                        {dayIcon}
                      </div>
                      <div class="temp-max" style="position:absolute; bottom:{Math.min(maxPos+10,86)}%; left:50%; transform:translateX(-50%);">
                        {convertTemp(maxTemp, unit)}{unitSymbol(unit)}
                      </div>
                      <div class="temp-bar" style="position:absolute; bottom:{barBottom}%; height:{barHeight}%; width:20px; left:50%; transform:translateX(-50%);"></div>
                      <div class="temp-min" style="position:absolute; bottom:{Math.max(minPos-8,12)}%; left:50%; transform:translateX(-50%);">
                        {convertTemp(minTemp, unit)}{unitSymbol(unit)}
                      </div>
                      <!-- Menšia nočná ikonka -->
                      <div class="f5-icon-night-wrap" style="position:absolute; bottom:{Math.max(minPos-20,4)}%; left:50%; transform:translateX(-50%);">
                        {nightIcon}
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- Extra info riadok pod grafom -->
                <div class="f5-extras">
                  {#each f5AllMax as _, i}
                    {@const precip = weatherData.extended?.daily?.precipitation_sum?.[i] || 0}
                    {@const snow = weatherData.extended?.daily?.snowfall_sum?.[i] || 0}
                    {@const precipProb = weatherData.extended?.daily?.precipitation_probability_max?.[i]}
                    {@const uv = weatherData.extended?.daily?.uv_index_max?.[i]}
                    {@const windDir = weatherData.extended?.daily?.wind_direction_10m_dominant?.[i]}
                    {@const windSpd = weatherData.extended?.daily?.wind_speed_10m_max?.[i]}
                    {@const sunrise = weatherData.extended?.daily?.sunrise?.[i]}
                    {@const sunset = weatherData.extended?.daily?.sunset?.[i]}
                    <div class="f5-extra-col">
                      <!-- Pravdepodobnosť zrážok -->
                      {#if precipProb !== undefined}
                        <div class="f5-extra-row">
                          <span class="f5-precip-prob" style="opacity: {precipProb > 0 ? 1 : 0.35}">{precipProb}%</span>
                        </div>
                      {/if}
                      <!-- Sneh alebo dážď -->
                      <div class="f5-extra-row">
                        {#if snow > 0}
                          <span class="f5-extra-icon">❄️</span>
                          <span>{snow.toFixed(1)}cm</span>
                        {:else}
                          <span class="f5-extra-icon">💧</span>
                          <span>{precip > 0 ? precip.toFixed(1)+'mm' : '—'}</span>
                        {/if}
                      </div>
                      <!-- UV index -->
                      {#if uv !== undefined}
                        <div class="f5-extra-row">
                          <span class="f5-uv-badge" style="background:{getUVColor(uv)}">UV {Math.round(uv)}</span>
                        </div>
                      {/if}
                      <!-- Vietor + smer -->
                      {#if windSpd !== undefined}
                        <div class="f5-extra-row">
                          <span class="f5-wind-arrow">{getWindArrow(windDir)}</span>
                          <span>{windSpd.toFixed(0)}m/s</span>
                        </div>
                      {/if}
                      <!-- Východ / západ slnka -->
                      {#if sunrise}
                        <div class="f5-extra-row f5-sun-row">
                          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                            <line x1="10" y1="1" x2="10" y2="3.5" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                            <line x1="15.9" y1="2.8" x2="14.2" y2="4.5" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                            <line x1="4.1" y1="2.8" x2="5.8" y2="4.5" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                            <path d="M3.5 11.5 A6.5 6.5 0 0 1 16.5 11.5" fill="#f59e0b"/>
                            <line x1="1" y1="11.5" x2="19" y2="11.5" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
                            <polyline points="7,17 10,13.5 13,17" fill="none" stroke="#f59e0b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          {formatTime(sunrise)}
                        </div>
                        <div class="f5-extra-row f5-sun-row">
                          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                            <line x1="10" y1="1" x2="10" y2="3.5" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
                            <line x1="15.9" y1="2.8" x2="14.2" y2="4.5" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
                            <line x1="4.1" y1="2.8" x2="5.8" y2="4.5" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
                            <path d="M3.5 11.5 A6.5 6.5 0 0 1 16.5 11.5" fill="#fb923c"/>
                            <line x1="1" y1="11.5" x2="19" y2="11.5" stroke="#fb923c" stroke-width="2" stroke-linecap="round"/>
                            <polyline points="7,13.5 10,17 13,13.5" fill="none" stroke="#fb923c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                          {formatTime(sunset)}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}
          
          <div
            class="inline-ad-slot"
            class:is-native={supportsInlineAdaptiveBanner()}
            bind:this={inlineWeeklyBannerEl}
            style:min-height={`${getInlineBannerHeight('detail-inline-weekly')}px`}
            aria-label="Advertisement"
          >
            {#if !supportsInlineAdaptiveBanner()}
              <span class="test-ad-label">Ad</span>
              <span class="test-ad-text">Banner 3 - 7-denna predpoved</span>
            {/if}
          </div>

          <!-- WEATHER CHARTS -->
          <WeatherCharts {weatherData} />
        </div>
      </div>
    </div>
  {/if}
{/if}

<!-- 🎛️ LAYER BUTTONS -->
<div id="buttons">
  <button class:active={activeLayer === 'precipitation'} on:click={() => changeWeatherLayer('precipitation')}>{t('precipitation')}</button>
  <button class:active={activeLayer === 'pressure'} on:click={() => changeWeatherLayer('pressure')}>{t('pressure')}</button>
  <button class:active={activeLayer === 'radar'} on:click={() => changeWeatherLayer('radar')}>{t('radar')}</button>
  <button class:active={activeLayer === 'temperature'} on:click={() => changeWeatherLayer('temperature')}>{t('temperature')}</button>
  <button class:active={activeLayer === 'wind'} on:click={() => changeWeatherLayer('wind')}>{t('wind')}</button>
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
    {lang}
  />
</div>

<!-- 📊 POINTER DATA -->
<div id="pointer-data"></div>

<WeatherLegend {activeLayer} colorRamp={activeColorRamp} />

<!-- ⭐ SAVED PLACES BUTTON -->
<button class="sp-trigger-btn" on:click={() => { showSavedPlaces = true; if (marker) marker.getPopup()?.remove(); }} title="Uložené miesta">
  ⭐
  {#if $savedPlaces.length > 0}
    <span class="sp-trigger-count">{$savedPlaces.length}</span>
  {/if}
</button>

<!-- ⭐ SAVED PLACES DRAWER -->
<SavedPlaces
  bind:isOpen={showSavedPlaces}
  currentPlace={weatherData ? selectedPlace : null}
  on:select={(e) => handleLocationClick(e.detail.lng ?? e.detail.lon, e.detail.lat, e.detail.name)}
/>

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
    color: #7dd3fc;
    font-weight: 600;
    text-shadow: 0 0 4px rgba(255,255,255,0.5), 0 1px 3px rgba(0,0,0,0.6);
  }

  /* ===== 5-DAY FORECAST EXTRAS ===== */
  .f5-wrapper {
    overflow-x: auto !important;
    overflow-y: visible !important;
  }

  @keyframes f5-float {
    0%, 100% { transform: translateX(-50%) translateY(0px); }
    50%       { transform: translateX(-50%) translateY(-4px); }
  }

  .f5-icon-day-wrap {
    font-size: 1.875rem; /* 30px */
    animation: f5-float 3s ease-in-out infinite;
    filter: drop-shadow(0 0.25rem 0.5rem rgba(0,0,0,0.3));
    line-height: 1;
  }

  .f5-icon-night-wrap {
    font-size: 26px;
    opacity: 0.75;
    animation: f5-float 4s ease-in-out infinite 1s;
    filter: drop-shadow(0 0.125rem 0.25rem rgba(0,0,0,0.3));
    line-height: 1;
  }

  .f5-extras {
    display: flex;
    justify-content: space-between;
    margin-top: 3.75rem;
    padding: 0.75rem 0 0 0;
    border-top: 1px solid var(--border-secondary);
    gap: 12px;
    min-width: max-content;
  }

  .f5-extra-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.3125rem;
  }

  .f5-extra-row {
    display: flex;
    align-items: center;
    gap: 0.1875rem;
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
  }

  .f5-extra-icon {
    font-size: 14px;
  }

  .f5-precip-prob {
    font-size: 14px;
    font-weight: 700;
    color: #60a5fa;
    letter-spacing: 0.01em;
  }

  .f5-uv-badge {
    font-size: 14px;
    font-weight: 700;
    color: #000;
    padding: 0.125rem 0.4375rem;
    border-radius: 0.375rem;
    line-height: 1.4;
  }

  .f5-wind-arrow {
    font-size: 1rem; /* 16px */
    color: var(--primary-color);
    font-weight: 700;
  }

  .f5-sun-row {
    font-size: 14px;
    color: var(--text-primary);
    opacity: 0.9;
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
    width: 95vw;
    max-width: 1200px;
    max-height: 98vh;
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
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .detail-header h3 svg {
    flex-shrink: 0;
    color: var(--primary-color, #00ffff);
    width: 26px;
    height: 26px;
  }

  .inline-ad-slot {
    width: 100%;
    background: rgba(255, 255, 255, 0.08);
    border: 1px dashed rgba(255, 255, 255, 0.18);
    border-radius: 16px;
    margin: 16px 0;
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .inline-ad-slot.is-native {
    background: transparent;
    border-color: transparent;
    padding: 0;
  }

  .test-ad-label {
    background: #000;
    color: #fff;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 2px;
    font-weight: 700;
  }

  .test-ad-text {
    color: #333;
    font-size: 13px;
  }

  .detail-content {
    padding: 24px;
  }

  /* ===== CONTROL BUTTONS ===== */

  /* ===== TIME CONTROLS ===== */
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
      bottom: 120px;
      left: 10px;
    }

    .time-slider-wrapper {
      bottom: 60px;
      width: 95%;
    }

  @media (orientation: landscape) and (max-width: 991px) {
    .time-slider-wrapper {
      padding: 0;
    }
  }

    .detail-content {
      padding: 16px 7px;
    }
  }

  /* ===== HOURLY BAR CHART ===== */
  .hourly-chart-wrapper {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 14px 4px 20px 4px;
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color, #00ffff) transparent;
  }

  .hourly-chart-wrapper::-webkit-scrollbar {
    height: 4px;
  }

  .hourly-chart-wrapper::-webkit-scrollbar-thumb {
    background: var(--primary-color, #00ffff);
    border-radius: 2px;
  }

  .hourly-col {
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 44px;
  }

  .h-icon {
    font-size: 26px;
    line-height: 1;
    margin-bottom: 7px;
  }

  .h-temp {
    font-size: 14px;
    font-weight: 700;
    color: var(--primary-color, #00ffff);
    white-space: nowrap;
  }

  .h-bar {
    background: var(--gradient-1, linear-gradient(to top, #00ffff, #00ff96));
    border-radius: 5px;
    min-height: 4px;
    box-shadow: 0 0 6px var(--primary-color, #00ffff);
  }

  .h-precip {
    font-size: 14px;
    color: var(--secondary-color, #60a5fa);
    white-space: nowrap;
    min-height: 1.2em;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.2;
    text-align: center;
  }

  .h-time {
    font-size: 14px;
    font-weight: 700;
    color: var(--text-secondary, #8892b0);
  }

  /* Ráno 05–09 */
  .h-time--morning {
    color: #fbbf24;
    text-shadow: 0 0 6px rgba(251,191,36,0.4);
  }

  /* Deň 10–17 */
  .h-time--day {
    color: #ffffff;
    text-shadow: 0 0 6px rgba(255,255,255,0.25);
  }

  /* Večer 18–21 */
  .h-time--evening {
    color: #60a5fa;
    text-shadow: 0 0 6px rgba(96,165,250,0.4);
  }

  /* Noc 20–04 */
  .h-time--night {
    color: #3b82f6;
    text-shadow: 0 0 8px rgba(59,130,246,0.5);
  }

  .h-wind {
    font-size: 14px;
    color: var(--text-primary);
    white-space: nowrap;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.2;
  }

  .h-wind-arrow {
    font-size: 16px;
    color: var(--primary-color, #00ffff);
    line-height: 1;
  }


  .h-unit {
    font-size: 14px;
    color: var(--text-primary);
    opacity: 0.6;
    line-height: 1;
    margin-bottom: 7px;
  }

  /* ===== SAVED PLACES TRIGGER ===== */
  .sp-trigger-btn {
    position: fixed;
    top: 165px;
    right: 20px;
    z-index: 500;
    background: var(--bg-primary, rgba(26, 35, 50, 0.95));
    border: 1px solid var(--border-secondary, rgba(255,255,255,0.2));
    border-radius: 50%;
    width: 55px;
    height: 55px;
    font-size: 18px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(20px);
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    transition: all 0.2s ease;
    position: fixed;
  }

  .sp-trigger-btn:hover {
    border-color: var(--primary-color, #00ffff);
    transform: scale(1.05);
    box-shadow: 0 0 16px rgba(0,255,255,0.3);
  }

  .sp-trigger-count {
    position: absolute;
    top: -4px;
    right: -4px;
    background: var(--primary-color, #00ffff);
    color: #000;
    font-size: 10px;
    font-weight: 800;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: 1195px) {
    .sp-trigger-btn {
      top: 165px;
      right: 12px;
      width: 50px;
      height: 50px;
      font-size: 21px;
    }
  }

  /* ===== LANGUAGE PICKER ===== */
  .lang-picker-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 9999;
    display: flex;
    align-items: flex-end;
  }

  .lang-picker-sheet {
    width: 100%;
    background: var(--bg-primary, rgba(26, 35, 50, 0.98));
    border-top: 1px solid var(--border-primary, rgba(0, 255, 255, 0.3));
    border-radius: 24px 24px 0 0;
    padding: 28px 24px 40px;
    backdrop-filter: blur(30px);
    animation: slideUp 0.3s ease-out;
    box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.5);
  }

  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }

  .lang-picker-title {
    font-size: 14px;
    color: var(--text-secondary, #8892b0);
    text-align: center;
    margin-bottom: 24px;
    font-weight: 500;
  }

  .lang-picker-btns {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .lang-pick-btn {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    background: var(--bg-glass, rgba(255, 255, 255, 0.05));
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.15));
    border-radius: 16px;
    color: var(--text-primary, #ffffff);
    font-size: 17px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
  }

  .lang-pick-btn:active {
    background: var(--gradient-1, linear-gradient(135deg, rgba(0,255,255,0.2), rgba(0,200,255,0.1)));
    border-color: var(--primary-color, #00ffff);
    transform: scale(0.98);
  }

  .lang-flag {
    font-size: 28px;
  }
</style>
