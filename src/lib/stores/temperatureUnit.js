import { writable } from 'svelte/store';

export const temperatureUnit = writable(
  typeof localStorage !== 'undefined'
    ? localStorage.getItem('temperature-unit') || 'celsius'
    : 'celsius'
);

export function setTemperatureUnit(unit) {
  temperatureUnit.set(unit);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('temperature-unit', unit);
  }
}

export function convertTemp(tempC, unit) {
  if (unit === 'fahrenheit') return Math.round((tempC * 9 / 5) + 32);
  return Math.round(tempC);
}

export function unitSymbol(unit) {
  return unit === 'fahrenheit' ? '°F' : '°C';
}
