<!-- src/routes/weather/[location]/+page.svelte -->
<svelte:head>
	<title>Weather {location} - Weather App Pro</title>
	<meta name="description" content="Current weather conditions for {location}" />
</svelte:head>

<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	// Get location from URL
	$: location = $page.params.location || '';

	// Weather data
	let weatherData = null;
	let loading = true;
	let error = null;

	// API configuration
	// const API_BASE_URL = 'https://weather-app-backend-ug2o.onrender.com'; // old connect render.com backend python
	const API_BASE_URL = import.meta.env.PUBLIC_API_BASE_URL;

	async function fetchWeather() {
		if (!location) return;
		
		try {
			loading = true;
			error = null;
			
			const response = await fetch(`${API_BASE_URL}/api/weather/${encodeURIComponent(location)}`);
			
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
				throw new Error(errorData.detail || `HTTP ${response.status}`);
			}

			weatherData = await response.json();
		} catch (err) {
			console.error('Weather fetch error:', err);
			error = err.message || 'Failed to fetch weather data';
			weatherData = null;
		} finally {
			loading = false;
		}
	}

	// Weather icon mapping
	function getWeatherIcon(code) {
		const icons = {
			1000: "☀️", 1100: "🌤️", 1101: "⛅", 1102: "🌥️", 1001: "☁️",
			2000: "🌫️", 2100: "🌫️", 4000: "🌦️", 4001: "🌧️", 4200: "🌦️", 
			4201: "⛈️", 5000: "🌨️", 5001: "❄️", 5100: "🌨️", 5101: "❄️",
			6000: "🌧️", 6001: "🧊", 6200: "🧊", 6201: "🧊", 7000: "🧊", 
			7101: "🧊", 7102: "🧊", 8000: "⛈️"
		};
		return icons[code] || "🌤️";
	}

	function getWeatherDescription(code) {
		const descriptions = {
			1000: "Jasno, slnečno", 1100: "Prevažne jasno", 1101: "Čiastočne zamračené",
			1102: "Prevažne zamračené", 1001: "Zamračené", 2000: "Hmla", 2100: "Ľahká hmla",
			4000: "Mrholenie", 4001: "Dážď", 4200: "Ľahký dážď", 4201: "Silný dážď",
			5000: "Sneh", 5001: "Snehové vločky", 5100: "Ľahký sneh", 5101: "Silný sneh",
			6000: "Mrznúce mrholenie", 6001: "Mrznúci dážď", 6200: "Ľahký mrznúci dážď",
			6201: "Silný mrznúci dážď", 7000: "Ľadové guľôčky", 7101: "Silné ľadové guľôčky",
			7102: "Ľahké ľadové guľôčky", 8000: "Búrka"
		};
		return descriptions[code] || "Neznáme počasie";
	}

	function getWindDirection(degrees) {
		const directions = [
			"Sever", "Severovýchod", "Východ", "Juhovýchod",
			"Juh", "Juhozápad", "Západ", "Severozápad"
		];
		const index = Math.round(degrees / 45) % 8;
		return directions[index];
	}

	onMount(() => {
		if (location) {
			fetchWeather();
		}
	});

	// Refetch when location changes
	$: if (location) {
		fetchWeather();
	}
</script>

<div class="content">
	<h1>📍 Weather for {location}</h1>

	{#if loading}
		<div class="loading">
			<p>⏳ Loading weather data...</p>
		</div>

	{:else if error}
		<div class="error">
			<h2>❌ Error</h2>
			<p>{error}</p>
			<button on:click={fetchWeather} class="retry-btn">
				🔄 Try Again
			</button>
		</div>

	{:else if weatherData}
		<div class="weather-card">
			<div class="main-weather">
				<div class="weather-icon">
					{getWeatherIcon(weatherData.weather.weatherCode)}
				</div>
				<div class="temperature">
					{Math.round(weatherData.weather.temperature)}°C
				</div>
			</div>

			<div class="weather-description">
				{getWeatherDescription(weatherData.weather.weatherCode)}
			</div>

			<div class="weather-details">
				<div class="detail-row">
					<span class="detail-label">💧 Humidity:</span>
					<span class="detail-value">{weatherData.weather.humidity}%</span>
				</div>

				<div class="detail-row">
					<span class="detail-label">💨 Wind:</span>
					<span class="detail-value">
						{weatherData.weather.windSpeed.toFixed(1)} m/s 
						{getWindDirection(weatherData.weather.windDirection)}
					</span>
				</div>

				<div class="detail-row">
					<span class="detail-label">👁️ Visibility:</span>
					<span class="detail-value">{weatherData.weather.visibility} km</span>
				</div>

				<div class="detail-row">
					<span class="detail-label">☁️ Cloud Cover:</span>
					<span class="detail-value">{weatherData.weather.cloudCover}%</span>
				</div>
			</div>

			<div class="weather-footer">
				<small>Last updated: {new Date().toLocaleString()}</small>
				<br>
				<small>Powered by Tomorrow.io</small>
			</div>
		</div>

		<button on:click={fetchWeather} class="refresh-btn">
			🔄 Refresh Weather
		</button>

	{:else}
		<div class="no-data">
			<p>No weather data available for {location}</p>
		</div>
	{/if}

	<div class="navigation">
		<a href="/weather">← Search Another City</a>
		<span> | </span>
		<a href="/">🏠 Home</a>
	</div>
</div>

<style>
	.content {
		width: 100%;
		max-width: var(--column-width);
		margin: var(--column-margin-top) auto 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		text-align: center;
		margin-bottom: 2rem;
	}

	.loading, .error, .no-data {
		text-align: center;
		padding: 2rem;
		background: #f9f9f9;
		border-radius: 10px;
		margin: 1rem 0;
	}

	.error {
		background: #ffe6e6;
		border: 2px solid #ff4444;
	}

	.retry-btn {
		margin-top: 1rem;
		padding: 0.5rem 1rem;
		background: #ff4444;
		color: white;
		border: none;
		border-radius: 5px;
		cursor: pointer;
	}

	.weather-card {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: 15px;
		padding: 2rem;
		margin: 2rem 0;
		text-align: center;
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
	}

	.main-weather {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 1rem;
	}

	.weather-icon {
		font-size: 4rem;
	}

	.temperature {
		font-size: 3.5rem;
		font-weight: bold;
	}

	.weather-description {
		font-size: 1.3rem;
		margin-bottom: 2rem;
		opacity: 0.9;
	}

	.weather-details {
		display: grid;
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: rgba(255, 255, 255, 0.1);
		padding: 0.75rem 1rem;
		border-radius: 8px;
	}

	.detail-label {
		font-weight: 500;
	}

	.detail-value {
		font-weight: bold;
	}

	.weather-footer {
		opacity: 0.8;
		font-size: 0.9rem;
		border-top: 1px solid rgba(255, 255, 255, 0.2);
		padding-top: 1rem;
	}

	.refresh-btn {
		display: block;
		margin: 1rem auto;
		padding: 0.75rem 1.5rem;
		background: #007acc;
		color: white;
		border: none;
		border-radius: 8px;
		cursor: pointer;
		font-weight: bold;
	}

	.refresh-btn:hover {
		background: #005fa3;
	}

	.navigation {
		text-align: center;
		margin: 2rem 0;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
	}

	.navigation a {
		color: #007acc;
		text-decoration: none;
		font-weight: 500;
	}

	.navigation a:hover {
		text-decoration: underline;
	}

	@media (max-width: 600px) {
		.main-weather {
			flex-direction: column;
			gap: 1rem;
		}

		.weather-icon {
			font-size: 3rem;
		}

		.temperature {
			font-size: 2.5rem;
		}

		.detail-row {
			flex-direction: column;
			gap: 0.5rem;
			text-align: center;
		}
	}
</style>
