import { writable } from 'svelte/store';

export const currentLanguage = writable('sk');

export function initializeLanguage() {
	if (typeof window !== 'undefined') {
		const saved = localStorage.getItem('preferred_language');
		if (saved) {
			currentLanguage.set(saved);
		}
	}
}

export function switchLanguage(lang) {
	currentLanguage.set(lang);
	if (typeof window !== 'undefined') {
		localStorage.setItem('preferred_language', lang);
	}
}
