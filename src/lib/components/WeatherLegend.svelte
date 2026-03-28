<script>
  export let activeLayer = 'wind';
  export let colorRamp = null;

  const units = {
    temperature: '°C',
    wind: 'm/s',
    precipitation: 'mm',
    pressure: 'hPa',
    radar: 'dBZ'
  };

  // Získaj color stops zo SDK colorRamp
  function getStopsFromRamp(colorRamp) {
    if (!colorRamp?.getRawColorStops) return null;
    try {
      return colorRamp.getRawColorStops();
    } catch {
      return null;
    }
  }

  // Preveď SDK stop formát [{value, color:[r,g,b,a]}] na gradient
  function buildGradient(sdkStops) {
    if (!sdkStops?.length) return null;
    const minV = sdkStops[0].value;
    const maxV = sdkStops[sdkStops.length - 1].value;
    const range = maxV - minV || 1;
    const parts = sdkStops.map(s => {
      const [r, g, b, a] = s.color;
      const pct = ((s.value - minV) / range * 100).toFixed(1);
      return `rgba(${r},${g},${b},${(a/255).toFixed(2)}) ${pct}%`;
    });
    return `linear-gradient(to top, ${parts.join(', ')})`;
  }

  // Vyber label hodnoty rovnomerne rozložené (max 8)
  function pickLabels(sdkStops, count = 7) {
    if (!sdkStops?.length) return [];
    const step = Math.max(1, Math.floor(sdkStops.length / count));
    const picked = [];
    for (let i = 0; i < sdkStops.length; i += step) {
      picked.push(sdkStops[i]);
    }
    // Vždy pridaj posledný
    if (picked[picked.length - 1] !== sdkStops[sdkStops.length - 1]) {
      picked.push(sdkStops[sdkStops.length - 1]);
    }
    return [...picked].reverse();
  }

  $: sdkStops = getStopsFromRamp(colorRamp);
  $: gradient = buildGradient(sdkStops);
  $: labels = pickLabels(sdkStops);
  $: unit = units[activeLayer] || '';
</script>

{#if gradient && labels.length}
<div class="legend">
  <div class="legend-bar" style="background: {gradient}; min-height: {labels.length * 22}px;"></div>
  <div class="legend-labels">
    {#each labels as stop}
      <div class="legend-label">{Math.round(stop.value)}{unit}</div>
    {/each}
  </div>
</div>
{/if}

<style>
  .legend {
    position: fixed;
    right: 16px;
    bottom: 120px;
    z-index: 500;
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 6px;
    background: var(--bg-primary, rgba(15, 20, 35, 0.92));
    border: 1px solid var(--border-secondary, rgba(255,255,255,0.15));
    border-radius: 12px;
    padding: 10px 10px 10px 8px;
    backdrop-filter: blur(16px);
    box-shadow: 0 4px 24px rgba(0,0,0,0.35);
  }

  .legend-bar {
    width: 14px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .legend-labels {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .legend-label {
    font-size: 10px;
    color: var(--text-secondary, #8892b0);
    white-space: nowrap;
    line-height: 1;
  }

  @media (max-width: 768px) {
    .legend {
      bottom: 195px;
      right: 10px;
    }
  }
</style>
