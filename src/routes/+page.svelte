<script lang="ts">
	import { Languages } from 'lucide-svelte';
	import { locale, _ } from 'svelte-i18n';
	import { setAppLocale, type AppLocale } from '$lib/i18n';

	function changeLocale(nextLocale: string) {
		setAppLocale(nextLocale as AppLocale);
	}
</script>

<main>
	<h1>{$_('app.title')}</h1>
	<p>{$_('app.description')}</p>

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
