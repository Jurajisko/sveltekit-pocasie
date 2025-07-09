<!-- src/routes/[lang]/+layout.svelte - Language-specific layout -->
<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { switchLanguage, currentLanguage } from '$lib/stores/language.js';
	import { error } from '@sveltejs/kit';

	// Supported languages
	const supportedLanguages = ['sk', 'en', 'de'];

	$: lang = $page.params.lang;

	// Validate language parameter
	$: if (lang && !supportedLanguages.includes(lang)) {
		throw error(404, 'Language not supported');
	}

	onMount(() => {
		if (lang && supportedLanguages.includes(lang)) {
			switchLanguage(lang);
		}
	});

	// Update language when route changes
	$: if (lang && lang !== $currentLanguage) {
		switchLanguage(lang);
	}
</script>

<slot />

<!-- src/routes/[lang]/+layout.js - Layout load function -->
<script context="module">
	export async function load({ params }) {
		const { lang } = params;
		const supportedLanguages = ['sk', 'en', 'de'];
		
		// Validate language
		if (!supportedLanguages.includes(lang)) {
			throw error(404, 'Language not supported');
		}
		
		return {
			lang
		};
	}
</script>