<script>
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.js';
  import { currentLanguage, switchLanguage } from '$lib/stores/language.js';
  import { temperatureUnit, setTemperatureUnit } from '$lib/stores/temperatureUnit.js';

  $: t = $i18n;

  let APP_VERSION = '';

  onMount(async () => {
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      APP_VERSION = info.version;
    } catch {
      APP_VERSION = '';
    }
  });

  const languages = [
    { id: 'sk', flag: '🇸🇰' },
    { id: 'en', flag: '🇬🇧' },
    { id: 'de', flag: '🇩🇪' },
    { id: 'ru', flag: '🇷🇺' },
    { id: 'es', flag: '🇪🇸' },
    { id: 'ja', flag: '🇯🇵' },
    { id: 'fr', flag: '🇫🇷' },
    { id: 'hi', flag: '🇮🇳' },
    { id: 'pt', flag: '🇧🇷' },
    { id: 'ko', flag: '🇰🇷' },
    { id: 'cs', flag: '🇨🇿' }
  ];

  // Props
  export let isOpen = false;
  export let activeLayer = 'wind';
  export let currentTheme = 'cyan';
  export let onLayerChange = () => {};
  export let onThemeChange = () => {};
  
  // Data - ROVNAKÉ ako predtým
  const weatherLayers = [
    { id: 'precipitation', key: 'precipitation', svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></svg>` },
    { id: 'temperature', key: 'temperature', svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>` },
    { id: 'wind', key: 'wind', svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/></svg>` },
    { id: 'pressure', key: 'pressure', svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></svg>` },
    { id: 'radar', key: 'radar', svg: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5.07 12a7 7 0 1 0 7-7"/><path d="M2.05 12a10 10 0 1 0 10-10"/><circle cx="12" cy="12" r="1" fill="currentColor"/><line x1="12" y1="12" x2="20" y2="5"/></svg>` }
  ];

  const themes = [
    { id: 'cyan', name: 'Cyberpunk', emoji: '🌊', color: 'linear-gradient(135deg, #00ffff, #00c8ff)' },
    { id: 'purple', name: 'Purple', emoji: '🔮', color: 'linear-gradient(135deg, #a855f7, #c084fc)' },
    { id: 'emerald', name: 'Emerald', emoji: '🌿', color: 'linear-gradient(135deg, #10b981, #34d399)' },
    { id: 'orange', name: 'Orange', emoji: '🔥', color: 'linear-gradient(135deg, #f97316, #fb923c)' },
    { id: 'blue', name: 'Blue', emoji: '💙', color: 'linear-gradient(135deg, #3b82f6, #60a5fa)' }
  ];
  
  // Functions - ROVNAKÉ ako predtým
  function togglePanel() {
    isOpen = !isOpen;
  }
  
  function handleLayerSelect(layer) {
    activeLayer = layer;
    onLayerChange(layer);
    setTimeout(() => { isOpen = false; }, 500);
  }
  
  function handleThemeSelect(themeId) {
    currentTheme = themeId;
    
    if (themeId === 'cyan') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('weather-app-theme', themeId);
    }
    
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { theme: themeId } 
      }));
    }
    
    onThemeChange(themeId);
  }
  
  function closePanel() {
    isOpen = false;
  }
  
  onMount(() => {
    if (typeof localStorage !== 'undefined') {
      const savedTheme = localStorage.getItem('weather-app-theme') || 'cyan';
      currentTheme = savedTheme;
      
      if (savedTheme !== 'cyan') {
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    }
  });
</script>

<!-- HAMBURGER BUTTON -->
<button 
  class="hamburger-btn" 
  class:active={isOpen}
  on:click={togglePanel}
>
  <span></span>
  <span></span>
  <span></span>
</button>

<!-- BACKDROP - ✅ BEZ transition -->
{#if isOpen}
  <div
    class="panel-backdrop"
    on:click={closePanel}
    on:keydown={(e) => e.key === 'Escape' && closePanel()}
    role="presentation"
  ></div>
{/if}

<!-- SIDE PANEL - ✅ BEZ transition, ale s CSS animation -->
{#if isOpen}
  <div class="side-panel">
    <!-- HEADER WITH LOGO + CLOSE BUTTON -->
    <div class="panel-header">
      <svg class="panel-logo" width="180" height="56" viewBox="0 0 180 56" xmlns="http://www.w3.org/2000/svg">
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
          .mz-d1       { animation: mz-show-d1    12s ease-in-out infinite }
          .mz-sun-grp  { animation: mz-show-sun   12s ease-in-out infinite }
          .mz-combo    { animation: mz-show-combo 12s ease-in-out infinite }
          .mz-rain-grp { animation: mz-show-rain  12s ease-in-out infinite }
          .mz-arc-ping1 { animation: mz-ping-out 2.4s ease-out infinite .4s }
          .mz-arc-ping2 { animation: mz-ping-out 2.4s ease-out infinite .2s }
          .mz-arc-ping3 { animation: mz-ping-out 2.4s ease-out infinite 0s }
          .mz-dot      { animation: mz-dot-beat 2.4s ease-in-out infinite }
          .mz-w1       { stroke-dasharray:65; animation: mz-wind-draw 2.4s ease-in-out infinite 0s }
          .mz-w2       { stroke-dasharray:65; animation: mz-wind-draw 2.4s ease-in-out infinite .15s }
          .mz-w3       { stroke-dasharray:65; animation: mz-wind-draw 2.4s ease-in-out infinite .3s }
          .mz-sun-rays { transform-box:fill-box; transform-origin:center; animation: mz-sun-spin 16s linear infinite }
          .mz-sun-core { animation: mz-sun-pulse 2s ease-in-out infinite }
          .mz-rd1      { animation: mz-rd-fall 1.2s ease-in infinite 0s }
          .mz-rd2      { animation: mz-rd-fall 1.2s ease-in infinite .3s }
          .mz-rd3      { animation: mz-rd-fall 1.2s ease-in infinite .6s }
          .mz-rd4      { animation: mz-rd-fall 1.2s ease-in infinite .15s }
        </style>
        <!-- Radar phase -->
        <g class="mz-d1">
          <circle cx="28" cy="28" r="22" fill="none" stroke="var(--primary-color)" stroke-width="1.5" opacity="0.15"/>
          <path class="mz-arc-ping1" d="M28 8 A20 20 0 0 1 48 28" fill="none" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
          <path class="mz-arc-ping2" d="M28 11 A17 17 0 0 1 45 28" fill="none" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
          <path class="mz-arc-ping3" d="M28 14 A14 14 0 0 1 42 28" fill="none" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
          <circle class="mz-dot" cx="28" cy="28" r="3" fill="var(--primary-color)"/>
        </g>
        <!-- Sun phase -->
        <g class="mz-sun-grp">
          <g class="mz-sun-rays">
            <line x1="28" y1="9"  x2="28" y2="15" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="28" y1="41" x2="28" y2="47" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="9"  y1="28" x2="15" y2="28" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="41" y1="28" x2="47" y2="28" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="15" y1="15" x2="19" y2="19" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="37" y1="37" x2="41" y2="41" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="41" y1="15" x2="37" y2="19" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
            <line x1="15" y1="41" x2="19" y2="37" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
          </g>
          <circle class="mz-sun-core" cx="28" cy="28" r="9" fill="var(--primary-color)" opacity="0.5"/>
          <circle cx="28" cy="28" r="5" fill="var(--primary-color)" opacity="0.9"/>
        </g>
        <!-- Wind phase -->
        <g class="mz-combo">
          <path class="mz-w1" d="M10 22 Q19 16 28 22 Q37 28 46 22" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
          <path class="mz-w2" d="M10 28 Q19 22 28 28 Q37 34 46 28" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
          <path class="mz-w3" d="M10 34 Q19 28 28 34 Q37 40 46 34" fill="none" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
        </g>
        <!-- Rain phase -->
        <g class="mz-rain-grp">
          <path d="M11 27 Q11 20 16 20 Q17 14 23 14 Q31 14 33 20 Q39 20 39 27 Q39 32 33 32 L13 32 Q11 32 11 27Z" fill="var(--primary-color)" opacity="0.2"/>
          <line class="mz-rd1" x1="16" y1="35" x2="14" y2="43" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
          <line class="mz-rd2" x1="22" y1="35" x2="20" y2="43" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
          <line class="mz-rd3" x1="34" y1="35" x2="32" y2="43" stroke="var(--primary-color)" stroke-width="2" stroke-linecap="round"/>
          <line class="mz-rd4" x1="28" y1="35" x2="26" y2="43" stroke="var(--primary-color)" stroke-width="1.5" stroke-linecap="round"/>
        </g>
        <!-- Text -->
        <text x="62" y="30" font-family="Segoe UI,system-ui" font-weight="300" font-size="22" fill="var(--text-primary, #fff)" letter-spacing="1">Meteo</text>
        <text x="62" y="49" font-family="Segoe UI,system-ui" font-weight="700" font-size="28" fill="var(--primary-color)" letter-spacing="0.5">Zoomy</text>
      </svg>
      <button class="panel-close" on:click={closePanel}>✕</button>
    </div>

    <!-- WEATHER LAYERS -->
    <div class="panel-section">
      <h3>🌤️ {t('layers')}</h3>

      <div class="layer-grid">
        <button
          class="layer-item"
          class:active={activeLayer === null}
          on:click={() => handleLayerSelect(null)}
        >
          <span class="layer-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></span>
          <span class="layer-name">{t('layer_clear')}</span>
        </button>
        {#each weatherLayers as layer}
          <button
            class="layer-item"
            class:active={activeLayer === layer.id}
            on:click={() => handleLayerSelect(layer.id)}
          >
            <span class="layer-icon">{@html layer.svg}</span>
            <span class="layer-name">{t(layer.key)}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- THEMES -->
    <div class="panel-section">
      <h3>🎨 {t('themes')}</h3>
      <div class="theme-list">
        {#each themes as theme}
          <button 
            class="theme-item"
            class:active={currentTheme === theme.id}
            on:click={() => handleThemeSelect(theme.id)}
          >
            <span 
              class="theme-emoji"
              style="background: {theme.color};"
            >
              {theme.emoji}
            </span>
            <!-- <span class="theme-name">{theme.name}</span> -->
            {#if currentTheme === theme.id}
              <span class="active-indicator">✓</span>
            {/if}
          </button>
        {/each}
      </div>
    </div>

    <!-- LANGUAGE -->
    <div class="panel-section">
      <h3>🌐 {t('language')}</h3>
      <div class="lang-list">
        {#each languages as lng}
          <button
            class="lang-item"
            class:active={$currentLanguage === lng.id}
            on:click={() => switchLanguage(lng.id)}
          >
            <span>{lng.flag}</span>
            <span>{t('lang_' + lng.id)}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- SETTINGS -->
    <div class="panel-section">
      <h3>⚙️ {t('settings')}</h3>
      <div class="setting-row">
        <span class="setting-label">🌡️ {t('temperature_unit')}</span>
        <div class="unit-toggle">
          <button
            class="unit-btn"
            class:active={$temperatureUnit === 'celsius'}
            on:click={() => setTemperatureUnit('celsius')}
          >°C</button>
          <button
            class="unit-btn"
            class:active={$temperatureUnit === 'fahrenheit'}
            on:click={() => setTemperatureUnit('fahrenheit')}
          >°F</button>
        </div>
      </div>
    </div>

    <div class="app-version">v{APP_VERSION}</div>
  </div>
{/if}

<style>
  .app-version {
    text-align: center;
    font-size: 11px;
    color: var(--text-secondary, #8892b0);
    opacity: 0.5;
    padding: 12px 0 4px;
  }

  .theme-list {
    display: flex;
  }

  .lang-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .lang-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    border-radius: 8px;
    background: transparent;
    border: 1px solid var(--border-secondary);
    color: var(--text-primary);
    cursor: pointer;
    font-size: 14px;
    text-align: left;
    transition: all 0.2s;
  }

  .lang-item:hover {
    background: var(--bg-glass);
  }

  .lang-item.active {
    background: var(--bg-glass);
    border-color: var(--primary-color);
    color: var(--primary-color);
  }
  /* HAMBURGER BUTTON */
  .hamburger-btn {
      width: 40px;
      height: 40px;
      top: 16px;
      left: 16px;
    
    position: fixed;
   
    z-index: 999;

    /* background: var(--bg-glass); */
    background: var(--bg-primary);
    border: 1px solid var(--border-secondary);
    backdrop-filter: blur(30px);
    border: 1px solid var(--border-primary);
    box-shadow: var(--shadow-primary);
    border-radius: 12px;
    backdrop-filter: blur(20px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .hamburger-btn span {
    width: 20px;
    height: 2px;
    background: var(--text-primary);
    border-radius: 1px;
    transition: all 0.3s ease;
  }

  .hamburger-btn.active span:nth-child(1) {
    transform: rotate(45deg) translateY(6px);
  }
  .hamburger-btn.active span:nth-child(2) {
    opacity: 0;
  }
  .hamburger-btn.active span:nth-child(3) {
    transform: rotate(-45deg) translateY(-6px);
  }

  /* BACKDROP */
  .panel-backdrop {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.5);
    z-index: 998;
    backdrop-filter: blur(4px);
    /* ✅ CSS ANIMATION namiesto Svelte transition */
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* SIDE PANEL */
  .side-panel {
    position: fixed;
    top: 0;
    left: 0;
    width: 85vw;
    height: 100vh;
    background: var(--bg-primary);
    border-right: 1px solid var(--border-primary);
    box-shadow: var(--shadow-hover);
    z-index: 999;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--primary-color, #00ffff) transparent;
    padding: 0 0 80px 0;
    /* ✅ CSS ANIMATION namiesto Svelte transition */
    animation: slideInLeft 0.3s ease-out;
  }

  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
  }

  /* PANEL HEADER */
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: sticky;
    top: 0;
    z-index: 12;
    padding: 20px 16px 12px;
    background: color-mix(in srgb, var(--bg-primary) 88%, transparent);
    backdrop-filter: blur(18px);
    border-bottom: 1px solid var(--border-secondary, rgba(255,255,255,0.08));
    margin-bottom: 8px;
  }

  .panel-logo {
    display: block;
    width: min(180px, calc(100% - 52px));
    height: auto;
    flex: 0 1 auto;
    margin: 0 auto;
  }

  .panel-close {
    background: var(--bg-glass, rgba(255,255,255,0.08));
    border: 1px solid var(--border-secondary, rgba(255,255,255,0.15));
    color: var(--text-secondary, #8892b0);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .panel-close:hover {
    border-color: var(--primary-color, #00ffff);
    color: var(--primary-color, #00ffff);
  }

  /* PANEL SECTIONS */
  .panel-section {
    padding: 0 20px 24px 20px;
    border-bottom: 1px solid var(--border-secondary);
  }

  .panel-section h3 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 3px 0;
    padding: 12px 0;
    border-bottom: 2px solid var(--primary-color);
  }

  /* LAYER GRID */
  .layer-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  }

  /* LAYER ITEMS */
  .layer-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 10px 8px;
    background: transparent;
    border: 1px solid var(--border-secondary);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: var(--text-secondary);
  }

  .layer-item:hover {
    background: var(--bg-glass);
    border-color: var(--border-primary);
    color: var(--text-primary);
  }

  .layer-item.active {
    background: rgba(0,255,255,0.08);
    border-color: var(--primary-color);
    color: var(--primary-color);
    box-shadow: 0 0 10px rgba(0,255,255,0.15);
  }

  .layer-icon {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .layer-name {
    font-weight: 500;
    font-size: 11px;
    text-align: center;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }


  /* THEME ITEMS */
  .theme-item {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 12px 11px;
    background: transparent;
    border: none;
    border-radius: 12px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-primary);
  }

  /* ✅ KRUHOVÉ THEME BUTTONY */
  .theme-emoji {
    width: 36px;
    height: 36px;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  }

  .theme-item:hover .theme-emoji {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.4);
  }

  .theme-item.active .theme-emoji {
    border-color: rgba(255, 255, 255, 0.8);
    transform: scale(1.15);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }

  .active-indicator {
    font-size: 16px;
    color: var(--primary-color);
    font-weight: bold;
  }

  /* SETTINGS */
  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 0;
  }

  .setting-label {
    font-size: 14px;
    color: var(--text-primary);
    font-weight: 600;
  }

  .unit-toggle {
    display: flex;
    gap: 0;
    border: 1px solid var(--border-secondary);
    border-radius: 8px;
    overflow: hidden;
  }

  .unit-btn {
    padding: 8px 16px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .unit-btn:first-child {
    border-right: 1px solid var(--border-secondary);
  }

  .unit-btn.active {
    background: var(--primary-color);
    color: var(--bg-primary);
  }

  /* MOBILE RESPONSIVE */
  @media (max-width: 480px) {
    .hamburger-btn {
      width: 40px;
      height: 40px;
      top: 16px;
      left: 11px;
    }
  }

  /* HIDE ON DESKTOP */
  @media (min-width: 1195px) {
    .hamburger-btn {
      display: none;
    }
  }
</style>
