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

<!-- <style>
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
  box-sizing: border-box;
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
</style> -->

<style>
/* 🎨 THEME-AWARE TIMESLIDER STYLING */
.slider-wrapper {
  background: var(--bg-primary, rgba(26, 35, 50, 0.95));
  backdrop-filter: blur(30px);
  border: 1px solid var(--border-primary, rgba(0, 255, 255, 0.3));
  box-shadow: var(--shadow-primary, 0 8px 32px rgba(0, 255, 255, 0.2));
  color: var(--text-primary, #ffffff);
  
  padding: 16px 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  
  font-family: "SF Pro Display", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease-out;
}

.slider-wrapper:hover {
  box-shadow: var(--shadow-hover, 0 12px 48px rgba(0, 255, 255, 0.3));
  border-color: var(--primary-color, #00ffff);
}

/* 🎮 PLAY/PAUSE BUTTON */
.slider-wrapper button {
  background: var(--gradient-1, linear-gradient(135deg, #00ffff 0%, #00c8ff 50%, #00ff96 100%));
  border: 1px solid var(--border-primary, rgba(0, 255, 255, 0.3));
  color: #000000;
  
  width: 44px;
  height: 44px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: var(--shadow-primary, 0 8px 32px rgba(0, 255, 255, 0.2));
  font-weight: 700;
}

.slider-wrapper button:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-hover, 0 12px 48px rgba(0, 255, 255, 0.3));
  border-color: var(--accent-color, #00ff96);
}

.slider-wrapper button:active {
  transform: scale(0.95);
}

/* 🎚️ SLIDER AREA */
.slider-area {
  flex: 1;
  position: relative;
  padding: 16px 0;
}

/* 📊 TRACK */
.track {
  position: relative;
  height: 8px;
  background: var(--bg-glass, rgba(255, 255, 255, 0.1));
  backdrop-filter: blur(5px);
  border: 1px solid var(--border-secondary, rgba(255, 255, 255, 0.2));
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* ⚡ PROGRESS BAR */
.progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--gradient-1, linear-gradient(135deg, #00ffff 0%, #00c8ff 50%, #00ff96 100%));
  border-radius: 6px;
  transition: width 0.1s linear;
  z-index: 2;
  box-shadow: 
    0 0 12px var(--primary-color, #00ffff),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

.progress::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 50%;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.3), transparent);
  border-radius: 6px 6px 0 0;
}

/* 🎯 RANGE INPUT */
input[type="range"] {
  width: 100%;
  appearance: none;
  background: transparent;
  height: 8px;
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  z-index: 3;
  cursor: pointer;
}

/* 🔘 SLIDER THUMB */
input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  height: 24px;
  width: 24px;
  background: var(--bg-primary, rgba(26, 35, 50, 0.95));
  border: 3px solid var(--primary-color, #00ffff);
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  z-index: 4;
  
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 0 var(--primary-color, #00ffff),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
}

input[type="range"]::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  border-width: 4px;
  box-shadow: 
    0 6px 20px rgba(0, 0, 0, 0.4),
    0 0 0 4px rgba(0, 255, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

input[type="range"]::-webkit-slider-thumb:active {
  transform: scale(1.1);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.5),
    0 0 0 6px rgba(0, 255, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.4);
}

/* 🏷️ TOOLTIP */
.tooltip {
  position: absolute;
  top: -50px;
  transform: translateX(-50%);
  
  background: var(--bg-primary, rgba(26, 35, 50, 0.95));
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-primary, rgba(0, 255, 255, 0.3));
  color: var(--text-primary, #ffffff);
  box-shadow: var(--shadow-primary, 0 8px 32px rgba(0, 255, 255, 0.2));
  
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 13px;
  white-space: nowrap;
  font-weight: 600;
  z-index: 10;
  pointer-events: none;
  
  transition: all 0.3s ease;
}

.tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: var(--bg-primary, rgba(26, 35, 50, 0.95));
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* 📍 THUMB CONTAINER */
.thumb-container {
  position: absolute;
  top: 8px;
  transform: translateX(-50%);
  z-index: 5;
  transition: all 0.3s ease;
}

/* 📅 DAY MARKERS */
.ticks {
  position: absolute;
  bottom: -11px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-secondary, #8892b0);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  z-index: 1;
  pointer-events: none;
  font-family: inherit;
}

.ticks div {
  text-align: center;
  flex: 1;
  padding: 0 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  transition: color 0.3s ease;
}

/* 🎭 ANIMATIONS */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 🔥 FIREFOX SUPPORT */
input[type="range"]::-moz-range-thumb {
  height: 24px;
  width: 24px;
  background: var(--bg-primary, rgba(26, 35, 50, 0.95));
  border: 3px solid var(--primary-color, #00ffff);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 12px rgba(0, 0, 0, 0.3),
    0 0 0 0 var(--primary-color, #00ffff);
}

input[type="range"]::-moz-range-track {
  background: transparent;
  border: none;
}

/* 📱 RESPONSIVE */
@media (max-width: 768px) {
  .slider-wrapper {
    padding: 12px 16px;
    gap: 12px;
  }
  
  .slider-wrapper button {
    width: 40px;
    height: 40px;
    font-size: 14px;
  }
  
  .slider-area {
    padding: 12px 0;
  }
  
  .track {
    height: 10px;
  }
  
  input[type="range"]::-webkit-slider-thumb {
    height: 28px;
    width: 28px;
    border-width: 4px;
  }
  
  .tooltip {
    font-size: 12px;
    padding: 6px 10px;
    top: -45px;
  }
  
  .ticks {
    font-size: 10px;
    bottom: -20px;
  }
}

@media (max-width: 480px) {
  .slider-wrapper {
    padding: 10px 12px;
    gap: 10px;
  }
  
  .slider-wrapper button {
    width: 36px;
    height: 36px;
    font-size: 12px;
  }
  
  .ticks {
    font-size: 9px;
  }
  
  .tooltip {
    font-size: 11px;
    padding: 4px 8px;
  }
}

/* 🌟 ENHANCED HOVER STATES */
.slider-wrapper:hover .track {
  border-color: var(--border-primary, rgba(0, 255, 255, 0.3));
  box-shadow: 
    inset 0 2px 4px rgba(0, 0, 0, 0.2),
    0 0 8px var(--primary-color, #00ffff);
}

.slider-wrapper:hover .progress {
  box-shadow: 
    0 0 16px var(--primary-color, #00ffff),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.slider-wrapper:hover .ticks div {
  color: var(--text-primary, #ffffff);
}

/* 🎨 THEME SPECIFIC ENHANCEMENTS */
[data-theme="purple"] .progress::after {
  background: linear-gradient(to bottom, rgba(168, 85, 247, 0.3), transparent);
}

[data-theme="emerald"] .progress::after {
  background: linear-gradient(to bottom, rgba(16, 185, 129, 0.3), transparent);
}

[data-theme="orange"] .progress::after {
  background: linear-gradient(to bottom, rgba(249, 115, 22, 0.3), transparent);
}

[data-theme="blue"] .progress::after {
  background: linear-gradient(to bottom, rgba(59, 130, 246, 0.3), transparent);
}
</style>

<div class="slider-wrapper">
  <button on:click={onPlayPause}>{playing ? '⏸' : '▶'}</button>

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
