import { browser } from '$app/environment';
import { getSetting, setSetting } from '$lib/db/settings';

export type Theme = 'light' | 'dark';
export type Accent = 'yellow' | 'cyan';

export const THEME_KEY = 'theme';
export const ACCENT_KEY = 'accent';

function createThemeStore() {
	let theme = $state<Theme>('light');
	let accent = $state<Accent>('yellow');

	function applyToDOM(t: Theme, a: Accent) {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', t);
		document.documentElement.setAttribute('data-accent', a);
	}

	/**
	 * Carga los settings desde la DB (fuente de verdad).
	 * localStorage actúa solo como caché síncrona para el anti-FOUC.
	 */
	async function init() {
		if (!browser) return;
		const [savedTheme, savedAccent] = await Promise.all([
			getSetting(THEME_KEY),
			getSetting(ACCENT_KEY)
		]);
		theme = (savedTheme as Theme) ?? 'light';
		accent = (savedAccent as Accent) ?? 'yellow';
		applyToDOM(theme, accent);
	}

	async function setTheme(t: Theme) {
		theme = t;
		applyToDOM(theme, accent);
		await setSetting(THEME_KEY, t);
	}

	async function setAccent(a: Accent) {
		accent = a;
		applyToDOM(theme, accent);
		await setSetting(ACCENT_KEY, a);
	}

	async function toggle() {
		await setTheme(theme === 'light' ? 'dark' : 'light');
	}

	return {
		get theme() {
			return theme;
		},
		get accent() {
			return accent;
		},
		init,
		setTheme,
		setAccent,
		toggle
	};
}

export const themeStore = createThemeStore();
