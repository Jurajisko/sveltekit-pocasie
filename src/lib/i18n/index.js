import sk from './sk.json';
import en from './en.json';
import de from './de.json';
import { derived } from 'svelte/store';
import { currentLanguage } from '../stores/language.js';

const translations = { sk, en, de };

// Reaktívny store - automaticky sa updatuje pri zmene jazyka
export const i18n = derived(currentLanguage, ($lang) => {
	return (key) => translations[$lang]?.[key] || translations['sk']?.[key] || key;
});

// Fallback funkcia pre non-reactive kontexty
export function t(key) {
	const lang = localStorage.getItem('preferred_language') || 'sk';
	return translations[lang]?.[key] || translations['sk']?.[key] || key;
}
