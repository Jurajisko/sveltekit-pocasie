<script>
  import { onMount } from 'svelte';
  import { i18n } from '$lib/i18n/index.js';
  import { currentLanguage, switchLanguage } from '$lib/stores/language.js';

  $: t = $i18n;

  const languages = [
    { id: 'sk', flag: '🇸🇰' },
    { id: 'en', flag: '🇬🇧' },
    { id: 'de', flag: '🇩🇪' }
  ];

  // Props
  export let isOpen = false;
  export let activeLayer = 'wind';
  export let currentTheme = 'cyan';
  export let onLayerChange = () => {};
  export let onThemeChange = () => {};
  
  // Data - ROVNAKÉ ako predtým
  const weatherLayers = [
    { id: 'precipitation', key: 'precipitation', icon: '🌧️' },
    { id: 'temperature', key: 'temperature', icon: '🌡️' },
    { id: 'wind', key: 'wind', icon: '💨' },
    { id: 'pressure', key: 'pressure', icon: '📊' },
    { id: 'radar', key: 'radar', icon: '📡' }
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
      <svg class="panel-logo" width="130" height="40" viewBox="0 0 180 56" xmlns="http://www.w3.org/2000/svg">
        <style>
          /* ── Striedanie skupín: 9s cyklus ─────────────────
             0–3s   D1 viditeľné
             3–4s   prechod D1→Combo
             4–7s   Combo viditeľné
             7–8s   prechod Combo→D1
             8–9s   D1 viditeľné (loop)
          ─────────────────────────────────────────────── */
          @keyframes mz-show-d1 {
            0%   { opacity: 1; }
            33%  { opacity: 1; }
            44%  { opacity: 0; }
            78%  { opacity: 0; }
            89%  { opacity: 1; }
            100% { opacity: 1; }
          }
          @keyframes mz-show-combo {
            0%   { opacity: 0; }
            33%  { opacity: 0; }
            44%  { opacity: 1; }
            78%  { opacity: 1; }
            89%  { opacity: 0; }
            100% { opacity: 0; }
          }
          /* ── Radar ping (pre Combo skupinu) ───────────── */
          @keyframes mz-ping-out {
            0%   { opacity: 0;    }
            10%  { opacity: 1;    }
            60%  { opacity: 0.25; }
            100% { opacity: 0;    }
          }
          /* ── Dot beat (vždy) ──────────────────────────── */
          @keyframes mz-dot-beat {
            0%, 100% { opacity: 1;   }
            40%      { opacity: 0.4; }
          }
          /* ── Wind draw (pre Combo skupinu) ───────────── */
          @keyframes mz-wind-draw {
            0%   { stroke-dashoffset: 65; opacity: 0;   }
            15%  { opacity: 0.9; }
            70%  { stroke-dashoffset: 0;  opacity: 0.9; }
            90%  { opacity: 0;   }
            100% { stroke-dashoffset: 0;  opacity: 0;   }
          }

          .mz-d1    { animation: mz-show-d1    9s ease-in-out infinite; }
          .mz-combo { animation: mz-show-combo 9s ease-in-out infinite; }

          .mz-arc-ping1 { animation: mz-ping-out 2.4s ease-out infinite 0.4s; }
          .mz-arc-ping2 { animation: mz-ping-out 2.4s ease-out infinite 0.2s; }
          .mz-arc-ping3 { animation: mz-ping-out 2.4s ease-out infinite 0s;   }

          .mz-dot { animation: mz-dot-beat 2.4s ease-in-out infinite; }

          .mz-w1  { stroke-dasharray: 65; animation: mz-wind-draw 2.4s ease-in-out infinite 0s;    }
          .mz-w2  { stroke-dasharray: 60; animation: mz-wind-draw 2.4s ease-in-out infinite 0.28s; }
        </style>

        <!-- ── D1: dažďové kvapky + statický radar ─────── -->
        <g class="mz-d1">
          <line x1="14" y1="7"  x2="11" y2="17" stroke="var(--primary-color)" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
          <line x1="24" y1="4"  x2="21" y2="14" stroke="var(--primary-color)" stroke-width="2.2" stroke-linecap="round" opacity="0.9"/>
          <line x1="34" y1="7"  x2="31" y2="17" stroke="var(--primary-color)" stroke-width="2.2" stroke-linecap="round" opacity="0.55"/>
          <path d="M22 46 A20 20 0 0 1 42 26" fill="none" stroke="var(--primary-color)" stroke-width="2.8" stroke-linecap="round" opacity="0.28"/>
          <path d="M22 46 A13 13 0 0 1 35 33" fill="none" stroke="var(--primary-color)" stroke-width="2.8" stroke-linecap="round" opacity="0.6"/>
          <path d="M22 46 A6  6  0 0 1 28 40" fill="none" stroke="var(--primary-color)" stroke-width="2.8" stroke-linecap="round" opacity="1"/>
        </g>

        <!-- ── Combo: vietor + pulzujúci radar ──────────── -->
        <g class="mz-combo">
          <path class="mz-w1" d="M8 10 Q19 3 30 10 Q40 17 50 10" fill="none" stroke="var(--primary-color)" stroke-width="2.8" stroke-linecap="round"/>
          <path class="mz-w2" d="M8 20 Q21 13 33 20 Q43 27 52 19" fill="none" stroke="var(--primary-color)" stroke-width="2.2" stroke-linecap="round"/>
          <path class="mz-arc-ping1" d="M22 46 A20 20 0 0 1 42 26" fill="none" stroke="var(--primary-color)" stroke-width="2.8" stroke-linecap="round"/>
          <path class="mz-arc-ping2" d="M22 46 A13 13 0 0 1 35 33" fill="none" stroke="var(--primary-color)" stroke-width="2.8" stroke-linecap="round"/>
          <path class="mz-arc-ping3" d="M22 46 A6  6  0 0 1 28 40" fill="none" stroke="var(--primary-color)" stroke-width="2.8" stroke-linecap="round"/>
        </g>

        <!-- ── Vždy viditeľné ────────────────────────────── -->
        <circle class="mz-dot" cx="22" cy="46" r="3.5" fill="var(--primary-color)"/>
        <text x="62" y="26" font-family="Segoe UI,system-ui" font-weight="700" font-size="20" fill="var(--text-primary, #fff)" letter-spacing="0.5">Meteo</text>
        <text x="62" y="49" font-family="Segoe UI,system-ui" font-weight="700" font-size="20" fill="var(--primary-color)" letter-spacing="0.5">Zoomy</text>
      </svg>
      <button class="panel-close" on:click={closePanel}>✕</button>
    </div>

    <!-- WEATHER LAYERS -->
    <div class="panel-section">
      <h3>🌤️ {t('layers')}</h3>

      {#each weatherLayers as layer}
        <button
          class="layer-item"
          class:active={activeLayer === layer.id}
          on:click={() => handleLayerSelect(layer.id)}
        >
          <span class="layer-icon">{layer.icon}</span>
          <span class="layer-name">{t(layer.key)}</span>
          <span class="layer-indicator">
            {activeLayer === layer.id ? '●' : '○'}
          </span>
        </button>
      {/each}
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
  </div>
{/if}

<style>
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
    padding: 30px 0 20px 0;
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
    padding: 16px 16px 8px;
    border-bottom: 1px solid var(--border-secondary, rgba(255,255,255,0.08));
    margin-bottom: 8px;
  }

  .panel-logo {
    display: block;
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
    margin: 0 0 16px 0;
    padding: 12px 0;
    border-bottom: 2px solid var(--primary-color);
  }

  /* LAYER ITEMS */
  .layer-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: transparent;
    border: 1px solid var(--border-secondary);
    border-radius: 12px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    color: var(--text-primary);
  }

  .layer-item:hover {
    background: var(--bg-glass);
    border-color: var(--border-primary);
    transform: translateX(4px);
  }

  .layer-item.active {
    background: var(--gradient-2);
    border-color: var(--primary-color);
    box-shadow: 0 4px 12px var(--shadow-primary);
  }

  .layer-icon {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  .layer-name {
    flex: 1;
    font-weight: 600;
    font-size: 14px;
  }

  .layer-indicator {
    font-size: 16px;
    color: var(--primary-color);
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

  /* MOBILE RESPONSIVE */
  @media (max-width: 480px) {
    .hamburger-btn {
      width: 40px;
      height: 40px;
      top: 16px;
      left: 16px;
    }
  }

  /* HIDE ON DESKTOP */
  @media (min-width: 1195px) {
    .hamburger-btn {
      display: none;
    }
  }
</style>