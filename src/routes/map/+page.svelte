<!-- src/routes/map/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	// Tomorrow.io API konfigurácia
	const API_KEY = 'CoemxyXvE8oBM2nuW2iQ5Ka0X560eUnd';
	
	// Dostupné weather layers
	const weatherLayers = [
		{
			id: 'precipitationIntensity',
			name: '🌧️ Zrážky (Radar)',
			description: 'Intenzita dažďa a snehu',
			color: '#3B82F6',
			active: true
		},
		{
			id: 'temperature',
			name: '🌡️ Teplota',
			description: 'Teplota vzduchu',
			color: '#EF4444',
			active: false
		},
		{
			id: 'windSpeed',
			name: '💨 Vietor',
			description: 'Rýchlosť vetra',
			color: '#10B981',
			active: false
		},
		{
			id: 'cloudCover',
			name: '☁️ Oblačnosť',
			description: 'Pokrytie oblakmi',
			color: '#9CA3AF',
			active: false
		},
		{
			id: 'humidity',
			name: '💧 Vlhkosť',
			description: 'Vlhkosť vzduchu',
			color: '#06B6D4',
			active: false
		},
		{
			id: 'windDirection',
			name: '🧭 Smer vetra',
			description: 'Smer vetra',
			color: '#8B5CF6',
			active: false
		}
	];

	let map;
	let mapContainer;
	let activeLayers = weatherLayers.filter(layer => layer.active);
	let currentTimestamp = 'current';
	let mapStyle = 'streets-v11';
	let opacity = 0.7;
	let isLoading = true;

	// Mapbox access token (public token pre demo)
	const MAPBOX_TOKEN = 'pk.eyJ1IjoidGVzdHVzZXIiLCJhIjoiY2t2aWVuMm9oMGR6czJ2bzR5eXB0eGswYiJ9.example';

	onMount(async () => {
		if (!browser) return;

		try {
			// Načítame Mapbox GL JS
			await loadMapboxScript();
			initializeMap();
		} catch (error) {
			console.error('Error loading map:', error);
			// Fallback na jednoduchšiu mapu ak Mapbox zlyhá
			initializeSimpleMap();
		}
	});

	async function loadMapboxScript() {
		return new Promise((resolve, reject) => {
			if (window.mapboxgl) {
				resolve();
				return;
			}

			const script = document.createElement('script');
			script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
			script.onload = resolve;
			script.onerror = reject;
			document.head.appendChild(script);

			const link = document.createElement('link');
			link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
			link.rel = 'stylesheet';
			document.head.appendChild(link);
		});
	}

	function initializeMap() {
		try {
			// Použijeme verejný Mapbox token alebo fallback
			window.mapboxgl.accessToken = MAPBOX_TOKEN || 'pk.eyJ1IjoidGVzdCIsImEiOiJjazB1dDUwOWcwMXVhM29ucDRmYzNzZWR0In0.test';

			map = new window.mapboxgl.Map({
				container: mapContainer,
				style: `mapbox://styles/mapbox/${mapStyle}`,
				center: [19.4995, 48.7324], // Slovensko - Banská Bystrica
				zoom: 6,
				attributionControl: false
			});

			map.on('load', () => {
				isLoading = false;
				addWeatherLayers();
			});

			map.on('error', (e) => {
				console.warn('Mapbox error, using fallback:', e);
				initializeSimpleMap();
			});

		} catch (error) {
			console.warn('Failed to initialize Mapbox, using fallback:', error);
			initializeSimpleMap();
		}
	}

	function initializeSimpleMap() {
		// Fallback - jednoduchá mapa bez Mapbox závislosti
		mapContainer.innerHTML = `
			<div style="
				width: 100%; 
				height: 100%; 
				background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
				display: flex;
				align-items: center;
				justify-content: center;
				color: white;
				text-align: center;
				flex-direction: column;
				gap: 20px;
			">
				<div style="font-size: 3rem;">🗺️</div>
				<h3>Weather Map</h3>
				<p>Interaktívna mapa s weather vrstvami</p>
				<div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
					<p><strong>Dostupné vrstvy:</strong></p>
					${weatherLayers.map(layer => `<div>${layer.name}</div>`).join('')}
				</div>
				<small>Pre plnú funkcionalitu potrebujeme Mapbox GL JS</small>
			</div>
		`;
		isLoading = false;
	}

	function addWeatherLayers() {
		if (!map) return;

		activeLayers.forEach(layer => {
			const sourceId = `weather-${layer.id}`;
			const layerId = `weather-layer-${layer.id}`;

			// Pridáme zdroj dát pre weather vrstvu
			map.addSource(sourceId, {
				type: 'raster',
				tiles: [
					`https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/${layer.id}/${currentTimestamp}.png?apikey=${API_KEY}`
				],
				tileSize: 256
			});

			// Pridáme vrstvu na mapu
			map.addLayer({
				id: layerId,
				type: 'raster',
				source: sourceId,
				paint: {
					'raster-opacity': opacity
				}
			});
		});
	}

	function toggleLayer(layer) {
		layer.active = !layer.active;
		
		if (layer.active) {
			activeLayers = [...activeLayers, layer];
		} else {
			activeLayers = activeLayers.filter(l => l.id !== layer.id);
		}

		updateMapLayers();
	}

	function updateMapLayers() {
		if (!map) return;

		// Odstránime všetky existujúce weather vrstvy
		weatherLayers.forEach(layer => {
			const layerId = `weather-layer-${layer.id}`;
			const sourceId = `weather-${layer.id}`;
			
			if (map.getLayer(layerId)) {
				map.removeLayer(layerId);
			}
			if (map.getSource(sourceId)) {
				map.removeSource(sourceId);
			}
		});

		// Pridáme aktívne vrstvy
		addWeatherLayers();
	}

	function changeMapStyle(style) {
		mapStyle = style;
		if (map) {
			map.setStyle(`mapbox://styles/mapbox/${style}`);
			map.once('styledata', () => {
				addWeatherLayers();
			});
		}
	}

	function updateOpacity(value) {
		opacity = value;
		if (!map) return;

		activeLayers.forEach(layer => {
			const layerId = `weather-layer-${layer.id}`;
			if (map.getLayer(layerId)) {
				map.setPaintProperty(layerId, 'raster-opacity', opacity);
			}
		});
	}

	function centerOnSlovakia() {
		if (map) {
			map.flyTo({
				center: [19.4995, 48.7324],
				zoom: 7,
				duration: 1500
			});
		}
	}

	function centerOnEurope() {
		if (map) {
			map.flyTo({
				center: [10.0, 54.0],
				zoom: 4,
				duration: 1500
			});
		}
	}
</script>

<svelte:head>
	<title>Weather Map - Interaktívna mapa s počasím</title>
	<meta name="description" content="Interaktívna weather mapa s radar, teplota, vietor a ďalšie vrstvy" />
</svelte:head>

<div class="weather-map-app">
	
	<!-- Header -->
	<header class="map-header">
		<div class="header-content">
			<h1>🗺️ Weather Map Pro</h1>
			<p>Interaktívna mapa s weather vrstvami od Tomorrow.io</p>
		</div>
	</header>

	<!-- Main Map Interface -->
	<div class="map-interface">
		
		<!-- Sidebar Controls -->
		<aside class="map-sidebar">
			
			<!-- Weather Layers -->
			<div class="control-section">
				<h3>🌤️ Weather vrstvy</h3>
				<div class="layers-list">
					{#each weatherLayers as layer}
						<label class="layer-item" class:active={layer.active}>
							<input 
								type="checkbox" 
								bind:checked={layer.active}
								on:change={() => toggleLayer(layer)}
							/>
							<div class="layer-info">
								<div class="layer-name">{layer.name}</div>
								<div class="layer-desc">{layer.description}</div>
							</div>
							<div class="layer-color" style="background-color: {layer.color}"></div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Map Controls -->
			<div class="control-section">
				<h3>🎛️ Ovládanie</h3>
				
				<!-- Opacity Control -->
				<div class="control-item">
					<label>Priesvitnosť: {Math.round(opacity * 100)}%</label>
					<input 
						type="range" 
						min="0.1" 
						max="1" 
						step="0.1" 
						bind:value={opacity}
						on:input={(e) => updateOpacity(parseFloat(e.target.value))}
						class="slider"
					/>
				</div>

				<!-- Map Style -->
				<div class="control-item">
					<label>Štýl mapy:</label>
					<select bind:value={mapStyle} on:change={() => changeMapStyle(mapStyle)}>
						<option value="streets-v11">Ulice</option>
						<option value="satellite-v9">Satelit</option>
						<option value="outdoors-v11">Outdoor</option>
						<option value="light-v10">Svetlý</option>
						<option value="dark-v10">Tmavý</option>
					</select>
				</div>

				<!-- Quick Navigation -->
				<div class="control-item">
					<label>Rýchla navigácia:</label>
					<div class="nav-buttons">
						<button on:click={centerOnSlovakia} class="nav-btn">
							🇸🇰 Slovensko
						</button>
						<button on:click={centerOnEurope} class="nav-btn">
							🌍 Európa
						</button>
					</div>
				</div>
			</div>

			<!-- Legend -->
			<div class="control-section">
				<h3>📊 Legenda</h3>
				<div class="legend">
					{#each activeLayers as layer}
						<div class="legend-item">
							<div class="legend-color" style="background-color: {layer.color}"></div>
							<span>{layer.name}</span>
						</div>
					{/each}
					{#if activeLayers.length === 0}
						<p class="no-layers">Žiadne aktívne vrstvy</p>
					{/if}
				</div>
			</div>

		</aside>

		<!-- Map Container -->
		<main class="map-main">
			
			{#if isLoading}
				<div class="map-loading">
					<div class="loading-spinner"></div>
					<p>Načítavam mapu...</p>
				</div>
			{/if}

			<div bind:this={mapContainer} class="map-container"></div>

			<!-- Map Overlay Info -->
			<div class="map-overlay">
				<div class="overlay-info">
					<div class="active-layers-count">
						Aktívne vrstvy: {activeLayers.length}
					</div>
					<div class="data-source">
						Powered by Tomorrow.io
					</div>
				</div>
			</div>

		</main>

	</div>

</div>

<style>
	.weather-map-app {
		height: 100vh;
		display: flex;
		flex-direction: column;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f5f5f5;
	}

	/* Header */
	.map-header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 20px;
		text-align: center;
		box-shadow: 0 2px 10px rgba(0,0,0,0.1);
	}

	.header-content h1 {
		margin: 0 0 10px;
		font-size: 2rem;
		font-weight: bold;
	}

	.header-content p {
		margin: 0;
		opacity: 0.9;
		font-size: 1.1rem;
	}

	/* Main Interface */
	.map-interface {
		flex: 1;
		display: flex;
		height: calc(100vh - 100px);
	}

	/* Sidebar */
	.map-sidebar {
		width: 350px;
		background: white;
		border-right: 1px solid #ddd;
		overflow-y: auto;
		box-shadow: 2px 0 10px rgba(0,0,0,0.05);
	}

	.control-section {
		padding: 20px;
		border-bottom: 1px solid #f0f0f0;
	}

	.control-section h3 {
		margin: 0 0 15px;
		font-size: 1.1rem;
		color: #333;
		font-weight: 600;
	}

	/* Weather Layers */
	.layers-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.layer-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px;
		border: 2px solid #f0f0f0;
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.3s ease;
		background: #fafafa;
	}

	.layer-item:hover {
		border-color: #667eea;
		background: #f8f9ff;
	}

	.layer-item.active {
		border-color: #667eea;
		background: #f0f4ff;
		box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
	}

	.layer-item input[type="checkbox"] {
		width: 18px;
		height: 18px;
		cursor: pointer;
	}

	.layer-info {
		flex: 1;
	}

	.layer-name {
		font-weight: 600;
		color: #333;
		margin-bottom: 2px;
	}

	.layer-desc {
		font-size: 0.85rem;
		color: #666;
	}

	.layer-color {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 0 3px rgba(0,0,0,0.3);
	}

	/* Controls */
	.control-item {
		margin-bottom: 15px;
	}

	.control-item label {
		display: block;
		margin-bottom: 8px;
		font-weight: 500;
		color: #555;
	}

	.slider {
		width: 100%;
		height: 6px;
		border-radius: 3px;
		background: #ddd;
		appearance: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 18px;
		height: 18px;
		border-radius: 50%;
		background: #667eea;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0,0,0,0.2);
	}

	select {
		width: 100%;
		padding: 8px 12px;
		border: 2px solid #ddd;
		border-radius: 6px;
		font-size: 14px;
		background: white;
		cursor: pointer;
	}

	select:focus {
		outline: none;
		border-color: #667eea;
	}

	.nav-buttons {
		display: flex;
		gap: 8px;
	}

	.nav-btn {
		flex: 1;
		padding: 8px 12px;
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

	/* Legend */
	.legend {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.9rem;
	}

	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		border: 1px solid #ccc;
	}

	.no-layers {
		color: #999;
		font-style: italic;
		margin: 0;
	}

	/* Map */
	.map-main {
		flex: 1;
		position: relative;
		background: #e8f4f8;
	}

	.map-container {
		width: 100%;
		height: 100%;
	}

	.map-loading {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		text-align: center;
		z-index: 10;
		color: #667eea;
	}

	.loading-spinner {
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

	/* Map Overlay */
	.map-overlay {
		position: absolute;
		top: 20px;
		right: 20px;
		background: rgba(255, 255, 255, 0.95);
		padding: 15px;
		border-radius: 8px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		backdrop-filter: blur(10px);
	}

	.overlay-info {
		text-align: right;
		font-size: 0.9rem;
	}

	.active-layers-count {
		font-weight: 600;
		color: #333;
		margin-bottom: 5px;
	}

	.data-source {
		color: #666;
		font-size: 0.8rem;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.map-interface {
			flex-direction: column;
		}

		.map-sidebar {
			width: 100%;
			height: 300px;
			border-right: none;
			border-bottom: 1px solid #ddd;
		}

		.map-main {
			height: calc(100vh - 400px);
		}

		.control-section {
			padding: 15px;
		}

		.nav-buttons {
			flex-direction: column;
		}
	}
</style>