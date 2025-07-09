<script>
  import { onMount } from 'svelte';

  // Props - customizable from parent
  export let width = "100%";
  export let height = "400px";
  export let lat = 48.7;
  export let lon = 19.5;
  export let zoom = 7;
  export let overlay = "wind"; // wind, temp, precipitation, etc.
  export let level = "surface"; // surface, 850h, 700h, etc.
  export let product = "ecmwf"; // ecmwf, gfs, nam
  export let showControls = true;
  export let showMenu = false;
  export let showMessage = false;
  export let showMarker = false;
  export let showCalendar = true;

  // Internal state
  let windyContainer;
  let isLoading = true;
  let loadError = false;
  let windyReady = false;

  // Windy embed URL builder
  $: windyUrl = buildWindyUrl();

  onMount(() => {
    console.log('🌪️ Initializing Windy Wind Component...');
    loadWindyEmbed();
  });

  function buildWindyUrl() {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      detailLat: lat.toString(),
      detailLon: lon.toString(),
      width: '650',
      height: '450',
      zoom: zoom.toString(),
      level: level,
      overlay: overlay,
      product: product,
      menu: showMenu ? '' : '',
      message: showMessage ? '' : '',
      marker: showMarker ? '' : '',
      calendar: showCalendar ? 'now' : '',
      pressure: '',
      type: 'map',
      location: 'coordinates',
      detail: '',
      metricWind: 'default',
      metricTemp: 'default',
      radarRange: '-1'
    });

    return `https://embed.windy.com/embed2.html?${params.toString()}`;
  }

  function loadWindyEmbed() {
    isLoading = true;
    loadError = false;

    // Create iframe element
    const iframe = document.createElement('iframe');
    iframe.src = windyUrl;
    iframe.width = '100%';
    iframe.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.title = 'Windy Wind Map';
    iframe.allow = 'geolocation';

    // Loading handlers
    iframe.onload = () => {
      console.log('✅ Windy embed loaded successfully');
      isLoading = false;
      windyReady = true;
    };

    iframe.onerror = () => {
      console.error('❌ Windy embed failed to load');
      isLoading = false;
      loadError = true;
    };

    // Clear container and add iframe
    if (windyContainer) {
      windyContainer.innerHTML = '';
      windyContainer.appendChild(iframe);
    }

    // Timeout fallback
    setTimeout(() => {
      if (isLoading) {
        console.warn('⚠️ Windy embed loading timeout');
        isLoading = false;
        windyReady = true; // Assume it's working
      }
    }, 10000); // 10 second timeout
  }

  // Public methods for parent components
  export function updateLocation(newLat, newLon, newZoom = zoom) {
    lat = newLat;
    lon = newLon;
    zoom = newZoom;
    loadWindyEmbed();
  }

  export function changeOverlay(newOverlay) {
    overlay = newOverlay;
    loadWindyEmbed();
  }

  export function changeLevel(newLevel) {
    level = newLevel;
    loadWindyEmbed();
  }

  export function refresh() {
    loadWindyEmbed();
  }

  // Reactive updates
  $: if (windyContainer && windyReady) {
    // Auto-refresh when props change
    loadWindyEmbed();
  }
</script>

<!-- Windy Wind Component -->
<div class="windy-wind-component" style="width: {width}; height: {height};">
  
  <!-- Loading State -->
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">
        <h4>🌪️ Načítavam Windy...</h4>
        <p>Professional wind visualization</p>
        <div class="loading-progress">
          <div class="progress-bar"></div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Error State -->
  {#if loadError}
    <div class="error-overlay">
      <div class="error-content">
        <h4>❌ Windy Error</h4>
        <p>Nepodarilo sa načítať wind mapu</p>
        <button class="retry-btn" on:click={loadWindyEmbed}>
          🔄 Skúsiť znovu
        </button>
      </div>
    </div>
  {/if}

  <!-- Windy Embed Container -->
  <div 
    bind:this={windyContainer} 
    class="windy-container"
    class:loading={isLoading}
    class:error={loadError}
  >
    <!-- Iframe will be inserted here -->
  </div>

  <!-- Component Info -->
  {#if showControls}
    <div class="component-info">
      <div class="info-badge">
        <span class="badge-icon">💨</span>
        <div class="badge-content">
          <div class="badge-title">Wind Layer</div>
          <div class="badge-details">
            {overlay} • {level} • {product}
          </div>
        </div>
      </div>
      
      <div class="location-info">
        📍 {lat.toFixed(2)}°, {lon.toFixed(2)}° • Zoom {zoom}
      </div>
    </div>
  {/if}
</div>

<style>
  .windy-wind-component {
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    background: #f8fafc;
    border: 1px solid rgba(0, 0, 0, 0.05);
  }

  .windy-container {
    width: 100%;
    height: 100%;
    position: relative;
    transition: all 0.3s ease;
  }

  .windy-container.loading {
    opacity: 0.7;
  }

  .windy-container.error {
    opacity: 0.5;
  }

  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, rgba(255, 107, 53, 0.95), rgba(255, 140, 80, 0.95));
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10;
    color: white;
    text-align: center;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .loading-text h4 {
    margin: 0 0 8px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .loading-text p {
    margin: 0 0 16px 0;
    font-size: 14px;
    opacity: 0.9;
  }

  .loading-progress {
    width: 200px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: white;
    width: 0;
    animation: progress 2s ease-in-out infinite;
  }

  @keyframes progress {
    0% { width: 0; }
    50% { width: 70%; }
    100% { width: 100%; }
  }

  .error-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(239, 68, 68, 0.95);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10;
    color: white;
    text-align: center;
  }

  .error-content h4 {
    margin: 0 0 12px 0;
    font-size: 18px;
    font-weight: 600;
  }

  .error-content p {
    margin: 0 0 20px 0;
    font-size: 14px;
    opacity: 0.9;
  }

  .retry-btn {
    background: white;
    color: #ef4444;
    border: none;
    padding: 10px 20px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .retry-btn:hover {
    background: #f1f5f9;
    transform: translateY(-1px);
  }

  .component-info {
    position: absolute;
    top: 12px;
    left: 12px;
    right: 12px;
    z-index: 5;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    pointer-events: none;
  }

  .info-badge {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 12px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 107, 53, 0.2);
  }

  .badge-icon {
    font-size: 20px;
    margin-right: 8px;
  }

  .badge-content {
    display: flex;
    flex-direction: column;
  }

  .badge-title {
    font-weight: 600;
    font-size: 14px;
    color: #ff6b35;
    margin-bottom: 2px;
  }

  .badge-details {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .location-info {
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    backdrop-filter: blur(10px);
  }

  /* Mobile responsive */
  @media (max-width: 768px) {
    .component-info {
      flex-direction: column;
      gap: 8px;
      align-items: flex-start;
    }

    .info-badge {
      padding: 6px 10px;
    }

    .badge-title {
      font-size: 12px;
    }

    .badge-details {
      font-size: 10px;
    }

    .location-info {
      font-size: 10px;
      padding: 4px 8px;
    }

    .loading-text h4 {
      font-size: 16px;
    }

    .loading-text p {
      font-size: 12px;
    }

    .loading-progress {
      width: 150px;
    }
  }

  /* Dark theme support */
  @media (prefers-color-scheme: dark) {
    .windy-wind-component {
      background: #1e293b;
      border-color: rgba(255, 255, 255, 0.1);
    }

    .info-badge {
      background: rgba(30, 41, 59, 0.95);
      border-color: rgba(255, 107, 53, 0.3);
    }

    .badge-details {
      color: #94a3b8;
    }
  }

  /* Animation for smooth transitions */
  .windy-wind-component {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>