<!-- src/lib/components/MarkerPopup.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';
  import { getWeatherIcon } from '$lib/utils/weatherIcons.js';
  
  // Props
  export let marker = null;
  export let weatherData = null;
  export let locationName = '';
  export let maptilersdk = null;

  // Extend BTN
  export let onToggleDetailPanel = () => {};
  
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
           <!-- HEADER s novým tlačidlom -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; padding-right: 30px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 16px; filter: drop-shadow(0 0 8px ${css.primaryColor});">📍</span>
              <span style="padding-right: 7px; font-size: 16px; font-weight: 700; color: ${css.textPrimary}; background: ${css.gradient1}; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${locationName}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- NOVÉ TLAČIDLO PRE DETAIL PANEL -->
              <button
                id="popup-detail-btn"
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
              
              <div style="font-size: 12px; color: ${css.textSecondary}; font-weight: 600; background: ${css.bgGlass}; padding: 4px 8px; border-radius: 8px; border: 1px solid ${css.borderSecondary};">
                ${new Date(weatherData.current.time).toLocaleTimeString('sk', {hour: '2-digit', minute: '2-digit'})}
              </div>
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
                      ">Tlak</span>
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
              @media (max-width: 1195px) {
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

              /* 🖥️ SKRYŤ DETAIL BUTTON NA DESKTOP */
              @media (min-width: 1195px) {
                  #popup-detail-btn {
                      display: none !important;
                  }
              }
              
              .maplibregl-popup,
              .weather-popup-themed {
                z-index: 9 !important;
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
  
  if (isMobile) {
    popupOptions.offset = [0, -20];
    popupOptions.maxWidth = '260px';
    popupOptions.anchor = 'bottom';
  } else {
    popupOptions.offset = [0, -15];
    popupOptions.maxWidth = '300px';
  }
  
  const popup = new maptilersdk.Popup(popupOptions).setHTML(popupContent);
  marker.setPopup(popup);

  // ✅ PRIDAJ EVENT LISTENER PO ZOBRAZENÍ
  popup.on('open', () => {
    attachDetailButtonListener();
  });
    
  setTimeout(() => {
    marker.togglePopup();
  }, 2200);
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
        // ❌ Odstráň starý listener (ak existuje)
        detailBtn.removeEventListener('click', handleDetailClick);
        
        // ✅ Pridaj nový listener
        detailBtn.addEventListener('click', handleDetailClick);
        
        console.log('✅ Detail button listener attached');
      }
    }, 100);
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