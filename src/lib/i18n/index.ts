import { addMessages, getLocaleFromNavigator, init, locale } from 'svelte-i18n';
import { en } from './locales/en';
import { es } from './locales/es';
import { getSetting, setSetting } from '$lib/db/settings';

export const supportedLocales = ['es', 'en'] as const;
export type AppLocale = (typeof supportedLocales)[number];

const DEFAULT_LOCALE: AppLocale = 'es';
export const LOCALE_KEY = 'locale';

addMessages('es', es);
addMessages('en', en);

init({
	fallbackLocale: DEFAULT_LOCALE,
	initialLocale: DEFAULT_LOCALE
});

export async function setAppLocale(nextLocale: AppLocale) {
	locale.set(nextLocale);
	if (typeof window !== 'undefined') {
		await setSetting(LOCALE_KEY, nextLocale);
	}
}

export async function setupI18n() {
	if (typeof window === 'undefined') return;

	const stored = await getSetting(LOCALE_KEY);
	if (stored && supportedLocales.includes(stored as AppLocale)) {
		locale.set(stored as AppLocale);
		localStorage.setItem(LOCALE_KEY, stored);
		return;
	}

	const navigatorLocale = getLocaleFromNavigator()?.split('-')[0] as AppLocale | undefined;
	if (navigatorLocale && supportedLocales.includes(navigatorLocale)) {
		await setAppLocale(navigatorLocale);
		return;
	}

	setAppLocale(DEFAULT_LOCALE);
}
