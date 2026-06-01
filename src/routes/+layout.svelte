<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { setupI18n } from '$lib/i18n';
	import { themeStore } from '$lib/stores/theme.svelte';
	import BottomNav from '$components/BottomNav.svelte';
	import '../styles/global.css';

	// Hide bottom nav on all /exercises/ sub-routes (detail, new, edit…)
	const showNav = $derived(!page.url.pathname.startsWith('/exercises/'));

	let { children } = $props();

	onMount(async () => {
		await Promise.all([setupI18n(), themeStore.init()]);
		if (import.meta.env.PROD) {
			const { registerSW } = await import('virtual:pwa-register');
			registerSW({ immediate: true });
		}
	});
</script>

{@render children()}
{#if showNav}
	<BottomNav />
{/if}
