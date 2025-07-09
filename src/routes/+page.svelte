<script>
  // import WeatherMap from '$lib/components/MapTilersFull.svelte';
  // import WeatherMap from '$lib/components/MapTilersNoCDN.svelte';
  // import WindyLayer from '$lib/components/WindyLayer.svelte';
  import WeatherMap from '$lib/components/MapTilersSearch.svelte';

  // import WeatherMap from '$lib/WeatherMap.svelte';
</script>

<svelte:head>
  <title>Weather App Pro - Živé počasie</title>
</svelte:head>

<WeatherMap />




<!-- <WeatherMapSearch /> -->

<!-- Použiť komponent -->
<!-- <WeatherMap 
  width="100vw" 
  height="100vh"
  center={[19.5, 48.7]}
  zoom={7}
/> -->

<!-- Basic usage -->
<!-- <WindyLayer /> -->

<!-- Customized usage -->
<!-- <WindyLayer 
  width="800px" 
  height="500px"
  lat={48.1486}
  lon={17.1077}
  zoom={9}
  overlay="wind"
  level="surface"
  product="ecmwf"
  showControls={true}
/> -->

<!-- Slovensko focus -->
<!-- <WindyLayer
  lat={48.7}
  lon={19.5}
  zoom={7}
  overlay="wind"
  height="400px"
/> -->