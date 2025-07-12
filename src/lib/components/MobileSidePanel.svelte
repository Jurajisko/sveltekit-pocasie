<script>
  import { onMount } from 'svelte';
  
  // Props
  export let isOpen = false;
  export let activeLayer = 'wind';
  export let currentTheme = 'cyan';
  export let onLayerChange = () => {};
  export let onThemeChange = () => {};
  
  // Data - ROVNAKÉ ako predtým
  const weatherLayers = [
    { id: 'precipitation', name: 'Zrážky', icon: '🌧️' },
    { id: 'temperature', name: 'Teplota', icon: '🌡️' },
    { id: 'wind', name: 'Vietor', icon: '💨' },
    { id: 'pressure', name: 'Tlak', icon: '📊' },
    { id: 'radar', name: 'Radar', icon: '📡' }
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
  ></div>
{/if}

<!-- SIDE PANEL - ✅ BEZ transition, ale s CSS animation -->
{#if isOpen}
  <div class="side-panel">
    <!-- WEATHER LAYERS -->
    <div class="panel-section">
      <h3>🌤️ Weather Layers</h3>
      
      {#each weatherLayers as layer}
        <button 
          class="layer-item"
          class:active={activeLayer === layer.id}
          on:click={() => handleLayerSelect(layer.id)}
        >
          <span class="layer-icon">{layer.icon}</span>
          <span class="layer-name">{layer.name}</span>
          <span class="layer-indicator">
            {activeLayer === layer.id ? '●' : '○'}
          </span>
        </button>
      {/each}
    </div>
    
    <!-- THEMES -->
    <div class="panel-section">
      <h3>🎨 Témy</h3>
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
  </div>
{/if}

<style>
  .theme-list {
    display: flex;
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
    padding: 60px 0 20px 0;
    /* ✅ CSS ANIMATION namiesto Svelte transition */
    animation: slideInLeft 0.3s ease-out;
  }

  @keyframes slideInLeft {
    from { transform: translateX(-100%); }
    to { transform: translateX(0); }
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

  .theme-name {
    flex: 1;
    font-weight: 600;
    font-size: 14px;
    text-align: left;
  }

  .active-indicator {
    font-size: 16px;
    color: var(--primary-color);
    font-weight: bold;
  }

  /* MOBILE RESPONSIVE */
  @media (max-width: 480px) {
    /* .side-panel {
      width: 260px;
    } */
    
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