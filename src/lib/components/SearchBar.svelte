<!-- src/lib/components/SearchBar.svelte -->
<script>
  import { createEventDispatcher } from 'svelte';
 
  const dispatch = createEventDispatcher();
 
  // Props
  export let apiKey = import.meta.env.VITE_MAPTILER_KEY;
  export let placeholder = "Hľadaj miesto...";
  export let value = ''; // Readonly z parent
 
  // Internal state
  let searchQuery = value;
  let suggestions = [];
  let searchInput;
 
  $: searchQuery = value;
 
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
        <li on:click={() => selectLocation(suggestion)} on:keydown={(e) => e.key === 'Enter' && selectLocation(suggestion)} role="option" tabindex="0" aria-selected="false">
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
    background: var(--primary-color);
    border: 1px solid var(--secondary-color);
    color: var(--bg-secondary);
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

  /* 📋 SUGGESTIONS DROPDOWN */
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
  
  /* ♿ ACCESSIBILITY */
  @media (prefers-reduced-motion: reduce) {
    .autocomplete-list li {
      transition: none;
    }
  }
</style>