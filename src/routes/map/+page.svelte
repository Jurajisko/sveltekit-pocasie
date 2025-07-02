<script>
import { onMount } from 'svelte';
import TimeSlider from '$lib/components/TimeSlider.svelte';
import * as maptilersdk from '@maptiler/sdk';
import * as maptilerweather from '@maptiler/weather';

import '@maptiler/sdk/dist/maptiler-sdk.css';
import 'maplibre-gl/dist/maplibre-gl.css';

let map;
let mapDiv;
let activeLayer = null;
let isPlaying = false;
let pointerLngLat = null;
let searchText = '';
let locationResults = [];
let searchMarker = null;

let minTime = 0;
let maxTime = 0;
let currentTime = 0;
let isDragging = false;
let dayMarkers = [];

function generateDayMarkers(start, end) {
	const markers = [];
	const current = new Date(start);
	current.setUTCHours(0, 0, 0, 0);

	while (+current <= end) {
		markers.push({
			time: +current,
			label: current.toLocaleDateString('en-US', { weekday: 'long' })
		});
		current.setUTCDate(current.getUTCDate() + 1);
	}
	return markers;
}

const weatherLayers = {
	precipitation: { layer: null, value: "value", units: " mm", colorRamp: maptilerweather.ColorRamp.builtin.PRECIPITATION },
	pressure: { layer: null, value: "value", units: " hPa", colorRamp: maptilerweather.ColorRamp.builtin.PRESSURE_3 },
	radar: { layer: null, value: "value", units: " dBZ", colorRamp: maptilerweather.ColorRamp.builtin.RADAR },
	temperature: { layer: null, value: "value", units: "°", colorRamp: maptilerweather.ColorRamp.builtin.TEMPERATURE_3 },
	wind: { layer: null, value: "speedMetersPerSecond", units: " m/s", colorRamp: maptilerweather.ColorRamp.builtin.WIND_ROCKET }
};

function updateTime(newVal) {
	const layer = weatherLayers[activeLayer]?.layer;
	if (!layer) return;

	isDragging = true;
	currentTime = +newVal;

	if (isPlaying) {
		layer.animateByFactor(0);
		layer.setAnimationTime(currentTime / 1000);
		requestAnimationFrame(() => {
			layer.animateByFactor(3600);
			isDragging = false;
		});
	} else {
		layer.setAnimationTime(currentTime / 1000);
		isDragging = false;
	}
}

function togglePlay() {
	const layer = weatherLayers[activeLayer]?.layer;
	if (!layer) return;

	if (isPlaying) {
		layer.animateByFactor(0);
		isPlaying = false;
	} else {
		layer.setAnimationTime(currentTime / 1000);
		layer.animateByFactor(3600);
		isPlaying = true;
	}
}

onMount(() => {
	if (!mapDiv) return;
	maptilersdk.config.apiKey = "ry26WCBx6tt715jhxPwh";

	map = new maptilersdk.Map({
		container: mapDiv,
		style: maptilersdk.MapStyle.BACKDROP,
		zoom: 7,
		center: [19.5, 48.7],
		hash: true,
		projection: 'mercator'
	});

	map.on('load', () => {
		map.setPaintProperty("Water", 'fill-color', "rgba(0, 0, 0, 0.4)");
		changeWeatherLayer("wind");
	});

	map.on('mousemove', (e) => updatePointerValue(e.lngLat));
	map.on('mouseout', () => (pointerLngLat = null));
});

function changeWeatherLayer(type) {
	if (activeLayer && map.getLayer(activeLayer)) {
		map.setLayoutProperty(activeLayer, 'visibility', 'none');
	}

	activeLayer = type;

	let layer = weatherLayers[type].layer;
	if (!layer) {
		switch (type) {
			case 'precipitation': layer = new maptilerweather.PrecipitationLayer({ id: type }); break;
			case 'pressure': layer = new maptilerweather.PressureLayer({ id: type }); break;
			case 'radar': layer = new maptilerweather.RadarLayer({ id: type }); break;
			case 'temperature': layer = new maptilerweather.TemperatureLayer({ id: type }); break;
			case 'wind': layer = new maptilerweather.WindLayer({ id: type }); break;
		}

		layer.on("sourceReady", () => {
			const startDate = layer.getAnimationStartDate();
			const endDate = layer.getAnimationEndDate();
			minTime = +startDate;
			maxTime = +endDate;
			currentTime = +layer.getAnimationTimeDate();
			layer.setAnimationTime(currentTime / 1000);
			dayMarkers = generateDayMarkers(minTime, maxTime);
		});

		layer.on("tick", () => {
			if (!isDragging) {
				const d = layer.getAnimationTimeDate();
				currentTime = +d;
			}
		});

		weatherLayers[type].layer = layer;
		map.addLayer(layer, "Water");
	} else {
		map.setLayoutProperty(type, 'visibility', 'visible');
	}
}

function updatePointerValue(lngLat) {
	if (!lngLat) return;
	pointerLngLat = lngLat;
	const layer = weatherLayers[activeLayer]?.layer;
	const valueKey = weatherLayers[activeLayer]?.value;
	const units = weatherLayers[activeLayer]?.units;
	const value = layer?.pickAt(lngLat.lng, lngLat.lat);
	if (value) {
		document.getElementById('pointer-data').innerText = `${value[valueKey].toFixed(1)}${units}`;
	}
}

async function searchLocation() {
	if (!searchText || searchText.length < 2) return;
	const query = encodeURIComponent(searchText);
	const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=10&q=${query}`);
	locationResults = await res.json();
}

function selectPlace(place) {
	const lng = parseFloat(place.lon);
	const lat = parseFloat(place.lat);
	if (searchMarker) searchMarker.remove();
	searchMarker = new maptilersdk.Marker({ color: "red" })
		.setLngLat([lng, lat])
		.setPopup(new maptilersdk.Popup().setText(place.display_name))
		.addTo(map);
	map.flyTo({ center: [lng, lat], zoom: 10 });
	locationResults = [];
	searchText = place.display_name;
}
</script>




<style>
#map {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100vw;
}
#buttons {
	z-index: 9;
}
</style>

<div bind:this={mapDiv} id="map"></div>
<div id="buttons">
	<button on:click={() => changeWeatherLayer('precipitation')}>Precipitation</button>
	<button on:click={() => changeWeatherLayer('pressure')}>Pressure</button>
	<button on:click={() => changeWeatherLayer('radar')}>Radar</button>
	<button on:click={() => changeWeatherLayer('temperature')}>Temperature</button>
	<button on:click={() => changeWeatherLayer('wind')}>Wind</button>
</div>
<div style="z-index: 11;">
	<input type="text" bind:value={searchText} placeholder="Zadaj miesto…" style="margin-bottom:5px; width: 200px;" />
	<button on:click={searchLocation}>Search</button>
	{#if locationResults.length > 0}
	<ul style="background: white; color: black; padding: 5px; border: 1px solid #ccc; max-width: 300px; font-size: 14px;">
		{#each locationResults as place}
		<li style="cursor: pointer; padding: 4px;" on:click={() => selectPlace(place)}>{place.display_name}</li>
		{/each}
	</ul>
	{/if}
</div>
<div id="pointer-data"></div>
<div id="variable-name">{activeLayer}</div>
<TimeSlider
	min={minTime}
	max={maxTime}
	value={currentTime}
	playing={isPlaying}
	onChange={updateTime}
	onPlayPause={togglePlay} />