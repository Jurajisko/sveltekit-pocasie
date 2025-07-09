<!-- src/lib/components/SearchModal.svelte - Updated with multilang --->
<script>
	import { createEventDispatcher } from 'svelte';
	import { currentLanguage } from '$lib/stores/language.js';
	import { unidecode } from 'unidecode';



	const dispatch = createEventDispatcher();

	export let showSearch = false;

	let searchQuery = '';
	let searchResults = [];

	function closeSearch() {
		showSearch = false;
		searchQuery = '';
		searchResults = [];
	}

	function selectCity(cityName) {
		const cleaned = unidecode(cityName.trim());
		dispatch('citySelect', cleaned);
		closeSearch();
	}


	// Simple mock search for now
	function searchCities(query) {
		if (query.length < 2) {
			searchResults = [];
			return;
		}

		// Mock search results with translation keys
		const mockCities = [
			{ name: 'bratislava', region: 'Slovakia', displayName: 'Bratislava' },
			{ name: 'prague', region: 'Czech Republic', displayName: 'Prague' },
			{ name: 'vienna', region: 'Austria', displayName: 'Vienna' },
			{ name: 'budapest', region: 'Hungary', displayName: 'Budapest' },
			{ name: 'berlin', region: 'Germany', displayName: 'Berlin' }
		];

		searchResults = mockCities.filter(city => 
			city.displayName.toLowerCase().includes(query.toLowerCase()) ||
			city.region.toLowerCase().includes(query.toLowerCase())
		);
	}

	$: searchCities(searchQuery);
</script>

{#if showSearch}
	<div class="search-modal">
		<div class="search-header">
			<button class="back-btn" on:click={closeSearch}>←</button>
			<input 
				type="text" 
				class="search-input" 
				placeholder={$currentLanguage === 'sk' ? 'Zadajte názov mesta...' : 
							$currentLanguage === 'en' ? 'Enter city name...' : 
							'Stadtname eingeben...'}
				bind:value={searchQuery}
				autofocus
			>
		</div>
		<div class="search-results">
			{#each searchResults as city}
				<div class="search-item" on:click={() => selectCity(city.name)}>
					<div class="search-item-name"><T key={city.name} fallback={city.displayName} /></div>
					<div class="search-item-region">{city.region}</div>
				</div>
			{:else}
				{#if searchQuery.length >= 2}
					<div class="no-results">
						<T key="no_results" /> "{searchQuery}"
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<style>
	.search-modal {
		position: fixed;
		top: 0;
		left: 50%;
		transform: translateX(-50%);
		width: 100%;
		max-width: 400px;
		height: 100vh;
		background: white;
		z-index: 1000;
		display: flex;
		flex-direction: column;
	}

	.search-header {
		padding: 20px;
		border-bottom: 1px solid #f3f4f6;
		display: flex;
		align-items: center;
		gap: 15px;
	}

	.back-btn {
		width: 32px;
		height: 32px;
		border: none;
		background: none;
		cursor: pointer;
		color: #6b7280;
		font-size: 18px;
	}

	.search-input {
		flex: 1;
		border: none;
		font-size: 18px;
		outline: none;
		color: #1f2937;
	}

	.search-input::placeholder {
		color: #9ca3af;
	}

	.search-results {
		flex: 1;
		padding: 20px;
		overflow-y: auto;
	}

	.search-item {
		padding: 15px 0;
		border-bottom: 1px solid #f3f4f6;
		cursor: pointer;
		transition: background 0.3s ease;
	}

	.search-item:hover {
		background: #f9fafb;
		border-radius: 8px;
		padding-left: 8px;
		padding-right: 8px;
	}

	.search-item-name {
		font-size: 16px;
		font-weight: 500;
		color: #1f2937;
		margin-bottom: 4px;
	}

	.search-item-region {
		font-size: 14px;
		color: #6b7280;
	}

	.no-results {
		padding: 20px;
		text-align: center;
		color: #6b7280;
		font-style: italic;
	}
</style>