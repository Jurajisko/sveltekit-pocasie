<!-- src/routes/map/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Tomorrow.io API konfigurácia
	const API_KEY = 'CoemxyXvE8oBM2nuW2iQ5Ka0X560eUnd';
	
	// Dostupné weather layers
	const weatherLayers = [
		{ id: 'precipitationIntensity', name: '🌧️ Zrážky', color: '#3B82F6', active: true },
		{ id: 'temperature', name: '🌡️ Teplota', color: '#EF4444', active: false },
		{ id: 'windSpeed', name: '💨 Vietor', color: '#10B981', active: false },
		{ id: 'cloudCover', name: '☁️ Oblačnosť', color: '#9CA3AF', active: false },
		{ id: 'humidity', name: '💧 Vlhkosť', color: '#06B6D4', active: false }
	];

	let selectedLayer = weatherLayers[0];
	let opacity = 70;
	let map;
	let mapContainer;
	let leafletLoaded = false;
	let mapCenter = [48.7324, 19.4995]; // Slovensko
	let mapZoom = 6;

	async function loadLeaflet() {
		if (typeof window === 'undefined') return false;
		
		try {
			// Načítaj Leaflet CSS
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
			document.head.appendChild(link);

			// Načítaj Leaflet JS
			const script = document.createElement('script');
			script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
			
			return new Promise((resolve) => {
				script.onload = () => {
					leafletLoaded = true;
					resolve(true);
				};
				script.onerror = () => resolve(false);
				document.head.appendChild(script);
			});
		} catch (error) {
			console.error('Leaflet loading failed:', error);
			return false;
		}
	}

	async function initializeMap() {
		if (!leafletLoaded || !window.L || !mapContainer) return;

		try {
			// Vytvor mapu
			map = window.L.map(mapContainer, {
				center: mapCenter,
				zoom: mapZoom,
				zoomControl: true
			});

			// Pridaj OpenStreetMap tiles
			window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors',
				maxZoom: 18
			}).addTo(map);

			// Pridaj weather vrstvu
			addWeatherLayer();

		} catch (error) {
			console.error('Map initialization failed:', error);
		}
	}

	let currentWeatherLayer = null;

	function addWeatherLayer() {
		if (!map || !window.L) return;

		// Odstráň predchádzajúcu weather vrstvu
		if (currentWeatherLayer) {
			map.removeLayer(currentWeatherLayer);
		}

		// Pridaj novú weather vrstvu
		currentWeatherLayer = window.L.tileLayer(
			`https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/${selectedLayer.id}/current.png?apikey=${API_KEY}`,
			{
				attribution: 'Weather data by Tomorrow.io',
				opacity: opacity / 100,
				maxZoom: 12
			}
		).addTo(map);
	}

	function selectLayer(layer) {
		selectedLayer = layer;
		// Update active state
		weatherLayers.forEach(l => l.active = false);
		layer.active = true;
		
		// Update map layer
		addWeatherLayer();
	}

	function updateOpacity() {
		if (currentWeatherLayer) {
			currentWeatherLayer.setOpacity(opacity / 100);
		}
	}

	function flyToSlovakia() {
		if (map) {
			map.flyTo([48.7324, 19.4995], 7);
		}
	}

	function flyToEurope() {
		if (map) {
			map.flyTo([54.0, 10.0], 4);
		}
	}

	onMount(async () => {
		if (!browser) return;

		// Načítaj Leaflet a inicializuj mapu
		const loaded = await loadLeaflet();
		if (loaded) {
			// Počkaj na DOM update
			setTimeout(initializeMap, 100);
		}
	});

	// Reactive updates
	$: if (map && selectedLayer) {
		addWeatherLayer();
	}

	$: if (currentWeatherLayer && opacity) {
		updateOpacity();
	}
</script>

<svelte:head>
	<title>Weather Map - Skutočná mapa s počasím</title>
</svelte:head>

<div class="weather-map">
	
	<!-- Header -->
	<header class="header">
		<h1>🗺️ Weather Map Pro</h1>
		<p>Skutočná mapa s weather vrstvami od Tomorrow.io</p>
	</header>

	<!-- Content -->
	<div class="content">
		
		<!-- Sidebar -->
		<aside class="sidebar">
			
			<div class="section">
				<h3>🌤️ Weather Vrstvy</h3>
				<div class="layers">
					{#each weatherLayers as layer}
						<button 
							class="layer" 
							class:active={layer.active}
							style="border-color: {layer.color}"
							on:click={() => selectLayer(layer)}
						>
							<span>{layer.name}</span>
							<div class="color" style="background: {layer.color}"></div>
						</button>
					{/each}
				</div>
			</div>

			<div class="section">
				<h3>🎛️ Nastavenia</h3>
				<label>
					Priesvitnosť: {opacity}%
					<input 
						type="range" 
						min="10" 
						max="100" 
						bind:value={opacity}
						on:input={updateOpacity}
					/>
				</label>
				
				<div class="nav-buttons">
					<button on:click={flyToSlovakia} class="nav-btn">
						🇸🇰 Slovensko
					</button>
					<button on:click={flyToEurope} class="nav-btn">
						🌍 Európa
					</button>
				</div>
			</div>

			<div class="section">
				<h3>📊 Aktívna vrstva</h3>
				<div class="current-layer">
					<div class="layer-info">
						<h4>{selectedLayer.name}</h4>
						<p><strong>API Layer:</strong> {selectedLayer.id}</p>
						<p><strong>Farba:</strong> {selectedLayer.color}</p>
						<p><strong>Zdroj:</strong> Tomorrow.io</p>
						<p><strong>Status:</strong> {leafletLoaded ? '✅ Loaded' : '⏳ Loading...'}</p>
					</div>
				</div>
			</div>

			<div class="section">
				<h3>🗺️ Mapa Info</h3>
				<div class="map-info">
					<p><strong>Podklad:</strong> OpenStreetMap</p>
					<p><strong>Weather:</strong> Tomorrow.io tiles</p>
					<p><strong>Interakcia:</strong> Zoom, Pan, Click</p>
					<p><strong>Format:</strong> PNG tiles 256x256</p>
				</div>
			</div>

		</aside>

		<!-- Map Area -->
		<main class="map-area">
			
			<div class="map-header">
				<h3>🗺️ {selectedLayer.name}</h3>
				<div class="map-controls">
					<span class="zoom-info">Zoom: 6 | Center: Slovakia</span>
				</div>
			</div>

			<!-- Real Map Container -->
			<div 
				bind:this={mapContainer} 
				class="map-container"
				class:loading={!leafletLoaded}
			>
				{#if !leafletLoaded}
					<div class="map-loading">
						<div class="spinner"></div>
						<p>Načítavam Leaflet mapu...</p>
					</div>
				{/if}
			</div>

			<!-- Map Instructions -->
			<div class="map-instructions">
				<h4>🕹️ Ovládanie mapy:</h4>
				<div class="instructions-grid">
					<div class="instruction">
						<span class="icon">🖱️</span>
						<span>Ťahaj mapu pre pohyb</span>
					</div>
					<div class="instruction">
						<span class="icon">🔍</span>
						<span>Koliesko myši pre zoom</span>
					</div>
					<div class="instruction">
						<span class="icon">🎯</span>
						<span>Klikni na tlačidlá pre rýchlu navigáciu</span>
					</div>
					<div class="instruction">
						<span class="icon">🌈</span>
						<span>Prepínaj weather vrstvy v menu</span>
					</div>
				</div>
			</div>

			<!-- API URL Display -->
			<div class="api-display">
				<h4>🔗 Aktuálna Tomorrow.io Tile URL:</h4>
				<code class="tile-url">
					https://api.tomorrow.io/v4/map/tile/[z]/[x]/[y]/{selectedLayer.id}/current.png?apikey={API_KEY}
				</code>
				<p class="api-note">
					⚠️ Tile sa načítavajú priamo z Tomorrow.io API. Ak sa nezobrazujú, skontroluj API key alebo network connection.
				</p>
			</div>

		</main>

	</div>

</div>

<style>
	.weather-map {
		height: 100vh;
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f5f5f5;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 20px;
		text-align: center;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
	}

	.header h1 {
		margin: 0 0 8px;
		font-size: 2rem;
		font-weight: bold;
	}

	.header p {
		margin: 0;
		font-size: 1.1rem;
		opacity: 0.9;
	}

	.content {
		display: flex;
		flex: 1;
		height: calc(100vh - 80px);
	}

	/* Sidebar */
	.sidebar {
		width: 320px;
		background: white;
		border-right: 1px solid #ddd;
		overflow-y: auto;
		box-shadow: 2px 0 10px rgba(0,0,0,0.05);
	}

	.section {
		padding: 20px;
		border-bottom: 1px solid #f0f0f0;
	}

	.section h3 {
		margin: 0 0 15px;
		color: #333;
		font-size: 1.1rem;
		font-weight: 600;
	}

	.layers {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.layer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 15px;
		border: 2px solid #f0f0f0;
		border-radius: 8px;
		background: white;
		cursor: pointer;
		transition: all 0.3s ease;
		font-size: 1rem;
		width: 100%;
	}

	.layer:hover {
		background: #f8f9ff;
		transform: translateY(-1px);
	}

	.layer.active {
		background: #f0f4ff;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.color {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 0 4px rgba(0,0,0,0.3);
	}

	label {
		display: block;
		font-weight: 500;
		color: #555;
		margin-bottom: 15px;
	}

	input[type="range"] {
		width: 100%;
		margin-top: 8px;
		height: 6px;
		border-radius: 3px;
		background: #ddd;
		appearance: none;
		cursor: pointer;
	}

	input[type="range"]::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #667eea;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0,0,0,0.2);
	}

	.nav-buttons {
		display: flex;
		gap: 8px;
		margin-top: 15px;
	}

	.nav-btn {
		flex: 1;
		padding: 10px 12px;
		border: 2px solid #667eea;
		background: white;
		color: #667eea;
		border-radius: 6px;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		transition: all 0.3s ease;
	}

	.nav-btn:hover {
		background: #667eea;
		color: white;
	}

	.current-layer {
		background: #f8f9fa;
		padding: 15px;
		border-radius: 8px;
		border: 1px solid #e9ecef;
	}

	.layer-info h4 {
		margin: 0 0 10px;
		color: #333;
	}

	.layer-info p {
		margin: 4px 0;
		font-size: 0.9rem;
		color: #666;
	}

	.map-info p {
		margin: 4px 0;
		font-size: 0.9rem;
		color: #666;
	}

	/* Map Area */
	.map-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		background: #f8f9fa;
	}

	.map-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 20px;
		background: white;
		border-bottom: 1px solid #e0e0e0;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.map-header h3 {
		margin: 0;
		color: #333;
	}

	.zoom-info {
		font-size: 0.9rem;
		color: #666;
		font-family: 'Courier New', monospace;
	}

	.map-container {
		flex: 1;
		position: relative;
		background: #e8f4f8;
	}

	.map-container.loading {
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.map-loading {
		text-align: center;
		color: #667eea;
	}

	.spinner {
		width: 40px;
		height: 40px;
		border: 4px solid #f0f0f0;
		border-top: 4px solid #667eea;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin: 0 auto 15px;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	.map-instructions {
		background: white;
		padding: 20px;
		margin: 15px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.map-instructions h4 {
		margin: 0 0 15px;
		color: #333;
	}

	.instructions-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 10px;
	}

	.instruction {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.9rem;
		color: #555;
	}

	.icon {
		font-size: 1.2rem;
	}

	.api-display {
		background: white;
		padding: 20px;
		margin: 0 15px 15px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.api-display h4 {
		margin: 0 0 12px;
		color: #333;
	}

	.tile-url {
		display: block;
		background: #f1f3f4;
		padding: 12px;
		border-radius: 6px;
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		color: #333;
		word-break: break-all;
		border-left: 4px solid #667eea;
		margin-bottom: 10px;
	}

	.api-note {
		font-size: 0.85rem;
		color: #666;
		margin: 0;
		font-style: italic;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.content {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			height: 300px;
			border-right: none;
			border-bottom: 1px solid #ddd;
		}

		.map-container {
			height: 400px;
		}

		.nav-buttons {
			flex-direction: column;
		}

		.instructions-grid {
			grid-template-columns: 1fr;
		}

		.map-header {
			flex-direction: column;
			gap: 10px;
			text-align: center;
		}
	}

	/* Leaflet map adjustments */
	:global(.leaflet-container) {
		height: 100%;
		width: 100%;
		border-radius: 0;
	}

	:global(.leaflet-control-attribution) {
		font-size: 10px;
		background: rgba(255, 255, 255, 0.8);
	}
</style>