<script>
	import { createEventDispatcher } from 'svelte';
	
	export let location = null;          // Miesto pre radar
	export let mapTilerApiKey = 'HRokFyxYunZX6lQ5';
	
	const dispatch = createEventDispatcher();
	
	// Default centrum ak nie je location
	let centerLng = 19.5;  // Slovensko default
	let centerLat = 48.7;
	let locationName = 'Slovensko';
	
	// Ak máme location, použijeme ho
	if (location) {
		if (location.coordinates) {
			[centerLng, centerLat] = location.coordinates;
			locationName = location.name || 'Vybraná lokalita';
		} else if (location.longitude && location.latitude) {
			centerLng = location.longitude;
			centerLat = location.latitude;
			locationName = location.name || 'Vybraná lokalita';
		} else if (location.coords) {
			[centerLng, centerLat] = location.coords;
			locationName = location.name || 'Vybraná lokalita';
		} else if (Array.isArray(location)) {
			[centerLng, centerLat] = location;
		}
	}
	
	// MapTiler Static API pre radar screenshot
	const zoom = 8;
	const width = 600;
	const height = 400;
	
	// ✅ STATIC RADAR IMAGE URL
	const staticRadarUrl = `https://api.maptiler.com/maps/basic/static/${centerLng},${centerLat},${zoom}/${width}x${height}.png?key=${mapTilerApiKey}&attribution=false`;
	
	// ✅ FULL RADAR URL - presmerovanie na plnú mapu
	const fullRadarUrl = `https://maps.maptiler.com/weather/?center=${centerLng},${centerLat}&zoom=${zoom}&layer=radar#${centerLng}/${centerLat}/${zoom}`;
	
	// ✅ CLICK HANDLER
	function openFullRadar() {
		console.log('🗺️ Opening full radar for:', locationName);
		
		// Event pre parent komponentu
		dispatch('radarOpened', {
			location: { lng: centerLng, lat: centerLat, name: locationName },
			url: fullRadarUrl
		});
		
		// Otvor v novom okne
		window.open(fullRadarUrl, '_blank');
	}
	
	// ✅ REACTIVITY - update obrázka pri zmene location
	$: if (location) {
		console.log('📍 Location updated for radar preview:', location);
	}
</script>

<div class="radar-preview-container">
	<!-- ✅ HEADER -->
	<div class="radar-header">
		<div class="radar-info">
			<span class="radar-icon">📡</span>
			<div class="radar-details">
				<strong>Radar</strong>
				<span class="location-name">{locationName}</span>
			</div>
		</div>
		<div class="radar-badge">
			<span class="live-indicator">●</span>
			LIVE
		</div>
	</div>
	
	<!-- ✅ STATIC RADAR IMAGE -->
	<div class="radar-image-container" on:click={openFullRadar} role="button" tabindex="0">
		<img 
			src={staticRadarUrl} 
			alt="Radar pre {locationName}"
			class="radar-image"
			loading="lazy"
		/>
		
		<!-- ✅ OVERLAY CONTROLS -->
		<div class="radar-overlay">
			<div class="location-marker">
				<div class="marker-dot"></div>
				<div class="marker-pulse"></div>
			</div>
			
			<div class="open-button">
				<span class="expand-icon">⛶</span>
				Otvoriť radar
			</div>
		</div>
		
		<!-- ✅ LOADING STATE -->
		<div class="loading-placeholder">
			<div class="loading-spinner"></div>
			<p>Načítava radar...</p>
		</div>
	</div>
	
	<!-- ✅ FOOTER INFO -->
	<div class="radar-footer">
		<span class="data-source">MapTiler Weather</span>
		<span class="click-hint">Kliknite pre detailný radar</span>
	</div>
</div>

<style>
	.radar-preview-container {
		width: 100%;
		max-width: 600px;
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		background: white;
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}
	
	.radar-preview-container:hover {
		transform: translateY(-2px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
	}
	
	.radar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 16px;
		background: linear-gradient(135deg, #1e3c72, #2a5298);
		color: white;
	}
	
	.radar-info {
		display: flex;
		align-items: center;
		gap: 10px;
	}
	
	.radar-icon {
		font-size: 20px;
		animation: pulse 2s infinite;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}
	
	.radar-details strong {
		display: block;
		font-size: 16px;
		font-weight: 600;
	}
	
	.location-name {
		font-size: 12px;
		opacity: 0.9;
		color: #b8d4f0;
	}
	
	.radar-badge {
		display: flex;
		align-items: center;
		gap: 4px;
		background: rgba(255, 255, 255, 0.2);
		padding: 4px 8px;
		border-radius: 12px;
		font-size: 11px;
		font-weight: 600;
	}
	
	.live-indicator {
		color: #4ade80;
		font-size: 8px;
		animation: blink 1.5s infinite;
	}
	
	@keyframes blink {
		0%, 50% { opacity: 1; }
		51%, 100% { opacity: 0.3; }
	}
	
	.radar-image-container {
		position: relative;
		cursor: pointer;
		height: 300px;
		overflow: hidden;
		background: #1a1a1a;
	}
	
	.radar-image {
		width: 100%;
		height: 100%;
		object-fit: cover;
		transition: transform 0.3s ease;
	}
	
	.radar-image-container:hover .radar-image {
		transform: scale(1.02);
	}
	
	.radar-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.1);
		opacity: 0;
		transition: opacity 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.radar-image-container:hover .radar-overlay {
		opacity: 1;
	}
	
	.location-marker {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	
	.marker-dot {
		width: 12px;
		height: 12px;
		background: #ff0000;
		border: 2px solid white;
		border-radius: 50%;
		position: relative;
		z-index: 2;
	}
	
	.marker-pulse {
		position: absolute;
		top: -4px;
		left: -4px;
		width: 20px;
		height: 20px;
		border: 2px solid #ff0000;
		border-radius: 50%;
		animation: pulse-ring 2s infinite;
	}
	
	@keyframes pulse-ring {
		0% {
			transform: scale(0.8);
			opacity: 1;
		}
		100% {
			transform: scale(2);
			opacity: 0;
		}
	}
	
	.open-button {
		background: rgba(0, 102, 204, 0.9);
		color: white;
		padding: 12px 20px;
		border-radius: 8px;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 8px;
		transform: translateY(10px);
		transition: transform 0.3s ease;
	}
	
	.radar-image-container:hover .open-button {
		transform: translateY(0);
	}
	
	.expand-icon {
		font-size: 18px;
	}
	
	.loading-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: #f5f5f5;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: #666;
		z-index: 1;
	}
	
	.radar-image:loaded ~ .loading-placeholder {
		display: none;
	}
	
	.loading-spinner {
		width: 32px;
		height: 32px;
		border: 3px solid #e0e0e0;
		border-top: 3px solid #0066cc;
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 12px;
	}
	
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	
	.radar-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 16px;
		background: #f8f9fa;
		font-size: 11px;
		color: #666;
	}
	
	.data-source {
		font-weight: 500;
	}
	
	.click-hint {
		color: #0066cc;
		font-weight: 500;
	}
	
	/* Responsive design */
	@media (max-width: 768px) {
		.radar-preview-container {
			max-width: 100%;
		}
		
		.radar-image-container {
			height: 250px;
		}
		
		.radar-header {
			padding: 10px 12px;
		}
		
		.radar-details strong {
			font-size: 14px;
		}
		
		.open-button {
			padding: 10px 16px;
			font-size: 14px;
		}
		
		.radar-footer {
			padding: 6px 12px;
			font-size: 10px;
		}
	}
	
	/* Focus states pre accessibility */
	.radar-image-container:focus {
		outline: 2px solid #0066cc;
		outline-offset: 2px;
	}
	
	.radar-image-container:focus .radar-overlay {
		opacity: 1;
	}
</style>