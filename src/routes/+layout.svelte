<script>
	import '../app.css';
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import { onMount } from 'svelte';

	onMount(() => {
		const script = document.createElement('script');
		script.async = true;
		script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-app-pub-3940256099942544';
		script.crossOrigin = 'anonymous';
		document.head.appendChild(script);
	});
</script>

<ThemeSwitcher />

<main>
	<slot />
</main>

<style>
	main {
		flex: 1;
		display: flex;
		flex-direction: column;
		width: 100vw;
		height: 100vh;
		box-sizing: border-box;
	}
</style>
