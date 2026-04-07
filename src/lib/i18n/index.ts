import { addMessages, getLocaleFromNavigator, init, locale } from 'svelte-i18n';
import { en } from './locales/en';
import { es } from './locales/es';

export const supportedLocales = ['es', 'en'] as const;
export type AppLocale = (typeof supportedLocales)[number];

const DEFAULT_LOCALE: AppLocale = 'es';
const STORAGE_KEY = 'pataflafla.locale';

addMessages('es', es);
addMessages('en', en);

init({
	fallbackLocale: DEFAULT_LOCALE,
	initialLocale: DEFAULT_LOCALE
});

export function setAppLocale(nextLocale: AppLocale) {
	locale.set(nextLocale);
	if (typeof window !== 'undefined') {
		localStorage.setItem(STORAGE_KEY, nextLocale);
	}
}

export function setupI18n() {
	if (typeof window === 'undefined') return;

	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored && supportedLocales.includes(stored as AppLocale)) {
		setAppLocale(stored as AppLocale);
		return;
	}

	const navigatorLocale = getLocaleFromNavigator()?.split('-')[0] as AppLocale | undefined;
	if (navigatorLocale && supportedLocales.includes(navigatorLocale)) {
		setAppLocale(navigatorLocale);
		return;
	}

	setAppLocale(DEFAULT_LOCALE);
}
