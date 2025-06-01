<!-- src/routes/map/+page.svelte -->
<script>
	// Tomorrow.io API konfigurácia
	const API_KEY = 'CoemxyXvE8oBM2nuW2iQ5Ka0X560eUnd';
	
	// Dostupné weather layers
	const weatherLayers = [
		{ id: 'precipitationIntensity', name: '🌧️ Zrážky', color: '#3B82F6' },
		{ id: 'temperature', name: '🌡️ Teplota', color: '#EF4444' },
		{ id: 'windSpeed', name: '💨 Vietor', color: '#10B981' },
		{ id: 'cloudCover', name: '☁️ Oblačnosť', color: '#9CA3AF' },
		{ id: 'humidity', name: '💧 Vlhkosť', color: '#06B6D4' }
	];

	let selectedLayer = weatherLayers[0];
	let opacity = 70;

	function selectLayer(layer) {
		selectedLayer = layer;
	}
</script>

<svelte:head>
	<title>Weather Map - Počasie na mape</title>
</svelte:head>

<main class="weather-map">
	
	<!-- Header -->
	<header class="header">
		<h1>🗺️ Weather Map Pro</h1>
		<p>Interaktívna mapa s weather vrstvami</p>
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
							class:active={selectedLayer.id === layer.id}
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
					<input type="range" min="10" max="100" bind:value={opacity} />
				</label>
			</div>

			<div class="section">
				<h3>📊 Aktívna vrstva</h3>
				<div class="current-layer">
					<div class="layer-info">
						<h4>{selectedLayer.name}</h4>
						<p>API: {selectedLayer.id}</p>
						<p>Farba: {selectedLayer.color}</p>
					</div>
				</div>
			</div>

		</aside>

		<!-- Map Area -->
		<main class="map-area">
			
			<div class="map-header">
				<h3>🗺️ {selectedLayer.name}</h3>
				<span>Slovakia & Europe</span>
			</div>

			<!-- Simulated Map -->
			<div class="map-container">
				<div class="map-grid">
					{#each Array(20) as _, i}
						<div 
							class="tile"
							style="
								background: {selectedLayer.color}; 
								opacity: {opacity / 100};
								animation-delay: {i * 0.1}s;
							"
						></div>
					{/each}
				</div>

				<!-- Sample Data Points -->
				<div class="data-points">
					{#if selectedLayer.id === 'precipitationIntensity'}
						<div class="point" style="top: 30%; left: 40%;">🌧️ 2.5mm</div>
						<div class="point" style="top: 60%; left: 70%;">☔ 5.1mm</div>
					{:else if selectedLayer.id === 'temperature'}
						<div class="point" style="top: 25%; left: 35%;">🌡️ 23°C</div>
						<div class="point" style="top: 65%; left: 60%;">🌡️ 18°C</div>
					{:else if selectedLayer.id === 'windSpeed'}
						<div class="point" style="top: 40%; left: 50%;">💨 12km/h</div>
						<div class="point" style="top: 70%; left: 30%;">🌪️ 25km/h</div>
					{:else if selectedLayer.id === 'cloudCover'}
						<div class="point" style="top: 35%; left: 45%;">☁️ 75%</div>
						<div class="point" style="top: 55%; left: 65%;">⛅ 45%</div>
					{:else}
						<div class="point" style="top: 45%; left: 40%;">💧 65%</div>
						<div class="point" style="top: 65%; left: 55%;">💧 80%</div>
					{/if}
				</div>
			</div>

			<!-- API Info -->
			<div class="api-info">
				<h4>🔗 Tomorrow.io API Tile URL:</h4>
				<code>
					https://api.tomorrow.io/v4/map/tile/z/x/y/{selectedLayer.id}/current.png?apikey={API_KEY}
				</code>
			</div>

		</main>

	</div>

</main>

<style>
	.weather-map {
		min-height: 100vh;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: #f5f5f5;
	}

	.header {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 30px 20px;
		text-align: center;
	}

	.header h1 {
		margin: 0 0 10px;
		font-size: 2.5rem;
	}

	.header p {
		margin: 0;
		font-size: 1.2rem;
		opacity: 0.9;
	}

	.content {
		display: flex;
		min-height: calc(100vh - 140px);
	}

	/* Sidebar */
	.sidebar {
		width: 300px;
		background: white;
		border-right: 1px solid #ddd;
		padding: 0;
	}

	.section {
		padding: 20px;
		border-bottom: 1px solid #f0f0f0;
	}

	.section h3 {
		margin: 0 0 15px;
		color: #333;
		font-size: 1.1rem;
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
	}

	input[type="range"] {
		width: 100%;
		margin-top: 8px;
	}

	.current-layer {
		background: #f8f9fa;
		padding: 15px;
		border-radius: 8px;
	}

	.layer-info h4 {
		margin: 0 0 8px;
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
		padding: 20px;
	}

	.map-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 20px;
		padding: 15px 20px;
		background: white;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.map-header h3 {
		margin: 0;
		color: #333;
	}

	.map-header span {
		color: #666;
		font-weight: 500;
	}

	.map-container {
		position: relative;
		background: white;
		border-radius: 12px;
		padding: 20px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.1);
		min-height: 400px;
		margin-bottom: 20px;
	}

	.map-grid {
		display: grid;
		grid-template-columns: repeat(5, 1fr);
		grid-template-rows: repeat(4, 1fr);
		gap: 3px;
		height: 300px;
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		padding: 10px;
		background: #f9f9f9;
	}

	.tile {
		border-radius: 4px;
		animation: fadeIn 0.6s ease-out;
		transition: opacity 0.3s ease;
	}

	@keyframes fadeIn {
		from { opacity: 0; transform: scale(0.8); }
		to { opacity: 1; transform: scale(1); }
	}

	.data-points {
		position: absolute;
		top: 40px;
		left: 40px;
		right: 40px;
		bottom: 40px;
		pointer-events: none;
	}

	.point {
		position: absolute;
		background: rgba(255,255,255,0.95);
		padding: 6px 12px;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: bold;
		color: #333;
		box-shadow: 0 3px 10px rgba(0,0,0,0.2);
		border: 2px solid white;
		animation: bounce 0.8s ease-out;
	}

	@keyframes bounce {
		0% { transform: translateY(20px); opacity: 0; }
		50% { transform: translateY(-5px); opacity: 0.8; }
		100% { transform: translateY(0); opacity: 1; }
	}

	.api-info {
		background: white;
		padding: 20px;
		border-radius: 10px;
		box-shadow: 0 2px 8px rgba(0,0,0,0.1);
	}

	.api-info h4 {
		margin: 0 0 12px;
		color: #333;
	}

	.api-info code {
		display: block;
		background: #f1f3f4;
		padding: 12px;
		border-radius: 6px;
		font-family: 'Courier New', monospace;
		font-size: 0.85rem;
		color: #333;
		word-break: break-all;
		border-left: 4px solid #667eea;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.content {
			flex-direction: column;
		}

		.sidebar {
			width: 100%;
		}

		.map-grid {
			grid-template-columns: repeat(4, 1fr);
			height: 250px;
		}

		.header h1 {
			font-size: 2rem;
		}

		.map-header {
			flex-direction: column;
			gap: 10px;
			text-align: center;
		}
	}
</style>