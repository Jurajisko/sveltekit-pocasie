import { writable } from 'svelte/store';

function createSavedPlaces() {
  const STORAGE_KEY = 'weather-saved-places';

  function load() {
    if (typeof localStorage === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch { return []; }
  }

  function save(places) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(places));
    }
  }

  const { subscribe, set, update } = writable(load());

  return {
    subscribe,
    add(place) {
      // place = { id, name, lat, lng, isDefault }
      update(places => {
        if (places.find(p => p.id === place.id)) return places;
        const updated = [...places, { ...place, isDefault: places.length === 0 }];
        save(updated);
        return updated;
      });
    },
    remove(id) {
      update(places => {
        let updated = places.filter(p => p.id !== id);
        // Ak sme zmazali default, nastaviť prvý ako default
        if (updated.length > 0 && !updated.find(p => p.isDefault)) {
          updated[0].isDefault = true;
        }
        save(updated);
        return updated;
      });
    },
    setDefault(id) {
      update(places => {
        const updated = places.map(p => ({ ...p, isDefault: p.id === id }));
        save(updated);
        return updated;
      });
    },
    getDefault() {
      return load().find(p => p.isDefault) || null;
    }
  };
}

export const savedPlaces = createSavedPlaces();
