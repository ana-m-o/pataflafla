<script lang="ts">
	import { Languages, Palette } from 'lucide-svelte';
	import { locale, _ } from 'svelte-i18n';
	import { setAppLocale, type AppLocale } from '$lib/i18n';
	import { themeStore, type Theme, type Accent } from '$lib/stores/theme.svelte';

	function changeLocale(nextLocale: string) {
		setAppLocale(nextLocale as AppLocale);
	}
</script>

<main>
	<h1>{$_('app.title')}</h1>
	<p>{$_('app.description')}</p>

	<label for="theme-select" style="display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem;">
		<Palette size={18} />
		<span>{$_('theme.label')}</span>
	</label>
	<select
		id="theme-select"
		value={themeStore.theme}
		onchange={(e) => themeStore.setTheme((e.currentTarget as HTMLSelectElement).value as Theme)}
	>
		<option value="light">{$_('theme.light')}</option>
		<option value="dark">{$_('theme.dark')}</option>
	</select>

	<select
		value={themeStore.accent}
		onchange={(e) => themeStore.setAccent((e.currentTarget as HTMLSelectElement).value as Accent)}
	>
		<option value="yellow">{$_('theme.yellow')}</option>
		<option value="cyan">{$_('theme.cyan')}</option>
	</select>

	<label for="locale-select" style="display: inline-flex; gap: 0.5rem; align-items: center; margin-top: 1rem;">
		<Languages size={18} />
		<span>{$_('app.language')}</span>
	</label>
	<select
		id="locale-select"
		value={$locale ?? 'es'}
		onchange={(event) => changeLocale((event.currentTarget as HTMLSelectElement).value)}
	>
		<option value="es">{$_('app.spanish')}</option>
		<option value="en">{$_('app.english')}</option>
	</select>
</main>
