<!-- src/routes/+page.svelte -->
<script>
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let searchLocation = '';

  /**
   * Handle quick weather search
   */
  function handleQuickSearch(event) {
    event.preventDefault();
    
    if (!searchLocation.trim()) return;
    
    const cleanLocation = searchLocation.trim();
    goto(`/weather/${encodeURIComponent(cleanLocation)}`);
  }

  /**
   * Navigate to weather app
   */
  function goToWeatherApp() {
    goto('/weather');
  }

  /**
   * Navigate to specific city
   */
  function goToCity(city) {
    goto(`/weather/${encodeURIComponent(city)}`);
  }
</script>

<svelte:head>
  <title>Weather App Pro - Presné počasie v reálnom čase</title>
  <meta name="description" content="Weather App Pro poskytuje presné a aktuálne informácie o počasí pre akúkoľvek lokalitu na svete. Získajte météo údaje v reálnom čase.">
  <meta name="keywords" content="počasie, weather, predpoveď, slovensko, météo">
</svelte:head>

<div class="homepage">
  
  <!-- Hero Section -->
  <section class="hero">
    <div class="hero-background">
      <div class="clouds"></div>
    </div>
    
    <div class="container">
      <div class="hero-content">
        
        <!-- Logo & Title -->
        <div class="hero-header">
          <div class="hero-icon">🌤️</div>
          <h1 class="hero-title">Weather App Pro</h1>
          <p class="hero-subtitle">
            Presné počasie v reálnom čase pre akúkoľvek lokalitu na svete
          </p>
        </div>

        <!-- Quick Search -->
        <div class="hero-search">
          <form class="search-form" on:submit={handleQuickSearch}>
            <div class="search-input-group">
              <input
                bind:value={searchLocation}
                type="text"
                placeholder="Zadajte názov mesta..."
                class="search-input"
                autocomplete="off"
              >
              <button type="submit" class="search-btn" disabled={!searchLocation.trim()}>
                🔍 Počasie
              </button>
            </div>
          </form>
          
          <p class="search-hint">
            Napríklad: Bratislava, Prague, London, New York
          </p>
        </div>

        <!-- Popular Cities -->
        <div class="popular-cities">
          <p class="popular-title">Obľúbené mestá:</p>
          <div class="city-buttons">
            <button class="city-btn" on:click={() => goToCity('Bratislava')}>
              🇸🇰 Bratislava
            </button>
            <button class="city-btn" on:click={() => goToCity('Praha')}>
              🇨🇿 Praha
            </button>
            <button class="city-btn" on:click={() => goToCity('Wien')}>
              🇦🇹 Wien
            </button>
            <button class="city-btn" on:click={() => goToCity('London')}>
              🇬🇧 London
            </button>
          </div>
        </div>

        <!-- CTA Button -->
        <div class="hero-cta">
          <button class="cta-btn" on:click={goToWeatherApp}>
            Začať používať Weather App
          </button>
        </div>

      </div>
    </div>
  </section>

  <!-- Features Section -->
  <section class="features">
    <div class="container">
      
      <h2 class="section-title">Prečo Weather App Pro?</h2>
      
      <div class="features-grid">
        
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <h3 class="feature-title">Rýchle a presné</h3>
          <p class="feature-description">
            Údaje v reálnom čase z profesionálnych meteorologických staníc po celom svete.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🌍</div>
          <h3 class="feature-title">Globálne pokrytie</h3>
          <p class="feature-description">
            Počasie pre akúkoľvek lokalitu - od malých dedín po veľkomestá na všetkých kontinentoch.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <h3 class="feature-title">Mobilné zariadenia</h3>
          <p class="feature-description">
            Optimalizované pre telefóny a tablety. Získajte počasie kdekoľvek a kedykoľvek.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🎯</div>
          <h3 class="feature-title">Detailné informácie</h3>
          <p class="feature-description">
            Teplota, vlhkosť, vietor, viditeľnosť, oblačnosť a mnoho ďalších parametrov.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🔄</div>
          <h3 class="feature-title">Automatické aktualizácie</h3>
          <p class="feature-description">
            Počasie sa aktualizuje automaticky, takže máte vždy najnovšie informácie.
          </p>
        </div>

        <div class="feature-card">
          <div class="feature-icon">🎨</div>
          <h3 class="feature-title">Prehľadný dizajn</h3>
          <p class="feature-description">
            Moderné a intuitívne rozhranie, ktoré je jednoduché na používanie pre každého.
          </p>
        </div>

      </div>
    </div>
  </section>

  <!-- Demo Section -->
  <section class="demo">
    <div class="container">
      
      <h2 class="section-title">Vyskúšajte si to</h2>
      
      <div class="demo-content">
        <div class="demo-text">
          <h3>Jednoduché používanie</h3>
          <p>
            Stačí zadať názov mesta a okamžite získate aktuálne počasie. 
            Žiadne registrácie, žiadne komplikácie.
          </p>
          
          <div class="demo-steps">
            <div class="step">
              <span class="step-number">1</span>
              <span>Zadajte názov mesta</span>
            </div>
            <div class="step">
              <span class="step-number">2</span>
              <span>Kliknite na "Počasie"</span>
            </div>
            <div class="step">
              <span class="step-number">3</span>
              <span>Získajte aktuálne údaje</span>
            </div>
          </div>
        </div>

        <div class="demo-preview">
          <div class="mock-weather-card">
            <div class="mock-header">
              <span>📍 Bratislava</span>
              <span>🔄</span>
            </div>
            <div class="mock-main">
              <div class="mock-icon">☀️</div>
              <div class="mock-temp">23°C</div>
            </div>
            <div class="mock-desc">Jasno, slnečno</div>
            <div class="mock-details">
              <div>💧 45%</div>
              <div>💨 2.1 m/s</div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </section>

  <!-- Footer -->
  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        
        <div class="footer-brand">
          <div class="footer-logo">🌤️ Weather App Pro</div>
          <p class="footer-tagline">Presné počasie pre každého</p>
        </div>

        <div class="footer-links">
          <a href="/weather" class="footer-link">Počasie</a>
          <span class="footer-separator">•</span>
          <span class="footer-text">Powered by Tomorrow.io</span>
        </div>

      </div>
    </div>
  </footer>

</div>

<style>
  .homepage {
    min-height: 100vh;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  /* Hero Section */
  .hero {
    position: relative;
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    overflow: hidden;
  }

  .hero-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .clouds {
    position: absolute;
    top: 20%;
    left: -20%;
    right: -20%;
    height: 200px;
    background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 20'%3E%3Cpath d='M0 20h100V0H0z' fill='none'/%3E%3Cpath d='M15 10c0-3 2-5 5-5s5 2 5 5h5c3 0 5 2 5 5H10c0-3 2-5 5-5z' fill='rgba(255,255,255,0.1)'/%3E%3C/svg%3E") repeat-x;
    animation: float 20s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { transform: translateX(0) translateY(0); }
    25% { transform: translateX(10px) translateY(-5px); }
    50% { transform: translateX(-5px) translateY(10px); }
    75% { transform: translateX(-10px) translateY(-5px); }
  }

  .hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    color: white;
    width: 100%;
  }

  .hero-header {
    margin-bottom: 48px;
  }

  .hero-icon {
    font-size: 5rem;
    margin-bottom: 24px;
    animation: bounce 2s ease-in-out infinite;
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-20px); }
    60% { transform: translateY(-10px); }
  }

  .hero-title {
    font-size: 3.5rem;
    font-weight: 700;
    margin: 0 0 20px;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  }

  .hero-subtitle {
    font-size: 1.3rem;
    opacity: 0.9;
    margin: 0;
    font-weight: 300;
    max-width: 600px;
    margin: 0 auto;
    line-height: 1.5;
  }

  .hero-search {
    margin-bottom: 40px;
  }

  .search-form {
    margin-bottom: 16px;
  }

  .search-input-group {
    display: flex;
    gap: 16px;
    max-width: 500px;
    margin: 0 auto;
  }

  .search-input {
    flex: 1;
    padding: 18px 24px;
    border: none;
    border-radius: 30px;
    font-size: 1.1rem;
    background: rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    background: white;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }

  .search-btn {
    padding: 18px 32px;
    border: none;
    border-radius: 30px;
    background: #00b894;
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 8px 32px rgba(0, 184, 148, 0.3);
  }

  .search-btn:hover:not(:disabled) {
    background: #00a085;
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 184, 148, 0.4);
  }

  .search-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .search-hint {
    font-size: 0.9rem;
    opacity: 0.7;
    margin: 0;
  }

  .popular-cities {
    margin-bottom: 48px;
  }

  .popular-title {
    font-size: 1rem;
    opacity: 0.8;
    margin: 0 0 16px;
  }

  .city-buttons {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .city-btn {
    padding: 12px 20px;
    border: none;
    border-radius: 25px;
    background: rgba(255, 255, 255, 0.15);
    color: white;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .city-btn:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .hero-cta {
    margin-top: 40px;
  }

  .cta-btn {
    padding: 20px 40px;
    border: none;
    border-radius: 35px;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    font-weight: 600;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  .cta-btn:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-3px);
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.2);
  }

  /* Features Section */
  .features {
    padding: 100px 0;
    background: #f8fafc;
  }

  .section-title {
    text-align: center;
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0 0 60px;
    color: #2d3748;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 40px;
  }

  .feature-card {
    background: white;
    padding: 40px 30px;
    border-radius: 20px;
    text-align: center;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
    border: 1px solid #e2e8f0;
  }

  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
  }

  .feature-icon {
    font-size: 3rem;
    margin-bottom: 20px;
  }

  .feature-title {
    font-size: 1.3rem;
    font-weight: 600;
    margin: 0 0 16px;
    color: #2d3748;
  }

  .feature-description {
    font-size: 1rem;
    line-height: 1.6;
    color: #4a5568;
    margin: 0;
  }

  /* Demo Section */
  .demo {
    padding: 100px 0;
    background: white;
  }

  .demo-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 60px;
    align-items: center;
  }

  .demo-text h3 {
    font-size: 2rem;
    font-weight: 600;
    margin: 0 0 20px;
    color: #2d3748;
  }

  .demo-text p {
    font-size: 1.1rem;
    line-height: 1.6;
    color: #4a5568;
    margin: 0 0 30px;
  }

  .demo-steps {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .step {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 1rem;
    font-weight: 500;
    color: #2d3748;
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: #667eea;
    color: white;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.9rem;
  }

  .demo-preview {
    display: flex;
    justify-content: center;
  }

  .mock-weather-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 24px;
    color: white;
    width: 280px;
    box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
  }

  .mock-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    font-weight: 500;
  }

  .mock-main {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    margin-bottom: 16px;
  }

  .mock-icon {
    font-size: 3rem;
  }

  .mock-temp {
    font-size: 2.5rem;
    font-weight: 700;
  }

  .mock-desc {
    text-align: center;
    font-size: 1.1rem;
    margin-bottom: 20px;
    opacity: 0.9;
  }

  .mock-details {
    display: flex;
    justify-content: space-around;
    font-size: 0.9rem;
    opacity: 0.8;
  }

  /* Footer */
  .footer {
    padding: 40px 0;
    background: #2d3748;
    color: white;
  }

  .footer-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .footer-logo {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .footer-tagline {
    font-size: 0.9rem;
    opacity: 0.7;
    margin: 0;
  }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 16px;
    font-size: 0.9rem;
  }

  .footer-link {
    color: white;
    text-decoration: none;
    transition: opacity 0.3s ease;
  }

  .footer-link:hover {
    opacity: 0.8;
  }

  .footer-separator {
    opacity: 0.5;
  }

  .footer-text {
    opacity: 0.7;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .hero-title {
      font-size: 2.5rem;
    }

    .hero-subtitle {
      font-size: 1.1rem;
    }

    .search-input-group {
      flex-direction: column;
      gap: 16px;
    }

    .city-buttons {
      gap: 8px;
    }

    .city-btn {
      padding: 10px 16px;
      font-size: 0.9rem;
    }

    .section-title {
      font-size: 2rem;
    }

    .features-grid {
      grid-template-columns: 1fr;
      gap: 30px;
    }

    .demo-content {
      grid-template-columns: 1fr;
      gap: 40px;
    }

    .footer-content {
      flex-direction: column;
      gap: 20px;
      text-align: center;
    }
  }

  @media (max-width: 480px) {
    .hero-title {
      font-size: 2rem;
    }

    .hero-icon {
      font-size: 4rem;
    }

    .search-input, .search-btn {
      padding: 16px 20px;
      font-size: 1rem;
    }

    .cta-btn {
      padding: 16px 32px;
      font-size: 1.1rem;
    }

    .feature-card {
      padding: 30px 20px;
    }

    .mock-weather-card {
      width: 240px;
      padding: 20px;
    }
  }
</style>
