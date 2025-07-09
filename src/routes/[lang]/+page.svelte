<!-- src/routes/[lang]/+page.svelte - Language-specific homepage -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { currentLanguage } from '$lib/stores/language.js';
	// import Header from '$lib/components/Header.svelte';
	// import MainWeather from '$lib/components/MainWeather.svelte';
	import HourlyForecast from '$lib/components/HourlyForecast.svelte';
	// import WeatherChart from '$lib/components/WeatherChart.svelte';
	// import WeatherDetails from '$lib/components/WeatherDetails.svelte';
	// import WeatherMap from '$lib/components/WeatherMap.svelte';
	// import AlertsNews from '$lib/components/AlertsNews.svelte';
	// import SavedPlaces from '$lib/components/SavedPlaces.svelte';
	import Navigation from '$lib/components/Navigation.svelte';
	import SearchModal from '$lib/components/SearchModal.svelte';

	export let data; // From +layout.js

	let currentCity = 'bratislava'; // Use translation key
	let weatherData = {};
	let showMenu = false;
	let showSearch = false;

    let hourlyData = [];
    let loading = false;
    let error = null;

    onMount(() => {
        fetchWeatherData(currentCity);
    });

    const API_BASE = 'https://backend-red-sea-8652.fly.dev';

    async function fetchWeatherData(city) {
	loading = true;
	error = null;

	try {
		const url = `${API_BASE}/api/weather-free/${encodeURIComponent(city)}`;
		const res = await fetch(url);
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);

		const result = await res.json();

		// 🔁 Transformuj do formátu očakávaného komponentom
		hourlyData = [{
			time: new Date(result.timestamp),
			temperature: result.weather.temperature,
			precipitationProbability: 0, // nie je v OpenMeteo – môžeš neskôr doplniť
			windSpeed: result.weather.windSpeed,
			humidity: result.weather.humidity,
			weatherCode: result.weather.weatherCode
		}];

		currentCity = city;

	} catch (err) {
		error = err.message;
		hourlyData = [];
	} finally {
		loading = false;
	}
}



	// SEO meta tags per language
	$: metaTags = {
		sk: {
			title: 'MeteoMy - Presné počasie v reálnom čase',
			description: 'Globálna météo platforma s AI-powered content. Presné počasie pre akúkoľvek lokalitu na svete.'
		},
		en: {
			title: 'MeteoMy - Accurate real-time weather',
			description: 'Global weather platform with AI-powered content. Accurate weather for any location worldwide.'
		},
		de: {
			title: 'MeteoMy - Präzises Echtzeit-Wetter',
			description: 'Globale Wetter-Plattform mit KI-gestützten Inhalten. Präzise Wettervorhersagen für jeden Ort weltweit.'
		}
	};

	$: currentMeta = metaTags[$currentLanguage] || metaTags.sk;
</script>

<svelte:head>
	<title>{currentMeta.title}</title>
	<meta name="description" content={currentMeta.description} />
	
	<!-- Open Graph meta tags -->
	<meta property="og:title" content={currentMeta.title} />
	<meta property="og:description" content={currentMeta.description} />
	<meta property="og:locale" content="{$currentLanguage}_SK" />
	<meta property="og:url" content="https://meteomy.com/{$currentLanguage}" />
	
	<!-- Language alternates -->
	<link rel="alternate" hreflang="sk" href="https://meteomy.com/sk" />
	<link rel="alternate" hreflang="en" href="https://meteomy.com/en" />
	<link rel="alternate" hreflang="de" href="https://meteomy.com/de" />
	<link rel="alternate" hreflang="x-default" href="https://meteomy.com/sk" />
	
	<!-- Canonical URL -->
	<link rel="canonical" href="https://meteomy.com/{$currentLanguage}" />
</svelte:head>

<div class="app-container">
	<!-- Navigation Menu -->
	<Navigation bind:showMenu />

	<!-- Main App Container -->
	<div class="container">
		<!-- Header -->
		<!-- <Header 
			bind:showMenu 
			bind:showSearch 
		/> -->

		<!-- Main Weather Display -->
		<!-- <MainWeather 
			{currentCity}
			{weatherData}
		/> -->

		<!-- Hourly Forecast -->
		<!-- HOURLY FORECAST -->
        <HourlyForecast
            location={currentCity}
            {hourlyData}
            {loading}
            {error}
        />

		<!-- Weather Chart Component -->
		<!-- <WeatherChart /> -->

		<!-- Weather Details Grid -->
		<!-- <WeatherDetails /> -->

		<!-- Weather Map -->
		<!-- <WeatherMap /> -->

		<!-- Alerts & News -->
		<!-- <AlertsNews /> -->

		<!-- Saved Places -->
		<!-- <SavedPlaces 
			on:citySelect={(e) => {
				currentCity = e.detail;
				loadWeather(currentCity);
			}}
		/> -->
	</div>

	<!-- Search Modal -->
	<SearchModal 
        bind:showSearch
        on:citySelect={(e) => {
            currentCity = e.detail;
            fetchWeatherData(currentCity);
        }}
    />

</div>

<style>
	.app-container {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
		min-height: 100vh;
		color: #333;
	}

	.container {
		max-width: 400px;
		margin: 0 auto;
		background: white;
		min-height: 100vh;
		box-shadow: 0 0 30px rgba(0,0,0,0.1);
		position: relative;
	}

	@media (max-width: 480px) {
		.container {
			max-width: 100%;
		}
	}
</style>