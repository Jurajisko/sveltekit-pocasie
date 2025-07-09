<script>
  export let min = 0;
  export let max = 0;
  export let value = 0;
  export let playing = false;
  export let dayMarkers = [];
  export let onChange = () => {};
  export let onPlayPause = () => {};

  let internalValue = value;
  $: internalValue = value;

  function handleInput(e) {
    internalValue = +e.target.value;
    onChange(internalValue);
  }

  function formatTooltip(ts) {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).replace(',', '');
  }

  $: progressPercent = ((internalValue - min) / (max - min)) * 100;
</script>

<style>
.slider-wrapper {
  background: rgba(255, 255, 255, 0.25);
  padding: 12px 16px;
  border-radius: 12px;
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  position: relative;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.slider-area {
  flex: 1;
  position: relative;
}

.track {
  position: relative;
  height: 6px;
  background: #ddd;
  border-radius: 3px;
  overflow: hidden;
}

.progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #007bff;
  transition: width 0.1s linear;
  z-index: 2;
}


input[type="range"] {
  width: 100%;
  appearance: none;
  background: transparent;
  height: 6px;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;
}

input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  height: 18px;
  width: 18px;
  background: white;
  border: 2px solid #007bff;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  z-index: 4;
}

.tooltip {
  position: absolute;
  top: -40px;
  transform: translateX(-50%);
  background: white;
  border: 2px solid #007bff;
  color: #007bff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  white-space: nowrap;
  font-weight: bold;
  z-index: 10;
  pointer-events: none;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

.thumb-container {
  position: absolute;
  top: 6px;
  transform: translateX(-50%);
  z-index: 5;
}

.ticks {
  position: absolute;
  bottom: -20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: black;
  text-shadow: 0 0 3px white;
  z-index: 1;
  pointer-events: none;
}
</style>

<div class="slider-wrapper">
  <button on:click={onPlayPause}>{playing ? '⏸️' : '▶️'}</button>

  <div class="slider-area">
    <div class="track">
      <div class="progress" style="width: {progressPercent}%;"></div>
    </div>


    <input
      type="range"
      min={min}
      max={max}
      step={3600000}
      bind:value={internalValue}
      on:input={handleInput}
    />

    <div
      class="thumb-container"
      style="left: {progressPercent}%"
    >
      <div class="tooltip">{formatTooltip(internalValue)}</div>
    </div>

    <div class="ticks">
      {#each dayMarkers as marker}
        <div style="text-align: center; flex: 1;">
          {marker.label}
        </div>
      {/each}
    </div>
  </div>
</div>
