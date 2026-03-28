<script>
  import { savedPlaces } from '$lib/stores/savedPlaces.js';
  import { createEventDispatcher } from 'svelte';
  import { i18n } from '$lib/i18n/index.js';

  $: t = $i18n;

  export let isOpen = false;
  export let currentPlace = null; // { name, lat, lng }

  const dispatch = createEventDispatcher();

  function close() { isOpen = false; }

  function goToPlace(place) {
    dispatch('select', place);
    close();
  }

  function addCurrent() {
    if (!currentPlace) return;
    savedPlaces.add({
      id: `${currentPlace.lat.toFixed(4)}_${currentPlace.lng.toFixed(4)}`,
      name: currentPlace.name,
      lat: currentPlace.lat,
      lng: currentPlace.lng,
      isDefault: false
    });
  }

  $: alreadySaved = currentPlace
    ? $savedPlaces.some(p => p.id === `${currentPlace.lat?.toFixed(4)}_${currentPlace.lng?.toFixed(4)}`)
    : false;
</script>

<!-- OVERLAY -->
{#if isOpen}
  <div class="sp-overlay" on:click={close} on:keydown={() => {}} role="presentation"></div>
{/if}

<!-- DRAWER -->
<div class="sp-drawer" class:open={isOpen}>
  <div class="sp-header">
    <span class="sp-title">⭐ {t('saved_places')}</span>
    <button class="sp-close" on:click={close}>✕</button>
  </div>

  <!-- Uložiť aktuálne miesto -->
  {#if currentPlace}
    <div class="sp-current">
      <div class="sp-current-name">📍 {currentPlace.name}</div>
      <button
        class="sp-save-btn"
        class:saved={alreadySaved}
        on:click={addCurrent}
        disabled={alreadySaved}
      >
        {alreadySaved ? t('saved_places_saved') : t('saved_places_save')}
      </button>
    </div>
  {/if}

  <!-- Zoznam uložených miest -->
  <div class="sp-list">
    {#if $savedPlaces.length === 0}
      <div class="sp-empty">
        <div class="sp-empty-icon">🗺️</div>
        <p>{t('saved_places_empty_title')}</p>
        <small>{t('saved_places_empty_hint')}</small>
      </div>
    {:else}
      {#each $savedPlaces as place}
        <div class="sp-item" class:default={place.isDefault}>
          <!-- Klik na miesto = naviguj -->
          <button class="sp-item-main" on:click={() => goToPlace(place)}>
            <span class="sp-dot">{place.isDefault ? '🏠' : '📍'}</span>
            <div class="sp-item-info">
              <span class="sp-item-name">{place.name}</span>
              <span class="sp-item-sub">{place.isDefault ? t('saved_places_primary') : t('saved_places_nav')}</span>
            </div>
          </button>

          <!-- Akcie -->
          <div class="sp-item-actions">
            {#if !place.isDefault}
              <button class="sp-action-btn sp-btn-primary" on:click={() => savedPlaces.setDefault(place.id)} title={t('saved_places_set_primary')}>
                🏠
              </button>
            {/if}
            <button class="sp-action-btn sp-btn-delete" on:click={() => savedPlaces.remove(place.id)} title={t('saved_places_delete')}>
              🗑️
            </button>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <div class="sp-footer">
    <small>{t('saved_places_footer')}</small>
  </div>
</div>

<style>
  .sp-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
  }

  .sp-drawer {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    width: 300px;
    max-width: 85vw;
    background: var(--bg-primary, rgba(15, 20, 35, 0.98));
    border-left: 1px solid var(--border-primary, rgba(0,255,255,0.3));
    box-shadow: -8px 0 40px rgba(0,0,0,0.5);
    z-index: 1001;
    display: flex;
    flex-direction: column;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    backdrop-filter: blur(30px);
  }

  .sp-drawer.open {
    transform: translateX(0);
  }

  .sp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border-secondary, rgba(255,255,255,0.1));
  }

  .sp-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary, #fff);
  }

  .sp-close {
    background: var(--bg-glass, rgba(255,255,255,0.08));
    border: 1px solid var(--border-secondary, rgba(255,255,255,0.15));
    color: var(--text-secondary, #8892b0);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .sp-close:hover {
    border-color: var(--primary-color, #00ffff);
    color: var(--primary-color, #00ffff);
  }

  .sp-current {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 14px 20px;
    background: var(--bg-glass, rgba(0,255,255,0.04));
    border-bottom: 1px solid var(--border-secondary, rgba(255,255,255,0.08));
  }

  .sp-current-name {
    font-size: 13px;
    color: var(--text-secondary, #8892b0);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sp-save-btn {
    background: var(--gradient-1, linear-gradient(135deg, #00ffff, #00ff96));
    border: none;
    color: #000;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .sp-save-btn.saved {
    background: var(--bg-glass, rgba(255,255,255,0.1));
    color: var(--primary-color, #00ffff);
    border: 1px solid var(--primary-color, #00ffff);
    cursor: default;
  }

  .sp-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .sp-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 8px;
    color: var(--text-secondary, #8892b0);
    text-align: center;
  }

  .sp-empty-icon {
    font-size: 40px;
    margin-bottom: 8px;
  }

  .sp-empty p {
    font-size: 15px;
    font-weight: 600;
    margin: 0;
    color: var(--text-primary, #fff);
  }

  .sp-empty small {
    font-size: 12px;
  }

  .sp-item {
    display: flex;
    align-items: center;
    padding: 8px 16px;
    gap: 0;
    border-bottom: 1px solid var(--border-secondary, rgba(255,255,255,0.06));
  }

  .sp-item.default {
    background: linear-gradient(135deg, rgba(0,255,255,0.05), transparent);
    border-left: 3px solid var(--primary-color, #00ffff);
    padding-left: 13px;
  }

  .sp-item-main {
    flex: 1;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: var(--text-primary, #fff);
    cursor: pointer;
    padding: 6px 8px 6px 0;
    text-align: left;
    gap: 10px;
    min-width: 0;
  }

  .sp-dot {
    font-size: 18px;
    flex-shrink: 0;
  }

  .sp-item-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .sp-item-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary, #fff);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sp-item-sub {
    font-size: 11px;
    color: var(--text-secondary, #8892b0);
    font-weight: 500;
  }

  .sp-item.default .sp-item-sub {
    color: var(--primary-color, #00ffff);
  }

  .sp-item-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .sp-action-btn {
    background: none;
    border: 1px solid transparent;
    cursor: pointer;
    font-size: 16px;
    width: 34px;
    height: 34px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    color: var(--text-secondary, #8892b0);
  }

  .sp-btn-primary:hover {
    background: rgba(0,255,255,0.1);
    border-color: var(--primary-color, #00ffff);
  }

  .sp-btn-delete {
    opacity: 0.7;
  }

  .sp-btn-delete:hover {
    background: rgba(255, 70, 70, 0.15);
    border-color: rgba(255,70,70,0.5);
    opacity: 1;
  }

  .sp-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--border-secondary, rgba(255,255,255,0.08));
    color: var(--text-secondary, #8892b0);
    font-size: 11px;
    text-align: center;
  }
</style>
