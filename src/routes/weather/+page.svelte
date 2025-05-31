<!-- src/routes/weather/+page.svelte -->
<svelte:head>
	<title>Weather Search - Weather App Pro</title>
	<meta name="description" content="Search weather for any location worldwide" />
</svelte:head>

<script>
	import { goto } from '$app/navigation';

	let searchLocation = '';

	function handleSearch(event) {
		event.preventDefault();
		if (!searchLocation.trim()) return;
		const cleanLocation = searchLocation.trim();
		goto(`/weather/${encodeURIComponent(cleanLocation)}`);
	}

	function selectLocation(selectedLocation) {
		goto(`/weather/${encodeURIComponent(selectedLocation)}`);
	}

	const popularLocations = [
		'Bratislava', 'Košice', 'Prešov', 'Žilina', 
		'Banská Bystrica', 'Nitra', 'Trnava', 'Martin'
	];

	const internationalCities = [
		'Praha', 'Wien', 'Budapest', 'Warsaw', 
		'Munich', 'London', 'Paris', 'New York'
	];
</script>

<div class="content">
	<h1>🌤️ Weather Search</h1>
	
	<p>
		Get accurate weather information for any location worldwide. 
		Enter a city name below or select from popular cities.
	</p>

	<form on:submit={handleSearch} class="search-form">
		<div class="search-group">
			<input
				bind:value={searchLocation}
				type="text"
				placeholder="Enter city name..."
				class="search-input"
			>
			<button type="submit" disabled={!searchLocation.trim()} class="search-btn">
				🔍 Search Weather
			</button>
		</div>
	</form>

	<div class="location-groups">
		<div class="location-group">
			<h3>🇸🇰 Slovakia</h3>
			<div class="city-buttons">
				{#each popularLocations as city}
					<button 
						class="city-btn"
						on:click={() => selectLocation(city)}
					>
						{city}
					</button>
				{/each}
			</div>
		</div>

		<div class="location-group">
			<h3>🌍 International</h3>
			<div class="city-buttons">
				{#each internationalCities as city}
					<button 
						class="city-btn"
						on:click={() => selectLocation(city)}
					>
						{city}
					</button>
				{/each}
			</div>
		</div>
	</div>

	<p>
		<a href="/">← Back to Home</a>
	</p>
</div>

<style>
	.content {
		width: 100%;
		max-width: var(--column-width);
		margin: var(--column-margin-top) auto 0 auto;
		padding: 2rem;
	}

	h1 {
		font-size: 2.5rem;
		text-align: center;
		margin-bottom: 1rem;
	}

	.search-form {
		margin: 2rem 0;
	}

	.search-group {
		display: flex;
		gap: 1rem;
		max-width: 500px;
		margin: 0 auto;
	}

	.search-input {
		flex: 1;
		padding: 0.75rem 1rem;
		border: 2px solid #ddd;
		border-radius: 8px;
		font-size: 1rem;
	}

	.search-input:focus {
		outline: none;
		border-color: #007acc;
	}

	.search-btn {
		padding: 0.75rem 1.5rem;
		background: #007acc;
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: bold;
		cursor: pointer;
	}

	.search-btn:hover:not(:disabled) {
		background: #005fa3;
	}

	.search-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.location-groups {
		margin: 3rem 0;
	}

	.location-group {
		margin: 2rem 0;
		text-align: center;
	}

	.location-group h3 {
		margin-bottom: 1rem;
		font-size: 1.3rem;
	}

	.city-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		justify-content: center;
	}

	.city-btn {
		padding: 0.5rem 1rem;
		background: #f0f8ff;
		border: 2px solid #007acc;
		border-radius: 20px;
		cursor: pointer;
		transition: all 0.2s;
	}

	.city-btn:hover {
		background: #007acc;
		color: white;
	}

	@media (max-width: 600px) {
		.search-group {
			flex-direction: column;
		}
		
		.city-buttons {
			gap: 0.3rem;
		}
		
		.city-btn {
			padding: 0.4rem 0.8rem;
			font-size: 0.9rem;
		}
	}
</style>
