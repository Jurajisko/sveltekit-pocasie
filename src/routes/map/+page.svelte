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
		}
	];

	let selectedLayer = weatherLayers[0];
	let opacity = 0.7;
	let mapCenter = { lat: 48.7324, lng: 19.4995 }; // Slovensko
	let zoom = 6;
	let currentTileUrl = '';

	$: {
		// Aktualizuj tile URL keď sa zmení vrstva
		updateTileUrl();
	}

	function updateTileUrl() {
		if (selectedLayer) {
			// Tomorrow.io tile URL template
			currentTileUrl = `https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/${selectedLayer.id}/current.png?apikey=${API_KEY}`;
		}
	}

	function selectLayer(layer) {
		selectedLayer = layer;
		// Označíme ako aktívnu
		weatherLayers.forEach(l => l.active = false);
		layer.active = true;
	}

	function centerOnSlovakia() {
		mapCenter = { lat: 48.7324, lng: 19.4995 };
		zoom = 7;
	}

	function centerOnEurope() {
		mapCenter = { lat: 54.0, lng: 10.0 };
		zoom = 4;
	}

	onMount(() => {
		updateTileUrl();
	});
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
						<button 
							class="layer-item" 
							class:active={layer.active}
							on:click={() => selectLayer(layer)}
						>
							<div class="layer-info">
								<div class="layer-name">{layer.name}</div>
								<div class="layer-desc">{layer.description}</div>
							</div>
							<div class="layer-color" style="background-color: {layer.color}"></div>
						</button>
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
						class="slider"
					/>
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

			<!-- Current Layer Info -->
			<div class="control-section">
				<h3>📊 Aktívna vrstva</h3>
				{#if selectedLayer}
					<div class="current-layer">
						<div class="layer-preview">
							<div class="preview-color" style="background-color: {selectedLayer.color}"></div>
							<div class="preview-info">
								<h4>{selectedLayer.name}</h4>
								<p>{selectedLayer.description}</p>
							</div>
						</div>
						
						<div class="layer-details">
							<p><strong>API Endpoint:</strong> {selectedLayer.id}</p>
							<p><strong>Zdroj:</strong> Tomorrow.io</p>
							<p><strong>Aktualizácia:</strong> Real-time</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- API Info -->
			<div class="control-section">
				<h3>🔗 API Info</h3>
				<div class="api-info">
					<p><strong>Tile URL Pattern:</strong></p>
					<code class="tile-url">
						api.tomorrow.io/v4/map/tile/<br/>
						{z}/{x}/{y}/{selectedLayer?.id || 'layer'}/current.png
					</code>
					
					<p><strong>Podporované formáty:</strong></p>
					<ul>
						<li>PNG tiles (256x256)</li>
						<li>Zoom levels: 1-12</li>
						<li>Real-time + forecast</li>
					</ul>
				</div>
			</div>

		</aside>

		<!-- Map Display Area -->
		<main class="map-main">
			
			<div class="map-display">
				
				<!-- Map Preview -->
				<div class="map-preview">
					<div class="preview-header">
						<h3>🗺️ {selectedLayer?.name || 'Weather Map'}</h3>
						<div class="map-coords">
							Center: {mapCenter.lat.toFixed(2)}°N, {mapCenter.lng.toFixed(2)}°E | Zoom: {zoom}
						</div>
					</div>

					<!-- Simulated Map Tiles -->
					<div class="tile-grid">
						{#each Array(4) as _, row}
							{#each Array(6) as _, col}
								<div 
									class="map-tile"
									style="
										background: linear-gradient(
											{45 + (row * 30) + (col * 15)}deg, 
											{selectedLayer?.color || '#667eea'}20, 
											{selectedLayer?.color || '#667eea'}60
										);
										opacity: {opacity};
									"
								>
									<div class="tile-label">
										{zoom}/{col + row * 6}/{row}
									</div>
								</div>
							{/each}
						{/each}
					</div>

					<!-- Sample Data Overlay -->
					<div class="data-overlay">
						{#if selectedLayer?.id === 'precipitationIntensity'}
							<div class="weather-point" style="top: 30%; left: 40%;">
								<span class="point-icon">🌧️</span>
								<span class="point-value">2.5mm/h</span>
							</div>
							<div class="weather-point" style="top: 60%; left: 70%;">
								<span class="point-icon">☔</span>
								<span class="point-value">5.1mm/h</span>
							</div>
						{:else if selectedLayer?.id === 'temperature'}
							<div class="weather-point" style="top: 25%; left: 35%;">
								<span class="point-icon">🌡️</span>
								<span class="point-value">23°C</span>
							</div>
							<div class="weather-point" style="top: 65%; left: 60%;">
								<span class="point-icon">🌡️</span>
								<span class="point-value">18°C</span>
							</div>
						{:else if selectedLayer?.id === 'windSpeed'}
							<div class="weather-point" style="top: 40%; left: 50%;">
								<span class="point-icon">💨</span>
								<span class="point-value">12 km/h</span>
							</div>
							<div class="weather-point" style="top: 70%; left: 30%;">
								<span class="point-icon">🌪️</span>
								<span class="point-value">25 km/h</span>
							</div>
						{:else if selectedLayer?.id === 'cloudCover'}
							<div class="weather-point" style="top: 35%; left: 45%;">
								<span class="point-icon">☁️</span>
								<span class="point-value">75%</span>
							</div>
							<div class="weather-point" style="top: 55%; left: 65%;">
								<span class="point-icon">⛅</span>
								<span class="point-value">45%</span>
							</div>
						{:else if selectedLayer?.id === 'humidity'}
							<div class="weather-point" style="top: 45%; left: 40%;">
								<span class="point-icon">💧</span>
								<span class="point-value">65%</span>
							</div>
							<div class="weather-point" style="top: 65%; left: 55%;">
								<span class="point-icon">💧</span>
								<span class="point-value">80%</span>
							</div>
						{/if}
					</div>

				</div>

				<!-- Integration Guide -->
				<div class="integration-guide">
					<h4>🔧 Ako integrovať do vlastnej mapy:</h4>
					<div class="code-example">
						<p><strong>Leaflet.js:</strong></p>
						<code>
L.tileLayer('<br/>
&nbsp;&nbsp;'https://api.tomorrow.io/v4/map/tile/{z}/{x}/{y}/{selectedLayer?.id || 'layer'}/current.png?apikey=YOUR_KEY',<br/>
&nbsp;&nbsp;{{ opacity: {opacity} }}<br/>
).addTo(map);
						</code>
					</div>
					
					<div class="code-example">
						<p><strong>Google Maps:</strong></p>
						<code>
new google.maps.ImageMapType({{<br/>
&nbsp;&nbsp;getTileUrl: (coord, zoom) => <br/>
&nbsp;&nbsp;&nbsp;&nbsp;`https://api.tomorrow.io/v4/map/tile/${{zoom}}/${{coord.x}}/${{coord.y}}/{selectedLayer?.id || 'layer'}/current.png?apikey=YOUR_KEY`<br/>
}});
						</code>
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
		width: 100%;
		text-align: left;
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

	/* Current Layer */
	.current-layer {
		background: #f8f9fa;
		padding: 15px;
		border-radius: 8px;
		border: 1px solid #e9ecef;
	}

	.layer-preview {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 15px;
	}

	.preview-color {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 2px solid white;
		box-shadow: 0 2px 6px rgba(0,0,0,0.2);
	}

	.preview-info h4 {
		margin: 0 0 5px;
		color: #333;
	}

	.preview-info p {
		margin: 0;
		font-size: 0.9rem;
		color: #666;
	}

	.layer-details p {
		margin: 5px 0;
		font-size: 0.85rem;
		color: #555;
	}

	/* API Info */
	.api-info {
		font-size: 0.85rem;
	}

	.tile-url {
		display: block;
		background: #f1f3f4;
		padding: 8px;
		border-radius: 4px;
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		color: #333;
		margin: 8px 0 15px;
		word-break: break-all;
	}

	.api-info ul {
		margin: 8px 0;
		padding-left: 20px;
	}

	.api-info li {
		margin: 3px 0;
	}

	/* Map Display */
	.map-main {
		flex: 1;
		background: #e8f4f8;
		overflow-y: auto;
	}

	.map-display {
		padding: 20px;
	}

	.map-preview {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		margin-bottom: 20px;
		position: relative;
		min-height: 400px;
	}

	.preview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 15px;
		border-bottom: 2px solid #f0f0f0;
	}

	.preview-header h3 {
		margin: 0;
		color: #333;
	}

	.map-coords {
		font-size: 0.9rem;
		color: #666;
		font-family: 'Courier New', monospace;
	}

	/* Tile Grid */
	.tile-grid {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 2px;
		height: 300px;
		border: 2px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		position: relative;
	}

	.map-tile {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		color: rgba(255,255,255,0.8);
		font-weight: bold;
		text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
		transition: opacity 0.3s ease;
	}

	.tile-label {
		font-family: 'Courier New', monospace;
	}

	/* Data Overlay */
	.data-overlay {
		position: absolute;
		top: 80px;
		left: 20px;
		right: 20px;
		bottom: 20px;
		pointer-events: none;
	}

	.weather-point {
		position: absolute;
		background: rgba(255,255,255,0.9);
		padding: 6px 10px;
		border-radius: 15px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.2);
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.8rem;
		font-weight: bold;
		color: #333;
		border: 2px solid white;
	}

	.point-icon {
		font-size: 1rem;
	}

	/* Integration Guide */
	.integration-guide {
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
	}

	.integration-guide h4 {
		margin: 0 0 15px;
		color: #333;
	}

	.code-example {
		margin-bottom: 15px;
	}

	.code-example p {
		margin: 0 0 8px;
		font-weight: 600;
		color: #555;
	}

	.code-example code {
		display: block;
		background: #f8f9fa;
		padding: 10px;
		border-radius: 6px;
		font-family: 'Courier New', monospace;
		font-size: 0.8rem;
		color: #333;
		border-left: 4px solid #667eea;
		white-space: pre-wrap;
		overflow-x: auto;
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

		.tile-grid {
			height: 250px;
		}

		.preview-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 10px;
		}
	}
</style>