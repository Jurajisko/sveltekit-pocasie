<!-- src/routes/weather/+page.svelte -->
<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let searchLocation = '';
  let searchInput;

  /**
   * Handle search form submission
   */
  function handleSearch(event) {
    event.preventDefault();
    
    if (!searchLocation.trim()) return;
    
    const cleanLocation = searchLocation.trim();
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
  <title>Vyhľadať počasie - Weather App Pro</title>
  <meta name="description" content="Vyhľadajte aktuálne počasie pre akúkoľvek lokalitu na svete. Presné météo údaje v reálnom čase.">
</svelte:head>

<div class="weather-search-page">
  
  <!-- Header -->
  <header class="weather-header">
    <div class="container">
      <h1 class="app-title">
        <span class="title-icon">🌤️</span>
        Weather Search
      </h1>
      
      <p class="app-subtitle">
        Vyhľadajte počasie pre akúkoľvek mesto
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

      <!-- Back to Home -->
      <div class="back-section">
        <a href="/" class="back-link">
          ← Späť na hlavnú stránku
        </a>
      </div>

    </div>
  </section>

</div>

<style>
  .weather-search-page {
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
    padding: 60px 0 40px;
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
    padding: 20px 0 60px;
  }

  .search-form {
    margin-bottom: 50px;
  }

  .search-input-group {
    display: flex;
    gap: 12px;
    max-width: 500px;
    margin: 0 auto;
  }

  .search-input {
    flex: 1;
    padding: 18px 24px;
    border: none;
    border-radius: 25px;
    font-size: 1.1rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    background: white;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .search-btn {
    padding: 18px 28px;
    border: none;
    border-radius: 25px;
    background: #00b894;
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
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
  }

  /* Quick Locations */
  .quick-locations {
    display: flex;
    flex-direction: column;
    gap: 32px;
    margin-bottom: 50px;
  }

  .location-group {
    text-align: center;
  }

  .location-group-title {
    color: white;
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 16px;
    opacity: 0.9;
  }

  .location-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: center;
  }

  .location-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .location-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
  }

  .location-btn.international {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.15);
  }

  /* Back Section */
  .back-section {
    text-align: center;
  }

  .back-link {
    color: white;
    text-decoration: none;
    font-weight: 500;
    padding: 12px 24px;
    border-radius: 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    transition: all 0.3s ease;
    display: inline-block;
  }

  .back-link:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .app-title {
      font-size: 2rem;
      flex-direction: column;
      gap: 8px;
    }

    .title-icon {
      font-size: 2.5rem;
    }

    .search-input-group {
      flex-direction: column;
      gap: 16px;
    }

    .location-buttons {
      gap: 8px;
    }

    .location-btn {
      padding: 10px 16px;
      font-size: 0.9rem;
    }

    .quick-locations {
      gap: 24px;
    }
  }

  @media (max-width: 480px) {
    .container {
      padding: 0 16px;
    }

    .weather-header {
      padding: 40px 0 30px;
    }

    .app-title {
      font-size: 1.8rem;
    }

    .search-input, .search-btn {
      padding: 16px 20px;
      font-size: 1rem;
    }

    .location-btn {
      padding: 8px 12px;
      font-size: 0.85rem;
    }
  }
</style>
