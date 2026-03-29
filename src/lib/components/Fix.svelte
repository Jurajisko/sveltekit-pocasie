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

  function getWeatherDesc(code) {
    const c = parseInt(code);
    if (c === 0) return t('desc_clear') || 'Jasno';
    if (c <= 2) return t('desc_mainly_clear') || 'Prevažne jasno';
    if (c === 3) return t('desc_overcast') || 'Zamračené';
    if (c <= 48) return t('desc_fog') || 'Hmla';
    if (c <= 55) return t('desc_drizzle') || 'Mrholenie';
    if (c <= 65) return t('desc_rain') || 'Dážď';
    if (c <= 75) return t('desc_snow') || 'Sneženie';
    if (c <= 82) return t('desc_showers') || 'Prehánky';
    return t('desc_storm') || 'Búrka';
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
    if (layerId === null) clearWeatherLayer();
    else changeWeatherLayer(layerId);
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
    if (!detailAdsEnabled || !supportsInlineAdaptiveBanner()) {
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
  let activeLayer = null;
  /** @type {any} */
  let activeColorRamp = null;
  /** @type {any} */
  let customPrecipRamp = null;
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
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weathercode,wind_speed_10m,pressure_msl&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
  

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.current && data.daily) {
        weatherData = {
          current: {
            temp: data.current.temperature_2m,
            feelsLike: data.current.apparent_temperature,
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
  // Zero-centered bar scale — vždy zahŕňa 0
  $: hEffMin = Math.min(hMinTemp, 0);
  $: hEffMax = Math.max(hMaxTemp, 0);
  $: hEffRange = (hEffMax - hEffMin) || 1;
  $: hZeroPct = ((0 - hEffMin) / hEffRange) * 55 + 15;
  let detailPanelEl;
  const detailAdsEnabled = false;

  let forecastScrollEl;
  let precipEl;
  let windEl;

  let isSyncing = false;
  function syncScroll(sourceEl) {
    if (isSyncing) return;
    isSyncing = true;
    const left = sourceEl.scrollLeft;
    if (forecastScrollEl && forecastScrollEl !== sourceEl) forecastScrollEl.scrollLeft = left;
    if (precipEl && precipEl !== sourceEl) precipEl.scrollLeft = left;
    if (windEl && windEl !== sourceEl) windEl.scrollLeft = left;
    isSyncing = false;
  }
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
    if (!detailAdsEnabled || !supportsInlineAdaptiveBanner() || !showDetailPanel || !detailPanelEl) {
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
    if (!detailAdsEnabled || !supportsInlineAdaptiveBanner() || !showDetailPanel) {
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
        if (detailAdsEnabled) {
          await AdMob.prepareInterstitial({ adId: 'ca-app-pub-3940256099942544/1033173712', isTesting: true });
          await AdMob.showInterstitial();
        }
      } catch (e) {}

      if (detailAdsEnabled) {
        await startInlineBanner();
      }
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
    customPrecipRamp = new maptilerweather.ColorRamp({
      stops: [
        { value: 0,    color: [0,   0,   0,   0]   },  // transparent = sucho
        { value: 0.1,  color: [0,   220, 255, 180] },  // tyrkys = mrholenie
        { value: 0.5,  color: [0,   120, 255, 200] },  // modrá
        { value: 1,    color: [0,   60,  255, 220] },  // sýta modrá
        { value: 3,    color: [100, 0,   255, 235] },  // fialová
        { value: 8,    color: [255, 100, 0,   245] },  // oranžová
        { value: 20,   color: [255, 0,   0,   255] },  // červená = silné zrážky
      ]
    });
    weatherLayers.precipitation.colorRamp = customPrecipRamp;
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
      projection: 'mercator',
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
    });

    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.touchPitch.disable();

    map.on('load', () => {
      map.setPaintProperty("Water", 'fill-color', "rgba(0, 0, 0, 0.4)");
      // Weather layer sa nenačíta automaticky — používateľ si zvolí

      // Načítaj predvolené miesto pri štarte
      const defaultPlace = savedPlaces.getDefault();
      if (defaultPlace) {
        setTimeout(() => {
          handleLocationClick(defaultPlace.lng, defaultPlace.lat, defaultPlace.name);
        }, 800);
      }
      map.on('mousemove', (e) => updatePointerValue(e.lngLat));

        // Map click disabled — use search to select location
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
    flyToOptions.zoom = 5;
    flyToOptions.center = [lng, lat + 0.07];
    flyToOptions.padding = { top: 620, bottom: 160, left: 20, right: 20 };
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
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weathercode,wind_speed_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,snowfall,wind_speed_10m,wind_direction_10m,weathercode,cloudcover_low,cloudcover_mid,cloudcover_high&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,snowfall_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset,wind_direction_10m_dominant&timezone=auto&forecast_days=16`;

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
            daily: data.daily,
            currentHumidity: data.current?.relative_humidity_2m ?? null
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
        weatherLayer = new maptilerweather.PrecipitationLayer({
          id: 'precipitation',
          opacity: 1,
          colorramp: customPrecipRamp
        });
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
    if (markerPopup) markerPopup.closePopup();

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

  function clearWeatherLayer() {
    if (activeLayer && map.getLayer(activeLayer)) {
      const activeWeatherLayer = weatherLayers[activeLayer]?.layer;
      if (activeWeatherLayer) {
        if (isPlaying) { activeWeatherLayer.stopAnimation(); isPlaying = false; }
        map.setLayoutProperty(activeLayer, 'visibility', 'none');
      }
    }
    activeLayer = null;
    activeColorRamp = null;
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
      <div class="lang-picker-logo">
        <svg width="200" height="62" viewBox="0 0 180 56" xmlns="http://www.w3.org/2000/svg">
          <style>
            @keyframes mz-show-d1    { 0%{opacity:1} 23%{opacity:1} 26%{opacity:0} 97%{opacity:0} 100%{opacity:1} }
            @keyframes mz-show-sun   { 0%{opacity:0} 23%{opacity:0} 26%{opacity:1} 48%{opacity:1} 51%{opacity:0} 100%{opacity:0} }
            @keyframes mz-show-combo { 0%{opacity:0} 48%{opacity:0} 51%{opacity:1} 73%{opacity:1} 76%{opacity:0} 100%{opacity:0} }
            @keyframes mz-show-rain  { 0%{opacity:0} 73%{opacity:0} 76%{opacity:1} 97%{opacity:1} 100%{opacity:0} }
            @keyframes mz-ping-out   { 0%{opacity:0}10%{opacity:1}60%{opacity:.25}100%{opacity:0} }
            @keyframes mz-dot-beat   { 0%,100%{opacity:1}40%{opacity:.4} }
            @keyframes mz-wind-draw  { 0%{stroke-dashoffset:65;opacity:0}15%{opacity:.9}70%{stroke-dashoffset:0;opacity:.9}90%{opacity:0}100%{stroke-dashoffset:0;opacity:0} }
            @keyframes mz-sun-spin   { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
            @keyframes mz-sun-pulse  { 0%,100%{opacity:.7} 50%{opacity:1} }
            @keyframes mz-rd-fall    { 0%{transform:translateY(0);opacity:0} 15%{opacity:1} 80%{opacity:.7} 100%{transform:translateY(12px);opacity:0} }
            .lp-d1         { animation: mz-show-d1    12s ease-in-out infinite }
            .lp-sun-grp    { animation: mz-show-sun   12s ease-in-out infinite }
            .lp-combo      { animation: mz-show-combo 12s ease-in-out infinite }
            .lp-rain-grp   { animation: mz-show-rain  12s ease-in-out infinite }
            .lp-arc-ping1  { animation: mz-ping-out 2.4s ease-out infinite .4s }
            .lp-arc-ping2  { animation: mz-ping-out 2.4s ease-out infinite .2s }
            .lp-arc-ping3  { animation: mz-ping-out 2.4s ease-out infinite 0s }
            .lp-dot        { animation: mz-dot-beat 2.4s ease-in-out infinite }
            .lp-w1         { stroke-dasharray:65; animation: mz-wind-draw 2.4s ease-in-out infinite 0s }
            .lp-w2         { stroke-dasharray:65; animation: mz-wind-draw 2.4s ease-in-out infinite .15s }
            .lp-w3         { stroke-dasharray:65; animation: mz-wind-draw 2.4s ease-in-out infinite .3s }
            .lp-sun-rays   { transform-box:fill-box; transform-origin:center; animation: mz-sun-spin 16s linear infinite }
            .lp-sun-core   { animation: mz-sun-pulse 2s ease-in-out infinite }
            .lp-rd1        { animation: mz-rd-fall 1.2s ease-in infinite 0s }
            .lp-rd2        { animation: mz-rd-fall 1.2s ease-in infinite .3s }
            .lp-rd3        { animation: mz-rd-fall 1.2s ease-in infinite .6s }
            .lp-rd4        { animation: mz-rd-fall 1.2s ease-in infinite .15s }
          </style>
          <!-- Radar phase -->
          <g class="lp-d1">
            <circle cx="28" cy="28" r="22" fill="none" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" opacity="0.15"/>
            <path class="lp-arc-ping1" d="M28 8 A20 20 0 0 1 48 28" fill="none" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
            <path class="lp-arc-ping2" d="M28 11 A17 17 0 0 1 45 28" fill="none" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
            <path class="lp-arc-ping3" d="M28 14 A14 14 0 0 1 42 28" fill="none" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
            <circle class="lp-dot" cx="28" cy="28" r="3" fill="var(--primary-color,#00ffff)"/>
          </g>
          <!-- Sun phase -->
          <g class="lp-sun-grp">
            <g class="lp-sun-rays">
              <line x1="28" y1="9"  x2="28" y2="15" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="28" y1="41" x2="28" y2="47" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="9"  y1="28" x2="15" y2="28" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="41" y1="28" x2="47" y2="28" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="15" y1="15" x2="19" y2="19" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="37" y1="37" x2="41" y2="41" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="41" y1="15" x2="37" y2="19" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="15" y1="41" x2="19" y2="37" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
            </g>
            <circle class="lp-sun-core" cx="28" cy="28" r="9" fill="var(--primary-color,#00ffff)" opacity="0.5"/>
            <circle cx="28" cy="28" r="5" fill="var(--primary-color,#00ffff)" opacity="0.9"/>
          </g>
          <!-- Wind phase -->
          <g class="lp-combo">
            <path class="lp-w1" d="M10 22 Q19 16 28 22 Q37 28 46 22" fill="none" stroke="var(--primary-color,#00ffff)" stroke-width="2" stroke-linecap="round"/>
            <path class="lp-w2" d="M10 28 Q19 22 28 28 Q37 34 46 28" fill="none" stroke="var(--primary-color,#00ffff)" stroke-width="2" stroke-linecap="round"/>
            <path class="lp-w3" d="M10 34 Q19 28 28 34 Q37 40 46 34" fill="none" stroke="var(--primary-color,#00ffff)" stroke-width="2" stroke-linecap="round"/>
          </g>
          <!-- Rain phase -->
          <g class="lp-rain-grp">
            <path d="M11 27 Q11 20 16 20 Q17 14 23 14 Q31 14 33 20 Q39 20 39 27 Q39 32 33 32 L13 32 Q11 32 11 27Z" fill="var(--primary-color,#00ffff)" opacity="0.2"/>
            <line class="lp-rd1" x1="16" y1="35" x2="14" y2="43" stroke="var(--primary-color,#00ffff)" stroke-width="2" stroke-linecap="round"/>
            <line class="lp-rd2" x1="22" y1="35" x2="20" y2="43" stroke="var(--primary-color,#00ffff)" stroke-width="2" stroke-linecap="round"/>
            <line class="lp-rd3" x1="34" y1="35" x2="32" y2="43" stroke="var(--primary-color,#00ffff)" stroke-width="2" stroke-linecap="round"/>
            <line class="lp-rd4" x1="28" y1="35" x2="26" y2="43" stroke="var(--primary-color,#00ffff)" stroke-width="1.5" stroke-linecap="round"/>
          </g>
          <!-- Text -->
          <text x="62" y="30" font-family="Segoe UI,system-ui" font-weight="300" font-size="22" fill="white" letter-spacing="1">Meteo</text>
          <text x="62" y="49" font-family="Segoe UI,system-ui" font-weight="700" font-size="28" fill="var(--primary-color,#00ffff)" letter-spacing="0.5">Zoomy</text>
        </svg>
      </div>
      <div class="lang-picker-title">🌍 Vyber jazyk / Choose language</div>
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
        <button class="lang-pick-btn" on:click={() => pickLanguage('ru')}>
          <span class="lang-flag">🇷🇺</span>
          <span>Русский</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('es')}>
          <span class="lang-flag">🇪🇸</span>
          <span>Español</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('ja')}>
          <span class="lang-flag">🇯🇵</span>
          <span>日本語</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('fr')}>
          <span class="lang-flag">🇫🇷</span>
          <span>Français</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('hi')}>
          <span class="lang-flag">🇮🇳</span>
          <span>हिन्दी</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('pt')}>
          <span class="lang-flag">🇧🇷</span>
          <span>Português</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('ko')}>
          <span class="lang-flag">🇰🇷</span>
          <span>한국어</span>
        </button>
        <button class="lang-pick-btn" on:click={() => pickLanguage('cs')}>
          <span class="lang-flag">🇨🇿</span>
          <span>Čeština</span>
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
  onReopen={() => {
    if (!map || currentLat === null || currentLng === null) return;
    const isMobile = window.innerWidth <= 991;
    const flyToOptions = { duration: 1500, essential: true };
    if (isMobile) {
      flyToOptions.center = [currentLng, currentLat + 0.07];
      flyToOptions.zoom = 5;
      flyToOptions.padding = { top: 620, bottom: 160, left: 20, right: 20 };
    } else {
      flyToOptions.center = [currentLng, currentLat + 0.006];
      flyToOptions.zoom = 12;
    }
    map.flyTo(flyToOptions);
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
          <!-- Current weather -->
          <div class="dp-current-weather">
            <div class="dp-current-icon">{getWeatherIcon(weatherData.current.code, weatherData.current.time)}</div>
            <div>
              <div class="dp-current-temp">{convertTemp(weatherData.current.temp, unit)}<span class="dp-current-unit">{unitSymbol(unit)}</span></div>
              <div class="dp-current-feels">{t('feels_like') || 'Pocitová'}: {convertTemp(weatherData.current.feelsLike ?? weatherData.current.temp, unit)}{unitSymbol(unit)} · {getWeatherDesc(weatherData.current.code)}</div>
            </div>
          </div>

          <!-- Stats strip -->
          <div class="stats-grid" id="section-statistics">
            <div class="stat-item">
              <span class="stat-label">↑ Max 7d</span>
              <span class="stat-value">{weatherData.extended ? convertTemp(Math.max(...weatherData.extended.daily.temperature_2m_max.slice(0, 7)), unit) : '--'}</span>
              <span class="stat-unit">{unitSymbol(unit)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">↓ Min 7d</span>
              <span class="stat-value">{weatherData.extended ? convertTemp(Math.min(...weatherData.extended.daily.temperature_2m_min.slice(0, 7)), unit) : '--'}</span>
              <span class="stat-unit">{unitSymbol(unit)}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">☔ {t('precipitation')}</span>
              <span class="stat-value">{weatherData.extended ? weatherData.extended.daily.precipitation_sum.slice(0, 7).reduce((a,b) => a+b, 0).toFixed(1) : '--'}</span>
              <span class="stat-unit">mm</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">💨 {t('wind')}</span>
              <span class="stat-value">{weatherData.extended ? Math.max(...weatherData.extended.daily.wind_speed_10m_max.slice(0, 7)).toFixed(1) : '--'}</span>
              <span class="stat-unit">m/s</span>
            </div>
          </div>

          {#if detailAdsEnabled}
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
          {/if}

          <!-- HOURLY FORECAST -->
          <div class="dp-section" id="section-hourly">
            <div class="dp-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> {t('hourly_forecast')}</div>
            <div class="dp-hourly-scroll">
              {#each hourlyData as hour, hi}
                {@const barH = Math.max(((hour.temp - hEffMin) / hEffRange) * 100, 4)}
                <div class="dp-hour-card" class:now={hi === 0}>
                  <span class="dp-hour-icon">{getWeatherIcon(hour.code, hour.originalTime)}</span>
                  <span class="dp-hour-temp">{convertTemp(hour.temp, unit)}{unitSymbol(unit)}</span>
                  <div class="dp-bar-wrap">
                    <div class="dp-bar" style="height:{barH}%"></div>
                  </div>
                  <span class="dp-hour-time">{hour.time}</span>
                  {#if hour.snowfall > 0}
                    <span class="dp-hour-precip dp-hour-precip--snow">❄️{hour.snowfall.toFixed(1)}<small>cm</small></span>
                  {:else if hour.precipitation > 0}
                    <span class="dp-hour-precip dp-hour-precip--rain">💧{hour.precipitation}<small>mm</small></span>
                  {:else}
                    <span class="dp-hour-precip" style="opacity:0">·</span>
                  {/if}
                </div>
              {/each}
            </div>
          </div>

          {#if detailAdsEnabled}
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
          {/if}

          <!-- DETAILY -->
          <div class="dp-section">
            <div class="dp-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg> {t('details') || 'Detaily'}</div>
            <div class="dp-detail-grid">
              <div class="dp-detail-item">
                <div class="dp-detail-label">💨 {t('wind') || 'Vietor'}</div>
                <div class="dp-detail-value">{weatherData.current.wind?.toFixed(1) ?? '--'}<span class="dp-detail-unit">m/s</span></div>
              </div>
              <div class="dp-detail-item">
                <div class="dp-detail-label">💧 {t('humidity') || 'Vlhkosť'}</div>
                <div class="dp-detail-value">{weatherData.extended?.currentHumidity ?? '--'}<span class="dp-detail-unit">%</span></div>
              </div>
              <div class="dp-detail-item">
                <div class="dp-detail-label">📊 {t('pressure') || 'Tlak'}</div>
                <div class="dp-detail-value">{weatherData.current.pressure ? Math.round(weatherData.current.pressure) : '--'}<span class="dp-detail-unit">hPa</span></div>
              </div>
              <div class="dp-detail-item">
                <div class="dp-detail-label">🌅 UV</div>
                <div class="dp-detail-value">{weatherData.extended?.daily?.uv_index_max?.[0] ? Math.round(weatherData.extended.daily.uv_index_max[0]) : '--'}</div>
              </div>
            </div>
          </div>

          {#if weatherData.extended?.daily}
            {@const f16AllMax = weatherData.extended.daily.temperature_2m_max.slice(0, 15)}
            {@const f16AllMin = weatherData.extended.daily.temperature_2m_min.slice(0, 15)}
            {@const f16GlobMin = Math.min(...f16AllMin)}
            {@const f16GlobMax = Math.max(...f16AllMax)}
            {@const f16Range = (f16GlobMax - f16GlobMin) || 1}
            <div class="dp-section" id="section-forecast-16day">
              <div class="dp-section-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> {t('forecast_16day')}</div>
              <div class="dp-forecast-scroll" bind:this={forecastScrollEl} on:scroll={() => syncScroll(forecastScrollEl)}>
                {#each f16AllMax as maxTemp, i}
                  {@const minTemp = f16AllMin[i]}
                  {@const code = weatherData.extended.daily.weathercode[i]}
                  {@const dateStr = weatherData.extended.daily.time[i]}
                  {@const icon = getWeatherIcon(code, dateStr + 'T12:00')}
                  {@const precip = weatherData.extended?.daily?.precipitation_sum?.[i] || 0}
                  {@const snow = weatherData.extended?.daily?.snowfall_sum?.[i] || 0}
                  {@const precipProb = weatherData.extended?.daily?.precipitation_probability_max?.[i] ?? 0}
                  {@const barBottom = ((minTemp - f16GlobMin) / f16Range) * 100}
                  {@const barHeight = Math.max(((maxTemp - minTemp) / f16Range) * 100, 4)}
                  {@const dayLabel = i === 0 ? t('today') : i === 1 ? t('tomorrow') : new Date(dateStr).toLocaleDateString(lang, {weekday: 'short'})}
                  <div class="dp-fc-card" class:today={i === 0}>
                    <span class="dp-fc-day">{dayLabel}</span>
                    <span class="dp-fc-icon">{icon}</span>
                    <span class="dp-fc-max">{convertTemp(maxTemp, unit)}{unitSymbol(unit)}</span>
                    <div class="dp-fc-bar-col">
                      <div class="dp-fc-bar-fill" style="bottom:{barBottom}%;height:{barHeight}%"></div>
                    </div>
                    <span class="dp-fc-min">{convertTemp(minTemp, unit)}{unitSymbol(unit)}</span>
                    <span class="dp-fc-precip" style="opacity:{precipProb > 0 || precip > 0 || snow > 0 ? 1 : 0.3}">
                      {#if snow > 0}❄️ {snow.toFixed(1)}cm{:else}💧 {precipProb}%{/if}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          {#if detailAdsEnabled}
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
          {/if}

          <!-- WEATHER CHARTS -->
          <WeatherCharts {weatherData} bind:precipEl bind:windEl {syncScroll} />
        </div>
      </div>
    </div>
  {/if}
{/if}

<!-- 🎛️ LAYER BUTTONS (desktop) -->
<div id="buttons">
  <button class:active={activeLayer === 'precipitation'} on:click={() => changeWeatherLayer('precipitation')}>{t('precipitation')}</button>
  <button class:active={activeLayer === 'pressure'} on:click={() => changeWeatherLayer('pressure')}>{t('pressure')}</button>
  <button class:active={activeLayer === 'radar'} on:click={() => changeWeatherLayer('radar')}>{t('radar')}</button>
  <button class:active={activeLayer === 'temperature'} on:click={() => changeWeatherLayer('temperature')}>{t('temperature')}</button>
  <button class:active={activeLayer === 'wind'} on:click={() => changeWeatherLayer('wind')}>{t('wind')}</button>
</div>

<!-- 🎛️ LAYER ICON BUTTONS (mobile) -->
<div class="mobile-layer-btns">
  <button class:active={activeLayer === null} on:click={clearWeatherLayer} title={t('layer_clear')}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
  </button>
  <button class:active={activeLayer === 'precipitation'} on:click={() => changeWeatherLayer('precipitation')} title={t('precipitation')}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>
  </button>
  <button class:active={activeLayer === 'pressure'} on:click={() => changeWeatherLayer('pressure')} title={t('pressure')}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>
  </button>
  <button class:active={activeLayer === 'radar'} on:click={() => changeWeatherLayer('radar')} title={t('radar')}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.07 12a7 7 0 1 0 7-7"/><path d="M2.05 12a10 10 0 1 0 10-10"/><circle cx="12" cy="12" r="1" fill="currentColor"/><line x1="12" y1="12" x2="20" y2="5"/></svg>
  </button>
  <button class:active={activeLayer === 'temperature'} on:click={() => changeWeatherLayer('temperature')} title={t('temperature')}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
  </button>
  <button class:active={activeLayer === 'wind'} on:click={() => changeWeatherLayer('wind')} title={t('wind')}>
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>
  </button>
</div>

<!-- ⏯️ TIME SLIDER -->
{#if activeLayer}
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
{/if}

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


  /* ===== NEW DESIGN PANEL (dp-*) ===== */
  .dp-current-weather {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 4px 16px 20px;
  }
  .dp-current-icon { font-size: 52px; line-height: 1; }
  .dp-current-temp {
    font-size: 48px;
    font-weight: 800;
    line-height: 1;
    background: var(--gradient-1, linear-gradient(135deg, #00ffff, #00ff96));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .dp-current-unit { font-size: 28px; }
  .dp-current-feels {
    font-size: 13px;
    color: var(--text-secondary, #8892b0);
    margin-top: 4px;
  }
  .dp-section {
    padding: 0 16px;
    margin-bottom: 24px;
  }
  .dp-section-title {
    color: var(--text-primary);
    font-size: 21px;
    font-weight: 600;
    margin: 0 0 20px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .dp-section-title svg {
    color: var(--primary-color);
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }

  /* Hourly */
  .dp-hourly-scroll {
    display: flex;
    gap: 6px;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .dp-hourly-scroll::-webkit-scrollbar { height: 2px; }
  .dp-hourly-scroll::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); border-radius: 2px; }
  .dp-hour-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    min-width: 52px;
    padding: 8px 4px;
    border-radius: 12px;
    flex-shrink: 0;
  }
  .dp-hour-card.now {
    background: rgba(0,255,255,0.07);
    border: 1px solid rgba(0,255,255,0.18);
  }
  .dp-hour-icon { font-size: 20px; line-height: 1; }
  .dp-hour-temp { font-size: 13px; font-weight: 600; color: var(--text-primary, #fff); }
  .dp-hour-card.now .dp-hour-temp { color: var(--primary-color, #00ffff); }
  .dp-bar-wrap {
    height: 52px;
    width: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .dp-bar {
    width: 10px;
    border-radius: 5px 5px 0 0;
    background: linear-gradient(to top, var(--primary-color, #00ffff) 0%, rgba(0,255,255,0.25) 100%);
    min-height: 4px;
  }
  .dp-hour-card.now .dp-bar {
    box-shadow: 0 0 8px rgba(0,255,255,0.35);
  }
  .dp-hour-time { font-size: 11px; color: var(--text-secondary, #8892b0); font-weight: 500; }
  .dp-hour-card.now .dp-hour-time { color: var(--primary-color, #00ffff); font-weight: 700; }
  .dp-hour-precip { font-size: 11px; color: var(--text-secondary, #8892b0); }
  .dp-hour-precip--rain { color: #60a5fa; }
  .dp-hour-precip--snow { color: #bfdbfe; font-weight: 600; }

  /* Detail grid */
  .dp-detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }
  .dp-detail-item {
    padding: 12px;
    background: rgba(255,255,255,0.03);
    border-radius: 12px;
    border: 1px solid rgba(255,255,255,0.06);
  }
  .dp-detail-label {
    font-size: 10px;
    color: var(--text-secondary, #8892b0);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
  .dp-detail-value {
    font-size: 18px;
    font-weight: 700;
    color: var(--primary-color, #00ffff);
  }
  .dp-detail-unit {
    font-size: 11px;
    color: var(--text-secondary, #8892b0);
    font-weight: 400;
    margin-left: 2px;
  }

  /* 16-day forecast cards */
  .dp-forecast-scroll {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
  }
  .dp-forecast-scroll::-webkit-scrollbar { height: 2px; }
  .dp-forecast-scroll::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); border-radius: 2px; }
  .dp-fc-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    min-width: 62px;
    padding: 12px 6px;
    border-radius: 14px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    flex-shrink: 0;
  }
  .dp-fc-card.today {
    background: rgba(0,255,255,0.06);
    border-color: rgba(0,255,255,0.2);
  }
  .dp-fc-day { font-size: 11px; font-weight: 600; color: var(--text-secondary, #8892b0); text-transform: uppercase; letter-spacing: 0.5px; }
  .dp-fc-card.today .dp-fc-day { color: var(--primary-color, #00ffff); }
  .dp-fc-icon { font-size: 22px; }
  .dp-fc-max { font-size: 14px; font-weight: 700; color: var(--text-primary, #fff); }
  .dp-fc-card.today .dp-fc-max { color: var(--primary-color, #00ffff); }
  .dp-fc-bar-col {
    height: 70px;
    width: 10px;
    background: rgba(255,255,255,0.06);
    border-radius: 5px;
    position: relative;
    flex-shrink: 0;
  }
  .dp-fc-bar-fill {
    position: absolute;
    left: 0; right: 0;
    border-radius: 5px;
    background: linear-gradient(to top, var(--primary-color, #00ffff), rgba(0,255,255,0.35));
    min-height: 6px;
  }
  .dp-fc-card.today .dp-fc-bar-fill {
    box-shadow: 0 0 8px rgba(0,255,255,0.4);
  }
  .dp-fc-min { font-size: 12px; color: var(--text-secondary, #8892b0); }
  .dp-fc-precip { font-size: 10px; color: #60a5fa; white-space: nowrap; }

  /* WeatherCharts inside new detail panel — remove old box styling */
  :global(.detail-content .chart-container) {
    background: none !important;
    border: none !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
    border-radius: 0 !important;
    padding: 0 16px !important;
    margin-bottom: 24px !important;
    animation: none !important;
  }
  :global(.detail-content .chart-container:hover) {
    border-color: transparent !important;
    box-shadow: none !important;
  }
  :global(.detail-content .chart-header h3) {
    color: var(--text-primary);
    font-size: 21px;
    font-weight: 600;
    margin: 0 0 20px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
  }
  :global(.detail-content .chart-header h3 svg) {
    color: var(--primary-color);
    width: 24px;
    height: 24px;
    flex-shrink: 0;
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
    width: 100vw;
    max-width: 1200px;
    max-height: 100vh;
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
    padding: 18px;
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
      display: none;
    }

    .mobile-layer-btns {
      display: flex;
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


  /* ===== SAVED PLACES TRIGGER ===== */
  .sp-trigger-btn {
    position: fixed;
    top: 130px;
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
      top: 130px;
      right: 12px;
      width: 50px;
      height: 50px;
      font-size: 21px;
    }
  }

  /* ===== LANGUAGE PICKER ===== */
  .lang-picker-logo {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }

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
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
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
