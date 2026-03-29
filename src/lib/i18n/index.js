import sk from './sk.json';
import en from './en.json';
import de from './de.json';
import ru from './ru.json';
import es from './es.json';
import ja from './ja.json';
import fr from './fr.json';
import hi from './hi.json';
import pt from './pt.json';
import ko from './ko.json';
import cs from './cs.json';
import { derived } from 'svelte/store';
import { currentLanguage } from '../stores/language.js';

const translations = { sk, en, de, ru, es, ja, fr, hi, pt, ko, cs };

// Reaktívny store - automaticky sa updatuje pri zmene jazyka
export const i18n = derived(currentLanguage, ($lang) => {
	return (key) => translations[$lang]?.[key] || translations['sk']?.[key] || key;
});

// Fallback funkcia pre non-reactive kontexty
export function t(key) {
	const lang = localStorage.getItem('preferred_language') || 'sk';
	return translations[lang]?.[key] || translations['sk']?.[key] || key;
}
