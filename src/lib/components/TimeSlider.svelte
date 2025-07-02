<script>
    export let min = 0;
    export let max = 0;
    export let value = 0;
    export let playing = false;
    export let dayMarkers = [];
    /** @type {(val: number) => void} */
    export let onChange = () => {};
    export let onPlayPause = () => {};

    $: displayDate = value ? new Date(+value).toUTCString() : '';
</script>

<div class="slider-container">
    <button class="play" on:click={onPlayPause}>{playing ? '❚❚' : '▶'}</button>
    <div class="slider-wrapper">
        <input
            type="range"
            min={min}
            max={max}
            bind:value
            step={3600000}
            on:input={() => onChange(value)}
        />
        <div class="tooltip" style="left: {(value - min)/(max - min) * 100}%">
            {new Date(+value).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
        </div>
        <div class="day-labels">
            {#each dayMarkers as marker}
            <div
                class="day-label"
                style="left: {(marker.time - min)/(max - min) * 100}%"
            >
                {marker.label}
            </div>
            {/each}
        </div>
    </div>
</div>

<style>
  .slider-container {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    background: rgba(0, 0, 0, 0.6);
    padding: 10px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .play {
    background: white;
    color: black;
    border: none;
    padding: 4px 10px;
    font-size: 14px;
    cursor: pointer;
    border-radius: 4px;
  }

  .slider-wrapper {
    position: relative;
    width: 600px;
  }

  input[type="range"] {
    width: 100%;
  }

  .tooltip {
    position: absolute;
    top: -30px;
    transform: translateX(-50%);
    background: #fff;
    color: black;
    padding: 2px 6px;
    font-size: 12px;
    border-radius: 4px;
    white-space: nowrap;
  }

  .day-labels {
    position: absolute;
    bottom: -20px;
    width: 100%;
    font-size: 11px;
    color: white;
  }

  .day-label {
    position: absolute;
    transform: translateX(-50%);
    white-space: nowrap;
  }
</style>
