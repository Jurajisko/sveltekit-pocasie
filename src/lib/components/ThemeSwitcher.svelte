<!-- src/lib/components/ThemeSwitcher.svelte -->
<script>
  import { onMount } from 'svelte';
  import { currentLanguage, switchLanguage } from '$lib/stores/language.js';

  const languages = [
    { id: 'sk', flag: '🇸🇰' },
    { id: 'en', flag: '🇬🇧' },
    { id: 'de', flag: '🇩🇪' }
  ];
  
  let currentTheme = 'cyan';
  let isBrowser = false;
  
  const themes = [
    { id: 'cyan', name: 'Cyberpunk Teal', color: 'linear-gradient(135deg, #00ffff, #00c8ff)', emoji: '🌊' },
    { id: 'purple', name: 'Purple Deep', color: 'linear-gradient(135deg, #a855f7, #c084fc)', emoji: '🔮' },
    { id: 'emerald', name: 'Emerald Green', color: 'linear-gradient(135deg, #10b981, #34d399)', emoji: '🌿' },
    { id: 'orange', name: 'Orange Sunset', color: 'linear-gradient(135deg, #f97316, #fb923c)', emoji: '🔥' },
    { id: 'blue', name: 'Blue Classic', color: 'linear-gradient(135deg, #3b82f6, #60a5fa)', emoji: '💙' }
  ];
  
  function switchTheme(themeId) {
    currentTheme = themeId;
    
    if (isBrowser && typeof document !== 'undefined') {
      if (themeId === 'cyan') {
        document.documentElement.removeAttribute('data-theme');
      } else {
        document.documentElement.setAttribute('data-theme', themeId);
      }
      
      // Save to localStorage
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('weather-app-theme', themeId);
      }
      
      // Trigger custom event for other components
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme: themeId } 
        }));
      }
    }
  }
  
  onMount(() => {
    // Check if we're in browser
    isBrowser = typeof window !== 'undefined';
    
    if (isBrowser) {
      // Load saved theme
      const savedTheme = localStorage?.getItem('weather-app-theme') || 'cyan';
      switchTheme(savedTheme);
    }
  });
</script>

<div class="theme-switcher">
  <div class="theme-label">🎨</div>

  {#each themes as theme}
    <button
      class="theme-btn"
      class:active={currentTheme === theme.id}
      style="background: {theme.color}"
      title={theme.name}
      on:click={() => switchTheme(theme.id)}
    >
      <span class="theme-emoji">{theme.emoji}</span>
    </button>
  {/each}

  <div class="separator"></div>

  {#each languages as lng}
    <button
      class="lang-btn"
      class:active={$currentLanguage === lng.id}
      title={lng.id.toUpperCase()}
      on:click={() => switchLanguage(lng.id)}
    >
      {lng.flag}
    </button>
  {/each}
</div>

<style>
  .theme-switcher {
    position: fixed;
    top: 20px;
    right: 55px;
    z-index: 1000;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-glass, rgba(26, 35, 50, 0.95));
    backdrop-filter: blur(20px);
    padding: 12px 16px;
    border-radius: 20px;
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    box-shadow: var(--shadow-primary, 0 8px 32px rgba(0, 0, 0, 0.3));
    transition: all 0.3s ease;
  }
  
  .theme-switcher:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-hover, 0 12px 48px rgba(0, 0, 0, 0.4));
  }
  
  .theme-label {
    font-size: 16px;
    margin-right: 4px;
    color: var(--text-secondary, #8892b0);
  }
  
  .theme-btn {
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
  
  .theme-btn:hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.4);
  }
  
  .theme-btn.active {
    border-color: rgba(255, 255, 255, 0.8);
    transform: scale(1.15);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
  }
  
  .theme-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    padding: 2px;
    background: var(--gradient-1, linear-gradient(135deg, #00ffff, #00c8ff));
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    opacity: 0;
    transition: opacity 0.3s ease;
  }
  
  .theme-btn.active::before {
    opacity: 1;
  }
  
  .theme-emoji {
    position: relative;
    z-index: 1;
    filter: drop-shadow(0 0 4px rgba(0, 0, 0, 0.5));
  }
  
  .separator {
    width: 1px;
    height: 24px;
    background: var(--border-secondary, rgba(255,255,255,0.2));
    margin: 0 4px;
  }

  .lang-btn {
    width: 36px;
    height: 36px;
    border: 2px solid transparent;
    border-radius: 50%;
    cursor: pointer;
    background: var(--bg-glass, rgba(255,255,255,0.05));
    font-size: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }

  .lang-btn:hover {
    transform: scale(1.1);
    background: var(--bg-glass-hover, rgba(255,255,255,0.1));
  }

  .lang-btn.active {
    border-color: rgba(255, 255, 255, 0.8);
    transform: scale(1.15);
    box-shadow: 0 0 12px rgba(255, 255, 255, 0.2);
  }

  /* Responsive */
  @media (max-width: 1195px) {
    .theme-switcher {
      top: 10px;
      right: 10px;
      padding: 8px 12px;
      gap: 6px;
    }
    
    .theme-btn {
      width: 32px;
      height: 32px;
      font-size: 12px;
    }
    
    .theme-label {
      font-size: 14px;
    }
  }
  
  @media (max-width: 480px) {
    .theme-switcher {
      padding: 6px 10px;
      gap: 4px;
    }
    
    .theme-btn {
      width: 28px;
      height: 28px;
      font-size: 11px;
    }
  }
</style>