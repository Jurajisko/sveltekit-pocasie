<!-- src/routes/weather/[location]/+page.svelte -->
<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import WeatherCard from '$lib/components/WeatherCard.svelte';

  // Get location from URL params
  $: location = $page.params.location || '';
  
  // Search functionality
  let searchLocation = '';
  let searchInput;

  /**
   * Handle search form submission
   */
  function handleSearch(event) {
    event.preventDefault();
    
    if (!searchLocation.trim()) return;
    
    const cleanLocation = searchLocation.trim();
    searchLocation = '';
    
    // Navigate to weather page for new location
    goto(`/weather/${encodeURIComponent(cleanLocation)}`);
  }

  /**
   * Handle popular location clicks
   */
  function selectLocation(selectedLocation) {
    goto(`/weather/${encodeURIComponent(selectedLocation)}`);
  }

  // Popular Slovak cities
  const popularLocations = [
    'Bratislava',
    'Košice', 
    'Prešov',
    'Žilina',
    'Banská Bystrica',
    'Nitra',
    'Trnava',
    'Martin'
  ];

  // International cities
  const internationalCities = [
    'Praha',
    'Wien',
    'Budapest',
    'Warsaw',
    'Munich',
    'London',
    'Paris',
    'New York'
  ];

  // Focus search input on mount
  onMount(() => {
    if (searchInput) {
      searchInput.focus();
    }
  });
</script>

<svelte:head>
  <title>
    {location ? `Počasie ${location} - Weather App Pro` : 'Weather App Pro - Aktuálne počasie'}
  </title>
  <meta name="description" content="Aktuálne počasie a predpoveď pre {location || 'vašu lokalitu'}. Presné météo údaje v reálnom čase.">
</svelte:head>

<div class="weather-page">
  
  <!-- Header -->
  <header class="weather-header">
    <div class="container">
      <h1 class="app-title">
        <span class="title-icon">🌤️</span>
        Weather App Pro
      </h1>
      
      <p class="app-subtitle">
        Presné počasie v reálnom čase
      </p>
    </div>
  </header>

  <!-- Search Section -->
  <section class="search-section">
    <div class="container">
      
      <form class="search-form" on:submit={handleSearch}>
        <div class="search-input-group">
          <input
            bind:this={searchInput}
            bind:value={searchLocation}
            type="text"
            placeholder="Zadajte názov mesta..."
            class="search-input"
            autocomplete="off"
          >
          <button type="submit" class="search-btn" disabled={!searchLocation.trim()}>
            🔍 Hľadať
          </button>
        </div>
      </form>

      <!-- Quick Location Buttons -->
      {#if !location}
        <div class="quick-locations">
          
          <div class="location-group">
            <h3 class="location-group-title">🇸🇰 Slovensko</h3>
            <div class="location-buttons">
              {#each popularLocations as city}
                <button 
                  class="location-btn"
                  on:click={() => selectLocation(city)}
                >
                  {city}
                </button>
              {/each}
            </div>
          </div>

          <div class="location-group">
            <h3 class="location-group-title">🌍 Svet</h3>
            <div class="location-buttons">
              {#each internationalCities as city}
                <button 
                  class="location-btn international"
                  on:click={() => selectLocation(city)}
                >
                  {city}
                </button>
              {/each}
            </div>
          </div>

        </div>
      {/if}

    </div>
  </section>

  <!-- Weather Display -->
  <section class="weather-section">
    <div class="container">
      
      {#if location}
        <!-- Weather Card -->
        <WeatherCard 
          {location} 
          autoRefresh={true}
          refreshInterval={300000}
        />

        <!-- Back to Search -->
        <div class="back-section">
          <button class="back-btn" on:click={() => goto('/weather')}>
            ← Vyhľadať iné mesto
          </button>
        </div>

      {:else}
        <!-- Welcome Message -->
        <div class="welcome-section">
          <div class="welcome-card">
            <div class="welcome-icon">🌦️</div>
            <h2 class="welcome-title">Vitajte v Weather App Pro</h2>
            <p class="welcome-text">
              Získajte presné a aktuálne informácie o počasí pre akúkoľvek lokalitu na svete.
              Vyhľadajte svoje mesto alebo vyberte z obľúbených miest vyššie.
            </p>
            
            <div class="features">
              <div class="feature">
                <span class="feature-icon">⚡</span>
                <span>Údaje v reálnom čase</span>
              </div>
              <div class="feature">
                <span class="feature-icon">🌍</span>
                <span>Globálne pokrytie</span>
              </div>
              <div class="feature">
                <span class="feature-icon">📱</span>
                <span>Mobilné zariadenia</span>
              </div>
            </div>
          </div>
        </div>
      {/if}

    </div>
  </section>

</div>

<style>
  .weather-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
  }

  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Header */
  .weather-header {
    padding: 40px 0 20px;
    text-align: center;
    color: white;
  }

  .app-title {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }

  .title-icon {
    font-size: 3rem;
  }

  .app-subtitle {
    font-size: 1.2rem;
    opacity: 0.9;
    margin: 0;
    font-weight: 300;
  }

  /* Search Section */
  .search-section {
    padding: 20px 0 40px;
  }

  .search-form {
    margin-bottom: 40px;
  }

  .search-input-group {
    display: flex;
    gap: 12px;
    max-width: 500px;
    margin: 0 auto;
  }

  .search-input {
    flex: 1;
    padding: 16px 20px;
    border: none;
    border-radius: 25px;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    background: white;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .search-btn {
    padding: 16px 24px;
    border: none;
    border-radius: 25px;
    background: #00b894;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .search-btn:hover:not(:disabled) {
    background: #00a085;
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 184, 148, 0.3);
  }

  .search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
