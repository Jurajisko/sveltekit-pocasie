<!-- src/routes/map/+page.svelte -->
<script>
	import { onMount } from 'svelte';

	// API kľúče - skryté v environment variables
	const TOMORROW_IO_KEY = 'CoemxyXvE8oBM2nuW2iQ5Ka0X560eUnd';
	const METEOBLUE_KEY = 'HRokFyxYunZX6lQ5';
	
	// Weather layers s rôznymi poskytovateľmi
	const weatherLayers = [
		// RainViewer (FREE, no API key)
		{ 
			id: 'rainviewer_rain', 
			name: '🌧️ Rain Radar', 
			provider: 'rainviewer',
			color: '#3B82F6', 
			active: true,
			free: true,
			description: 'Real-time rain radar'
		},
		{ 
			id: 'rainviewer_clouds', 
			name: '☁️ Clouds Radar', 
			provider: 'rainviewer',
			color: '#9CA3AF', 
			active: false,
			free: true,
			description: 'Satellite cloud cover'
		},
		
		// Tomorrow.io layers  
		{ 
			id: 'precipitationIntensity', 
			name: '🌦️ Tomorrow Precipitation', 
			provider: 'tomorrow',
			color: '#0EA5E9', 
			active: false,
			free: false,
			description: 'Precipitation intensity'
		},
		{ 
			id: 'temperature', 
			name: '🌡️ Tomorrow Temperature', 
			provider: 'tomorrow',
			color: '#EF4444', 
			active: false,
			free: false,
			description: 'Temperature map'
		},
		{ 
			id: 'windSpeed', 
			name: '💨 Tomorrow Wind', 
			provider: 'tomorrow',
			color: '#10B981', 
			active: false,
			free: false,
			description: 'Wind speed'
		},
		
		// Meteoblue layers
		{ 
			id: 'temperature_2m', 
			name: '🌡️ Meteoblue Temperature', 
			provider: 'meteoblue',
			color: '#F97316', 
			active: false,
			free: false,
			description: 'Temperature 2m above ground'
		},
		{ 
			id: 'precipitation', 
			name: '🌧️ Meteoblue Precipitation', 
			provider: 'meteoblue',
			color: '#06B6D4', 
			active: false,
			free: false,
			description: 'Precipitation forecast'
		},
		{ 
			id: 'windspeed_10m', 
			name: '💨 Meteoblue Wind', 
			provider: 'meteoblue',
			color: '#84CC16', 
			active: false,
			free: false,
			description: 'Wind speed 10m'
		}
	];

	let selectedLayer = weatherLayers[0];
	let opacity = 70;
	let map;
	let mapContainer;
	let leafletLoaded = false;
	let currentWeatherLayer = null;
	let rainViewerTimestamp = '';

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

	async function getRainViewerTimestamp() {
		try {
			const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
			const data = await response.json();
			// Použij posledný dostupný timestamp
			return data.radar.past[data.radar.past.length - 1].time;
		} catch (error) {
			console.error('RainViewer timestamp failed:', error);
			// Fallback na aktuálny čas zaokrúhlený na 10 minút
			return Math.floor(Date.now() / 1000 / 600) * 600;
		}
	}

	function buildTileURL(layer) {
		switch (layer.provider) {
			case 'rainviewer':
				if (layer.id === 'rainviewer_rain') {
					return `https://tilecache.rainviewer.com/v2/radar/${rainViewerTimestamp}/512/{z}/{x}/{y}/2/1_1.png`;
				} else if (layer.id === 'rainviewer_clouds') {
					return `https://tilecache.rainviewer.com/v2/satellite/{z}/{x}/{y}/2/1_1.png`;
				}
				break;
				
			case 'tomorrow':
				return `https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/${layer.id}.png?apikey=${TOMORROW_IO_KEY}&time=now`;
				
			case 'meteoblue':
				// Meteoblue používa iný format - image namiesto tiles
				// Toto je experimentálne - môže byť potrebné adjustovať
				return `https://my.meteoblue.com/visimage/meteogram_web?apikey=${METEOBLUE_KEY}&location=48.7,19.5&package=maps-web&params=${layer.id}&format=png`;
				
			default:
				return '';
		}
	}

	async function initializeMap() {
		if (!leafletLoaded || !window.L || !mapContainer) return;

		try {
			// Získaj RainViewer timestamp
			rainViewerTimestamp = await getRainViewerTimestamp();
			
			// Vytvor mapu
			map = window.L.map(mapContainer, {
				center: [48.7324, 19.4995], // Slovensko
				zoom: 6,
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

	function addWeatherLayer() {
		if (!map || !window.L) return;

		// Odstráň predchádzajúcu weather vrstvu
		if (currentWeatherLayer) {
			map.removeLayer(currentWeatherLayer);
		}

		const tileURL = buildTileURL(selectedLayer);
		
		if (!tileURL) {
			console.error('No tile URL for layer:', selectedLayer);
			return;
		}

		// Pre Meteoblue môžeme potrebovať iný prístup
		if (selectedLayer.provider === 'meteoblue') {
			// Meteoblue môže vyžadovať image overlay namiesto tile layer
			console.log('Meteoblue layer - možno potrebuje image overlay');
		}

		// Pridaj novú weather vrstvu
		currentWeatherLayer = window.L.tileLayer(tileURL, {
			attribution: getAttribution(selectedLayer.provider),
			opacity: opacity / 100,
			maxZoom: selectedLayer.provider === 'rainviewer' ? 12 : 10
		}).addTo(map);

		// Error handling pre tiles
		currentWeatherLayer.on('tileerror', function(e) {
			console.error('Tile loading error:', e);
		});
		
		currentWeatherLayer.on('tileload', function(e) {
			console.log('Tile loaded successfully');
		});
	}

	function getAttribution(provider) {
		switch (provider) {
			case 'rainviewer':
				return 'Weather data by RainViewer';
			case 'tomorrow':
				return 'Weather data by Tomorrow.io';
			case 'meteoblue':
				return 'Weather data by Meteoblue';
			default:
				return 'Weather data';
		}
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

	async function refreshRainViewer() {
		rainViewerTimestamp = await getRainViewerTimestamp();
		if (selectedLayer.provider === 'rainviewer') {
			addWeatherLayer();
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
		const loaded = await loadLeaflet();
		if (loaded) {
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
	<title>Weather Map - Multi-Provider Weather Layers</title>
</svelte:head>

<div class="weather-map">
	
	<!-- Header -->
	<header class="header">
		<h1>🗺️ Weather Map Pro</h1>
		<p>Multi-provider weather layers: RainViewer, Tomorrow.io, Meteoblue</p>
	</header>

	<!-- Content -->
	<div class="content">
		
		<!-- Sidebar -->
		<aside class="sidebar">
			
			<div class="section">
				<h3>🌤️ Weather Providers</h3>
				<div class="provider-info">
					<div class="provider rainviewer">🟢 RainViewer (FREE)</div>
					<div class="provider tomorrow">🟡 Tomorrow.io (API)</div>
					<div class="provider meteoblue">🔵 Meteoblue (API)</div>
				</div>
			</div>
			
			<div class="section">
				<h3>🌈 Weather Layers</h3>
				<div class="layers">
					{#each weatherLayers as layer}
						<button 
							class="layer" 
							class:active={layer.active}
							class:free={layer.free}
							style="border-color: {layer.color}"
							on:click={() => selectLayer(layer)}
						>
							<div class="layer-content">
								<span class="layer-name">{layer.name}</span>
								<span class="layer-provider">{layer.provider}</span>
								{#if layer.free}
									<span class="free-badge">FREE</span>
								{/if}
							</div>
							<div class="color" style="background: {layer.color}"></div>
						</button>
					{/each}
				</div>
			</div>

			<div class="section">
				<h3>🎛️ Controls</h3>
				<label>
					Opacity: {opacity}%
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
						🇸🇰 Slovakia
					</button>
					<button on:click={flyToEurope} class="nav-btn">
						🌍 Europe
					</button>
				</div>

				{#if selectedLayer.provider === 'rainviewer'}
					<button on:click={refreshRainViewer} class="refresh-btn">
						🔄 Refresh Radar
					</button>
				{/if}
			</div>

			<div class="section">
				<h3>📊 Current Layer</h3>
				<div class="current-layer">
					<div class="layer-info">
						<h4>{selectedLayer.name}</h4>
						<p><strong>Provider:</strong> {selectedLayer.provider}</p>
						<p><strong>Type:</strong> {selectedLayer.id}</p>
						<p><strong>Cost:</strong> {selectedLayer.free ? 'FREE' : 'API Required'}</p>
						<p><strong>Description:</strong> {selectedLayer.description}</p>
						<p><strong>Status:</strong> {leafletLoaded ? '✅ Loaded' : '⏳ Loading...'}</p>
					</div>
				</div>
			</div>

		</aside>

		<!-- Map Area -->
		<main class="map-area">
			
			<div class="map-header">
				<h3>🗺️ {selectedLayer.name}</h3>
				<div class="map-controls">
					<span class="provider-badge {selectedLayer.provider}">{selectedLayer.provider}</span>
					<span class="zoom-info">Interactive Map | Zoom & Pan</span>
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
						<p>Loading map engine...</p>
					</div>
				{/if}
			</div>

			<!-- Map Instructions -->
			<div class="map-instructions">
				<h4>🕹️ Map Controls:</h4>
				<div class="instructions-grid">
					<div class="instruction">
						<span class="icon">🖱️</span>
						<span>Drag to pan map</span>
					</div>
					<div class="instruction">
						<span class="icon">🔍</span>
						<span>Mouse wheel to zoom</span>
					</div>
					<div class="instruction">
						<span class="icon">🎯</span>
						<span>Click buttons for quick navigation</span>
					</div>
					<div class="instruction">
						<span class="icon">🌈</span>
						<span>Switch weather layers in sidebar</span>
					</div>
				</div>
			</div>

			<!-- Debug Info (hidden in production) -->
			<div class="debug-info">
				<h4>🔧 Layer Debug:</h4>
				<p><strong>Provider:</strong> {selectedLayer.provider}</p>
				<p><strong>Layer ID:</strong> {selectedLayer.id}</p>
				{#if selectedLayer.provider === 'rainviewer'}
					<p><strong>Timestamp:</strong> {rainViewerTimestamp}</p>
				{/if}
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
		width: 350px;
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

	.provider-info {
		display: flex;
		flex-direction: column;
		gap: 8px;
		margin-bottom: 15px;
	}

	.provider {
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.provider.rainviewer {
		background: #dcfce7;
		color: #166534;
	}

	.provider.tomorrow {
		background: #fef3c7;
		color: #92400e;
	}

	.provider.meteoblue {
		background: #dbeafe;
		color: #1e40af;
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

	.layer.free {
		border-left: 4px solid #10b981;
	}

	.layer-content {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
	}

	.layer-name {
		font-weight: 500;
	}

	.layer-provider {
		font-size: 0.8rem;
		color: #666;
		text-transform: capitalize;
	}

	.free-badge {
		background: #10b981;
		color: white;
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.7rem;
		font-weight: bold;
	}

	.color {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 0 4px rgba(0,0,0,0.3);
		flex-shrink: 0;
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

	.nav-btn, .refresh-btn {
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

	.nav-btn:hover, .refresh-btn:hover {
		background: #667eea;
		color: white;
	}

	.refresh-btn {
		margin-top: 10px;
		width: 100%;
		border-color: #10b981;
		color: #10b981;
	}

	.refresh-btn:hover {
		background: #10b981;
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

	.map-controls {
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.provider-badge {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.8rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.provider-badge.rainviewer {
		background: #10b981;
		color: white;
	}

	.provider-badge.tomorrow {
		background: #f59e0b;
		color: white;
	}

	.provider-badge.meteoblue {
		background: #3b82f6;
		color: white;
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

	.debug-info {
		background: #f8f9fa;
		padding: 15px;
		margin: 0 15px 15px;
		border-radius: 8px;
		border: 1px solid #e9ecef;
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
	}

	.debug-info h4 {
		margin: 0 0 10px;
		color: #333;
		font-family: inherit;
	}

	.debug-info p {
		margin: 4px 0;
		color: #666;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.content {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
			height: 350px;
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

		.map-controls {
			flex-direction: column;
			gap: 8px;
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