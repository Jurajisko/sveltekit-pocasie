import sk from './sk.json';
import en from './en.json';
import de from './de.json';
import { get } from 'svelte/store';
import { currentLanguage } from '../stores/language.js';

const translations = { sk, en, de };

export function t(key) {
	const lang = get(currentLanguage);
	return translations[lang]?.[key] || key;
}
