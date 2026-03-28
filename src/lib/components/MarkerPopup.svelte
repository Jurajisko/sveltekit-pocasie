<!-- src/lib/components/MarkerPopup.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { getWeatherIcon } from '$lib/utils/weatherIcons.js';
  import { i18n } from '$lib/i18n/index.js';
  import { currentLanguage } from '$lib/stores/language.js';
  import { temperatureUnit, convertTemp, unitSymbol } from '$lib/stores/temperatureUnit.js';

  let currentUnit = 'celsius';
  temperatureUnit.subscribe(v => { currentUnit = v; });

  $: t = $i18n;

  // Pri zmene jazyka alebo jednotky teploty regeneruj popup
  $: if ($currentLanguage) {
    updateTheme();
  }
  $: if ($temperatureUnit) {
    currentUnit = $temperatureUnit;
    updateTheme();
  }
  
  // Props
  export let marker = null;
  export let weatherData = null;
  export let locationName = '';
  export let maptilersdk = null;

  // Extend BTN
  export let onToggleDetailPanel = () => {};
  export let onSavePlace = () => {};
  
  let popupAnimationStyle = null;

  function getDayNightIcon(weatherCode, time = null) {
    return getWeatherIcon(weatherCode, time);
  }
  
  // Get CSS variables from current theme
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
  
  // Generate popup HTML content
  function generatePopupHTML() {
    if (!weatherData?.current) return '';
    
    // const icon = getDayNightIcon(weatherData.current.code);
    const icon = getDayNightIcon(weatherData.current.code, weatherData.current.time);
    const css = getCSSVariables();
    
    return `
      <style>
        @media (orientation: landscape) and (max-width: 991px) {
          .mz-popup { padding: 12px 16px !important; }
          .mz-row1 { display: flex !important; align-items: center; gap: 10px; margin-bottom: 10px !important; }
          .mz-logo { margin-bottom: 0 !important; flex-shrink: 0; }
          .mz-logo svg { width: 100px !important; height: 32px !important; }
          .mz-header { margin-bottom: 0 !important; padding-right: 0 !important; flex: 1; min-width: 0; }
          .mz-header-name { font-size: 15px !important; }
          .mz-buttons { position: static !important; flex-shrink: 0; }
          .mz-btn-detail { width: 36px !important; height: 36px !important; font-size: 18px !important; }
          .mz-btn-save { width: 30px !important; height: 30px !important; font-size: 14px !important; }
          .mz-weather { display: none !important; }
          .mz-details { display: none !important; }
        }
      </style>
      <div class="mz-popup" style="
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
          <div class="mz-row1">
          <!-- LOGO -->
          <div class="mz-logo" style="display: flex; justify-content: center; margin-bottom: 20px;">
            <svg width="160" height="50" viewBox="0 0 180 56" xmlns="http://www.w3.org/2000/svg">
              <style>
                @keyframes mz-show-d1 { 0%{opacity:1}33%{opacity:1}44%{opacity:0}78%{opacity:0}89%{opacity:1}100%{opacity:1} }
                @keyframes mz-show-combo { 0%{opacity:0}33%{opacity:0}44%{opacity:1}78%{opacity:1}89%{opacity:0}100%{opacity:0} }
                @keyframes mz-ping-out { 0%{opacity:0}10%{opacity:1}60%{opacity:.25}100%{opacity:0} }
                @keyframes mz-dot-beat { 0%,100%{opacity:1}40%{opacity:.4} }
                @keyframes mz-wind-draw { 0%{stroke-dashoffset:65;opacity:0}15%{opacity:.9}70%{stroke-dashoffset:0;opacity:.9}90%{opacity:0}100%{stroke-dashoffset:0;opacity:0} }
                .mz-d1{animation:mz-show-d1 9s ease-in-out infinite}
                .mz-combo{animation:mz-show-combo 9s ease-in-out infinite}
                .mz-arc-ping1{animation:mz-ping-out 2.4s ease-out infinite .4s}
                .mz-arc-ping2{animation:mz-ping-out 2.4s ease-out infinite .2s}
                .mz-arc-ping3{animation:mz-ping-out 2.4s ease-out infinite 0s}
                .mz-dot{animation:mz-dot-beat 2.4s ease-in-out infinite}
                .mz-w1{stroke-dasharray:65;animation:mz-wind-draw 2.4s ease-in-out infinite 0s}
                .mz-w2{stroke-dasharray:60;animation:mz-wind-draw 2.4s ease-in-out infinite .28s}
              </style>
              <g class="mz-d1">
                <line x1="14" y1="7" x2="11" y2="17" stroke="${css.primaryColor}" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
                <line x1="24" y1="4" x2="21" y2="14" stroke="${css.primaryColor}" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
                <line x1="34" y1="7" x2="31" y2="17" stroke="${css.primaryColor}" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
                <path d="M22 46 A20 20 0 0 1 42 26" fill="none" stroke="${css.primaryColor}" stroke-width="2.8" stroke-linecap="round" opacity="0.28"/>
                <path d="M22 46 A13 13 0 0 1 35 33" fill="none" stroke="${css.primaryColor}" stroke-width="2.8" stroke-linecap="round" opacity="0.6"/>
                <path d="M22 46 A6 6 0 0 1 28 40" fill="none" stroke="${css.primaryColor}" stroke-width="2.8" stroke-linecap="round" opacity="1"/>
              </g>
              <g class="mz-combo">
                <path class="mz-w1" d="M8 10 Q19 3 30 10 Q40 17 50 10" fill="none" stroke="${css.primaryColor}" stroke-width="2.8" stroke-linecap="round"/>
                <path class="mz-w2" d="M8 20 Q21 13 33 20 Q43 27 52 19" fill="none" stroke="${css.primaryColor}" stroke-width="2.2" stroke-linecap="round"/>
                <path class="mz-arc-ping1" d="M22 46 A20 20 0 0 1 42 26" fill="none" stroke="${css.primaryColor}" stroke-width="2.8" stroke-linecap="round"/>
                <path class="mz-arc-ping2" d="M22 46 A13 13 0 0 1 35 33" fill="none" stroke="${css.primaryColor}" stroke-width="2.8" stroke-linecap="round"/>
                <path class="mz-arc-ping3" d="M22 46 A6 6 0 0 1 28 40" fill="none" stroke="${css.primaryColor}" stroke-width="2.8" stroke-linecap="round"/>
              </g>
              <circle class="mz-dot" cx="22" cy="46" r="3.5" fill="${css.primaryColor}"/>
              <text x="62" y="26" font-family="Segoe UI,system-ui" font-weight="700" font-size="20" fill="#ffffff" letter-spacing="0.5">Meteo</text>
              <text x="62" y="49" font-family="Segoe UI,system-ui" font-weight="700" font-size="20" fill="${css.primaryColor}" letter-spacing="0.5">Zoomy</text>
            </svg>
          </div>

          </div><!-- end mz-row1 -->

           <!-- HEADER s novým tlačidlom -->
          <div class="mz-header" style="position: relative; margin-bottom: 30px; padding-right: 96px;">
            <div style="display: flex; align-items: flex-start; gap: 6px;">
              <span style="font-size: 15px; flex-shrink: 0; margin-top: 3px; filter: drop-shadow(0 0 8px ${css.primaryColor});">📍</span>
              <span class="mz-header-name" style="font-size: 20px; line-height: 1.3; font-weight: 700; background: ${css.gradient1}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; word-break: break-word;">${locationName}</span>
            </div>

            <div class="mz-buttons" style="position: absolute; top: 0; right: 0; display: flex; align-items: center; gap: 6px;">
              <!-- NOVÉ TLAČIDLO PRE DETAIL PANEL -->
              <button
                id="popup-detail-btn"
                class="mz-btn-detail"
                style="
                  /* === ZÁKLADNÉ VLASTNOSTI === */
                  background: ${css.bgPrimary};
                  border: 2px solid ${css.primaryColor};
                  color: ${css.primaryColor};
                  border-radius: 50%;
                  cursor: pointer;
                  font-size: 25px;
                  
                  /* === ROZMER === */
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  width: 45px;
                  height: 45px;
                  
                  /* === POINTING ANIMATION === */
                  animation: pointingPulse 1.8s ease-in-out infinite;
                  
                  /* === VISUAL EFFECTS === */
                  box-shadow: 
                    0 4px 12px rgba(0, 0, 0, 0.3),
                    0 0 0 0 ${css.primaryColor}00;
                  backdrop-filter: blur(10px);
                  
                  /* === SMOOTH TRANSITIONS === */
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  position: relative;
                  
                  /* === MOBILE TOUCH === */
                  -webkit-tap-highlight-color: transparent;
                  touch-action: manipulation;
                  user-select: none;
                "
                title="👆 Klikni pre detailné grafy!"
                
                /* === MOBILE TOUCH FEEDBACK === */
                ontouchstart="
                  this.style.transform='scale(0.9)';
                  this.style.animationPlayState='paused';
                  this.style.filter='brightness(1.3)';
                "
                ontouchend="
                  this.style.transform='scale(1)';
                  this.style.animationPlayState='running';
                  this.style.filter='brightness(1)';
                "
                
                /* === DESKTOP HOVER === */
                onmouseover="
                  this.style.background='${css.primaryColor}';
                  this.style.color='#000';
                  this.style.transform='scale(1.1)';
                  this.style.animationPlayState='paused';
                  this.style.boxShadow='0 8px 24px rgba(0, 0, 0, 0.4), 0 0 0 8px ${css.primaryColor}30';
                  this.style.filter='drop-shadow(0 0 20px ${css.primaryColor}60)';
                "
                onmouseout="
                  this.style.background='${css.gradient2}';
                  this.style.color='${css.primaryColor}';
                  this.style.transform='scale(1)';
                  this.style.animationPlayState='running';
                  this.style.boxShadow='0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 0 ${css.primaryColor}00';
                  this.style.filter='none';
                "
                
                onclick="
                  // Tu bude tvoja funkcia na otvorenie detail panelu
                  console.log('Detail panel clicked!');
                  if (typeof toggleDetailPanel === 'function') {
                    toggleDetailPanel();
                  }
                "
              >
                👆
              </button>
              <style>
                @keyframes pointingPulse {
                  0%, 100% {
                    transform: scale(1) translateY(0);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  }
                  50% {
                    transform: scale(1.02) translateY(-1px);
                    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35), 0 0 0 2px ${css.primaryColor}15;
                  }
                }
              </style>
              
              <button
                id="popup-save-btn"
                class="mz-btn-save"
                style="
                  background: ${css.bgGlass};
                  border: 1px solid ${css.borderSecondary};
                  color: ${css.textSecondary};
                  border-radius: 8px;
                  cursor: pointer;
                  font-size: 18px;
                  width: 36px;
                  height: 36px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transition: all 0.2s;
                  -webkit-tap-highlight-color: transparent;
                "
                ontouchstart="this.style.transform='scale(0.9)'"
                ontouchend="this.style.transform='scale(1)'"
                onmouseover="this.style.borderColor='${css.primaryColor}'; this.style.color='${css.primaryColor}';"
                onmouseout="this.style.borderColor='${css.borderSecondary}'; this.style.color='${css.textSecondary}';"
                title="Uložiť miesto"
              >⭐</button>
            </div>
          </div>
              
          <!-- MAIN WEATHER -->
          <div class="mz-weather" style="
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
              overflow: hidden;
          ">
              <div style="
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  height: 2px;
                  background: ${css.gradient1};
              "></div>

              <div class="mz-weather-icon" style="
                  font-size: 42px;
                  filter: drop-shadow(0 0 15px ${css.primaryColor});
                  animation: iconFloat 3s ease-in-out infinite;
              ">${icon}</div>
              
              <div style="flex: 1;">
                  <div class="mz-weather-temp" style="
                      font-size: 32px;
                      font-weight: 800;
                      line-height: 1;
                      background: ${css.gradient1};
                      -webkit-background-clip: text;
                      -webkit-text-fill-color: transparent;
                      background-clip: text;
                      margin-bottom: 4px;
                  ">
                      ${convertTemp(weatherData.current.temp, currentUnit)}<span style="font-size: 20px; opacity: 0.8;">${unitSymbol(currentUnit)}</span>
                  </div>
                  <div class="mz-weather-label" style="
                      font-size: 13px;
                      color: ${css.textSecondary};
                      font-weight: 600;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                  ">${t('current_weather')}</div>
              </div>
          </div>
          
          <!-- DETAILS -->
          <div class="mz-details" style="display: flex; flex-direction: column; gap: 12px;">
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
                      ">${t('wind')}</span>
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
                  ">📊</div>
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
                      ">${t('pressure')}</span>
                      <span style="
                          font-size: 14px;
                          color: ${css.textPrimary};
                          font-weight: 700;
                          background: ${css.gradient1};
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                      ">${weatherData.current.pressure || '---'} hPa</span>
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
                      ">${t('feels_like')}</span>
                      <span style="
                          font-size: 14px;
                          color: ${css.textPrimary};
                          font-weight: 700;
                          background: ${css.gradient1};
                          -webkit-background-clip: text;
                          -webkit-text-fill-color: transparent;
                          background-clip: text;
                      ">${convertTemp(weatherData.current.temp, currentUnit)}${unitSymbol(currentUnit)}</span>
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
  }
  
  // Inject popup animations CSS
  // ✅ OPRAVENÁ FUNKCIA - pridaj do MarkerPopup.svelte
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
                  filter: drop-shadow(0 -2px 4px rgba(0, 0, 0, 0.1)) !important;
                  position: relative !important;
                  top: 0 !important;
                  left: 50% !important;
                  transform: translateX(-50%) !important;
                  margin-top: -1px !important;
                  border-width: 10px 8px 0 8px !important;
              }
              
              /* ✅ PRIDAJ CLOSE BUTTON STYLING */
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
                  cursor: pointer !important;
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
              
              /* MOBILE SPECIFIC */
              @media (max-width: 1195px) and (orientation: portrait) {
                  .weather-popup-themed .maplibregl-popup-content {
                      max-width: 260px !important;
                      transform: none !important;
                      margin-bottom: 5px !important;
                  }
                  
                  .weather-popup-themed .maplibregl-popup-tip {
                      border-width: 15px 10px 0 10px !important;
                      position: absolute !important;
                      bottom: -11px !important;
                      left: 50% !important;
                      transform: translateX(-50%) !important;
                      top: auto !important;
                      margin: 0 !important;
                  }
                  
                  .weather-popup-themed .maplibregl-popup-close-button {
                      width: 28px !important;
                      height: 28px !important;
                      font-size: 16px !important;
                      right: 8px !important;
                      top: 8px !important;
                  }
              }
              
              /* DESKTOP SPECIFIC */
              @media (min-width: 1195px) {
                  .weather-popup-themed .maplibregl-popup-content {
                      max-width: 300px !important;
                      transform: none !important;
                      margin-bottom: 8px !important;
                  }
                  
                  .weather-popup-themed .maplibregl-popup-tip {
                      border-width: 10px 8px 0 8px !important;
                      position: absolute !important;
                      bottom: -9px !important;
                      left: 50% !important;
                      transform: translateX(-50%) !important;
                      top: auto !important;
                      margin: 0 !important;
                  }
              }
              
              .maplibregl-popup,
              .weather-popup-themed {
                z-index: 999 !important;
              }

          `;
          document.head.appendChild(style);
          popupAnimationStyle = style;
      }
  }
      
  // Update popup styles for theme changes
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
            width: 26px !important;
            height: 26px !important;
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
  
  // Create and show popup
  /* export function createPopup() {
    if (!marker || !weatherData?.current || !maptilersdk) return;

    // 📱 DETEKCIA MOBILE/DESKTOP
    const isMobile = window.innerWidth <= 991;
    
    const css = getCSSVariables();
    const popupContent = generatePopupHTML();
    
    // Inject CSS animations
    injectPopupAnimations(css);

    // 🎯 RÔZNE NASTAVENIA PRE MOBILE/DESKTOP
    const popupOptions = {
        closeButton: true,
        closeOnClick: false,
        className: 'weather-popup-themed'
    };
    
    if (isMobile) {
        // 📱 MOBILE: popup vyššie, užší
        popupOptions.offset = [0, -20];
        popupOptions.maxWidth = '260px';
        popupOptions.anchor = 'bottom';
    } else {
        // 💻 DESKTOP: normálne nastavenia
        popupOptions.offset = [0, -15];
        popupOptions.maxWidth = '300px';
    }
    
    // Create popup
    const popup = new maptilersdk.Popup(popupOptions).setHTML(popupContent);
    
    // Attach popup to marker
    marker.setPopup(popup);

    // ✅ PRIDAJ EVENT LISTENER PO ZOBRAZENÍ POPUP
    popup.on('open', () => {
      setTimeout(() => {
        const detailBtn = document.getElementById('popup-detail-btn');
        if (detailBtn) {
          detailBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            onToggleDetailPanel(); // Volaj parent funkciu
          });
        }
      }, 100); // Krátke oneskorenie pre DOM rendering
    });
      
    // Show popup after animation delay
    setTimeout(() => {
      marker.togglePopup();
    }, 2200);
  } */
  // 🔄 UPRAVENÁ createPopup funkcia
export function createPopup() {
  if (!marker || !weatherData?.current || !maptilersdk) return;

  const isMobile = window.innerWidth <= 991;
  const css = getCSSVariables();
  const popupContent = generatePopupHTML();
  
  injectPopupAnimations(css);

  const popupOptions = {
    closeButton: true,
    closeOnClick: false,
    className: 'weather-popup-themed'
  };
  
  const isLandscape = window.innerWidth > window.innerHeight;

  if (isMobile) {
    popupOptions.maxWidth = isLandscape ? '9999px' : '270px';
    popupOptions.anchor = 'bottom';
    popupOptions.offset = isLandscape ? [0, -180] : [0, 0];
  } else {
    popupOptions.offset = [0, -15];
    popupOptions.maxWidth = '300px';
  }
  
  const popup = new maptilersdk.Popup(popupOptions).setHTML(popupContent);
  marker.setPopup(popup);

  // ✅ PRIDAJ EVENT LISTENER PO ZOBRAZENÍ
  popup.on('open', () => {
    attachDetailButtonListener();
    removeMiniBar();
    const pd = document.getElementById('pointer-data');
    if (pd) pd.style.display = 'none';

    // Po vykreslení skontroluj či je popup celý viditeľný, ak nie — dopannuj mapu
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const popupEl = popup.getElement();
        if (!popupEl) return;
        const rect = popupEl.getBoundingClientRect();
        const margin = 8;
        let panX = 0;
        let panY = 0;
        if (rect.top < margin) panY = rect.top - margin;
        if (rect.left < margin) panX = rect.left - margin;
        if (rect.right > window.innerWidth - margin) panX = rect.right - window.innerWidth + margin;
        if (panX !== 0 || panY !== 0) {
          const map = marker?.getMap?.();
          if (map) map.panBy([panX, panY], { duration: 350 });
        }
      });
    });
  });

  popup.on('close', () => {
    showMiniBar();
    const pd = document.getElementById('pointer-data');
    if (pd) pd.style.display = '';
  });

  setTimeout(() => {
    marker.togglePopup();
  }, 2200);
}

function showMiniBar() {
  removeMiniBar();
  const bar = document.createElement('div');
  bar.id = 'popup-mini-bar';
  bar.innerHTML = `<span style="font-size:14px;">📍</span> <span style="font-weight:700;">${locationName}</span> <span style="opacity:0.6;font-size:12px;">▲</span>`;
  bar.style.cssText = `
    position: fixed;
    bottom: 210px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-primary, rgba(26,35,50,0.95));
    border: 1px solid var(--border-primary, rgba(0,255,255,0.3));
    color: var(--text-primary, #fff);
    padding: 11px 18px;
    border-radius: 20px;
    cursor: pointer;
    z-index: 998;
    display: flex;
    align-items: center;
    gap: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    backdrop-filter: blur(10px);
    font-family: system-ui;
    font-size: 14px;
    white-space: nowrap;
  `;
  bar.addEventListener('click', () => {
    if (marker) {
      marker.togglePopup();
    }
  });
  document.body.appendChild(bar);
}

export function removeMiniBar() {
  const bar = document.getElementById('popup-mini-bar');
  if (bar) bar.remove();
}

  // Update existing popup with new theme
  /* export function updateTheme() {
    if (!marker) return;
    
    const currentPopup = marker.getPopup();
    if (!currentPopup || !currentPopup.isOpen()) return;
    
    const css = getCSSVariables();
    const popupContent = generatePopupHTML();
    
    // Update popup content
    currentPopup.setHTML(popupContent);
    
    // Update CSS styles
    updatePopupStyles(css);
  } */
 // 🔄 UPRAVENÁ updateTheme funkcia
export function updateTheme() {
  if (!marker) return;
  
  const currentPopup = marker.getPopup();
  if (!currentPopup || !currentPopup.isOpen()) return;
  
  const css = getCSSVariables();
  const popupContent = generatePopupHTML();
  
  // Update popup content
  currentPopup.setHTML(popupContent);
  
  // Update CSS styles
  updatePopupStyles(css);
  
  // 🆕 KĽÚČOVÉ: Re-attach event listener po theme change!
  attachDetailButtonListener();
}


  // 🆕 PRIDAJ novú funkciu pre pripojenie event listenera
  function attachDetailButtonListener() {
    setTimeout(() => {
      const detailBtn = document.getElementById('popup-detail-btn');
      if (detailBtn) {
        detailBtn.removeEventListener('click', handleDetailClick);
        detailBtn.addEventListener('click', handleDetailClick);
      }

      const saveBtn = document.getElementById('popup-save-btn');
      if (saveBtn) {
        saveBtn.removeEventListener('click', handleSaveClick);
        saveBtn.addEventListener('click', handleSaveClick);
      }
    }, 100);
  }

  function handleSaveClick(e) {
    e.stopPropagation();
    onSavePlace();
    const saveBtn = document.getElementById('popup-save-btn');
    if (saveBtn) {
      saveBtn.innerText = '✓';
      saveBtn.style.color = '#22c55e';
      saveBtn.style.borderColor = '#22c55e';
      saveBtn.style.fontSize = '16px';
      saveBtn.style.fontWeight = '700';
      setTimeout(() => {
        saveBtn.innerText = '⭐';
        saveBtn.style.color = '#f59e0b';
        saveBtn.style.borderColor = '#f59e0b';
        saveBtn.style.fontSize = '18px';
        saveBtn.style.fontWeight = 'normal';
      }, 2000);
    }
  }

  // 🆕 SEPARÁTNA funkcia pre click handling
  function handleDetailClick(e) {
    e.stopPropagation();
    console.log('🖱️ Detail button clicked!');
    onToggleDetailPanel(); // Volaj parent funkciu
  }
  
  // Listen for theme changes
  /* onMount(() => {
    const handleThemeChange = () => {
      updateTheme();
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }); */
  // 🔄 UPRAVENÁ onMount sekcia
onMount(() => {
  const handleThemeChange = () => {
    console.log('🎨 Theme changed, updating popup...');
    updateTheme();
  };
  
  window.addEventListener('themeChanged', handleThemeChange);
  
  return () => {
    window.removeEventListener('themeChanged', handleThemeChange);
    
    // ✅ Cleanup: Odstráň detail button listener
    const detailBtn = document.getElementById('popup-detail-btn');
    if (detailBtn) {
      detailBtn.removeEventListener('click', handleDetailClick);
    }
  };
});
  
  // Cleanup on destroy
  onDestroy(() => {
    if (popupAnimationStyle) {
      popupAnimationStyle.remove();
    }
  });

  
</script>

<!-- Component template (could be empty since we're working with MapTiler SDK directly) -->
<div class="weather-popup-wrapper">
  <!-- This component handles popup logic via JavaScript API -->
</div>

<style>
  .weather-popup-wrapper {
    display: none; /* Hidden since we use MapTiler SDK directly */
  }
</style>