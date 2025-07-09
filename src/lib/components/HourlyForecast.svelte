<script>
	import { t } from '$lib/i18n';
	export let location;
	export let hourlyData = [];
	export let loading = false;
	export let error = null;
</script>

<section class="hourly-forecast">
	<h2>{t('next_hours')} – {location}</h2>

	{#if loading}
		<p>{t('loading')}...</p>
	{:else if error}
		<p class="error">⚠️ {error}</p>
	{:else if hourlyData.length === 0}
		<p>{t('no_data')}</p>
	{:else}
		<div class="forecast-list">
			{#each hourlyData as hour}
				<div class="hour-box">
					<div class="time">
						{new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
					</div>
					<div class="temp">{hour.temperature}°C</div>
					<div class="precip">{hour.precipitationProbability}% 🌧️</div>
					<div class="wind">{hour.windSpeed} m/s 🌬️</div>
				</div>
			{/each}

		</div>
	{/if}
</section>

<style>
	.hourly-forecast {
		padding: 16px;
	}
	.forecast-list {
		display: flex;
		overflow-x: auto;
		gap: 12px;
	}
	.hour-box {
		min-width: 100px;
		background: #f3f4f6;
		border-radius: 8px;
		padding: 8px;
		text-align: center;
	}
	.time {
		font-weight: bold;
	}
	.temp, .precip, .wind {
		font-size: 0.9rem;
	}
	.error {
		color: #b91c1c;
	}
</style>
