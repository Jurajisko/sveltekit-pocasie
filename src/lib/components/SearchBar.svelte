<!-- src/lib/components/SearchBar.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
 
  const dispatch = createEventDispatcher();
 
  // Props
  export let apiKey = "ry26WCBx6tt715jhxPwh";
  export let placeholder = "Hľadaj miesto...";
  export let value = ''; // Readonly z parent
 
  // Internal state
  let searchQuery = value;
  let suggestions = [];
  let searchInput;
 
  // ✅ SPRÁVNE: Len sync Z parent DO child (nie opačne)
  $: searchQuery = value;
 
  // ❌ ODSTRÁŇ TENTO RIADOK:
  // $: value = searchQuery;  // <-- TOTO SPÔSOBUJE CYKLUS!
 
  // Debounce timer
  let debounceTimer;
 
  // Handle search input
  async function handleSearchInput() {
    // ✅ PRIDAJ: Dispatch zmenu hodnoty parent komponente
    dispatch('input', searchQuery);
   
    clearTimeout(debounceTimer);
   
    if (searchQuery.length < 3) {
      suggestions = [];
      return;
    }
    
    debounceTimer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://api.maptiler.com/geocoding/${encodeURIComponent(searchQuery)}.json?key=${apiKey}&limit=5&language=sk`
        );
        const data = await res.json();
        suggestions = data.features || [];
      } catch (error) {
        console.error('Search error:', error);
        suggestions = [];
      }
    }, 300);
  }
 
  // Handle location selection
  function selectLocation(suggestion) {
    searchQuery = suggestion.place_name || 'Vybraná lokácia';
    suggestions = [];
   
    // ✅ DISPATCH oba eventy
    dispatch('input', searchQuery);           // Pre sync value
    dispatch('locationSelected', suggestion); // Pre location logic
  }
 
  // Handle keyboard events
  function handleKeydown(e) {
    if (e.key === 'Enter' && suggestions[0]) {
      selectLocation(suggestions[0]);
    }
    if (e.key === 'Escape') {
      suggestions = [];
      searchInput?.blur();
    }
  }
 
  // Clear search
  function clearSearch() {
    searchQuery = '';
    suggestions = [];
    searchInput?.focus();
    
    // ✅ DISPATCH clear event
    dispatch('input', '');
  }
</script>

<!-- Zvyšok kódu zostáva rovnaký -->
<div id="maptiler-search">
  <div>
    <input
      bind:this={searchInput}
      type="text"
      {placeholder}
      bind:value={searchQuery}
      on:input={handleSearchInput}
      on:keydown={handleKeydown}
    />
   
    {#if searchQuery.length > 0}
      <button class="search-clear-btn" on:click={clearSearch} title="Vymazať">
        ✕
      </button>
    {/if}
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

<style>
  /* 🎨 POUŽÍVAME TVOJE EXISTUJÚCE ŠTÝLY Z app.css */
  /* Len pridávame clear button */
  
  .search-clear-btn {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: var(--bg-glass, rgba(255, 255, 255, 0.1));
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    color: var(--text-secondary, #8892b0);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.3s ease;
    z-index: 2;
  }
  
  .search-clear-btn:hover {
    background: var(--bg-glass-hover, rgba(255, 255, 255, 0.2));
    border-color: var(--primary-color, #00ffff);
    color: var(--primary-color, #00ffff);
    transform: translateY(-50%) scale(1.1);
  }
  
  /* Adjust input padding for clear button */
  :global(#maptiler-search input) {
    padding-right: 45px !important;
  }

  /* ===== ELEGANT SEARCH STYLES ===== */
  .elegant-search-container {
    z-index: 99;
    position: absolute;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 400px;
    max-width: 90vw;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  .search-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
    
    /* 🎨 TVOJ PÔVODNÝ ELEGANTNÝ MATNÝ DIZAJN */
    background: var(--bg-primary, rgba(26, 35, 50, 0.95));
    backdrop-filter: blur(30px);
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    border-radius: 16px;
    box-shadow: var(--shadow-primary, 0 8px 32px rgba(0, 0, 0, 0.3));
    
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
  }
  
  /* 🌟 HOVER STATE - jemné theme podsvietenie */
  .search-input-wrapper:hover {
    box-shadow: var(--shadow-hover, 0 12px 48px rgba(0, 255, 255, 0.2));
    border-color: var(--border-primary, rgba(0, 255, 255, 0.3));
    transform: translateY(-2px);
  }
  
  /* ✨ FOCUS STATE - elegantné theme zvýraznenie */
  .search-input-wrapper:focus-within {
    box-shadow: var(--shadow-hover, 0 12px 48px rgba(0, 255, 255, 0.3));
    border-color: var(--primary-color, #00ffff);
    transform: translateY(-2px);
  }
  
  /* 🔍 SEARCH ICON - dark theme */
  .search-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 18px;
    color: var(--text-secondary, #8892b0);
    transition: all 0.3s ease;
    pointer-events: none;
  }
  
  .search-input-wrapper:focus-within .search-icon {
    color: var(--primary-color, #00ffff);
    transform: scale(1.1);
    filter: drop-shadow(0 0 8px var(--primary-color, rgba(0, 255, 255, 0.5)));
  }
  
  /* 📝 INPUT FIELD - dark theme */
  .search-input {
    flex: 1;
    padding: 16px 8px 16px 0;
    border: none;
    background: transparent;
    font-size: 16px;
    color: var(--text-primary, #ffffff);
    outline: none;
    font-family: inherit;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .search-input::placeholder {
    color: var(--text-secondary, #8892b0);
    font-weight: 400;
    transition: all 0.3s ease;
  }
  
  .search-input:focus::placeholder {
    color: var(--text-muted, rgba(136, 146, 176, 0.6));
    transform: translateX(2px);
  }
  
  /* ❌ CLEAR BUTTON - dark theme */
  .clear-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    margin-right: 12px;
    background: var(--bg-glass, rgba(255, 255, 255, 0.1));
    border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    border-radius: 50%;
    color: var(--text-secondary, #8892b0);
    cursor: pointer;
    transition: all 0.3s ease;
    width: 26px;
    height: 26px;
  }
  
  .clear-button:hover {
    background: var(--bg-glass-hover, rgba(255, 255, 255, 0.2));
    color: var(--primary-color, #00ffff);
    transform: scale(1.1);
    border-color: var(--primary-color, #00ffff);
  }
  
  /* 📋 SUGGESTIONS DROPDOWN - tvoj pôvodný dark dizajn */
  .autocomplete-list {
    list-style: none;
    padding: 0;
    margin: 0;
    background: var(--bg-primary, rgba(26, 35, 50, 0.95));
    backdrop-filter: blur(30px);
    border-radius: 0 0 16px 16px;
    box-shadow: var(--shadow-primary, 0 8px 32px rgba(0, 0, 0, 0.3));
    max-height: 300px;
    overflow-y: auto;
    border-top: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    margin-top: 2px;
    
    /* 🎨 JEMNÉ THEME-AWARE ZVÝRAZNENIE */
    border-left: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    border-right: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
    border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
  }
  
  .autocomplete-list li {
    padding: 12px 20px;
    color: var(--text-primary, #ffffff);
    cursor: pointer;
    transition: all 0.2s ease;
    border-bottom: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.1));
    font-family: inherit;
    font-size: 14px;
    position: relative;
  }
  
  .autocomplete-list li:hover {
    background: var(--bg-glass, rgba(0, 255, 255, 0.1));
    padding-left: 24px; /* Subtle slide effect */
    
    /* 🌟 JEMNÝ THEME ACCENT */
    border-left: 3px solid var(--primary-color, #00ffff);
  }
  
  .autocomplete-list li:last-child {
    border-bottom: none;
  }
  
  /* 📱 RESPONSIVE DESIGN */
  @media (max-width: 768px) {
    .elegant-search-container {
      top: 10px;
      width: 95vw;
    }
    
    .search-input {
      padding: 14px 8px 14px 0;
      font-size: 16px; /* Prevent zoom on iOS */
    }
    
    .search-icon {
      padding: 0 14px;
    }
  }
  
  @media (max-width: 480px) {
    .search-input::placeholder {
      font-size: 14px;
    }
    
    .clear-button {
      width: 24px;
      height: 24px;
      margin-right: 10px;
    }
  }
  
  /* 🎨 ODSTRÁŇ LIGHT MODE STYLES - používame len dark theme */
  /* @media (prefers-color-scheme: dark) { ... } - ODSTRÁNENÉ */
  
  /* 🎭 EXPLICIT THEME CLASSES (pre tvoje témy) */
  :global([data-theme="purple"]) .search-input-wrapper:focus-within {
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.2),
      0 0 0 2px var(--primary-color, #a855f7),
      0 0 20px var(--primary-color, rgba(168, 85, 247, 0.3));
  }
  
  :global([data-theme="emerald"]) .search-input-wrapper:focus-within {
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.2),
      0 0 0 2px var(--primary-color, #10b981),
      0 0 20px var(--primary-color, rgba(16, 185, 129, 0.3));
  }
  
  :global([data-theme="orange"]) .search-input-wrapper:focus-within {
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.2),
      0 0 0 2px var(--primary-color, #f97316),
      0 0 20px var(--primary-color, rgba(249, 115, 22, 0.3));
  }
  
  :global([data-theme="blue"]) .search-input-wrapper:focus-within {
    box-shadow: 
      0 12px 40px rgba(0, 0, 0, 0.2),
      0 0 0 2px var(--primary-color, #3b82f6),
      0 0 20px var(--primary-color, rgba(59, 130, 246, 0.3));
  }
  
  /* ♿ ACCESSIBILITY */
  @media (prefers-reduced-motion: reduce) {
    .search-input-wrapper,
    .search-icon,
    .clear-button,
    .autocomplete-list li {
      transition: none;
    }
  }
  
  .search-input:focus {
    outline: none; /* Custom focus styling applied via wrapper */
  }
  
  .clear-button:focus {
    outline: 2px solid var(--primary-color, #00ffff);
    outline-offset: 2px;
  }
</style>