<script lang="ts">
	import { page } from '$app/state';
	import { _ } from 'svelte-i18n';
	import { BookOpen, List, BarChart2, Settings } from 'lucide-svelte';

	const tabs = [
		{ key: 'exercises', icon: BookOpen, href: '/' },
		{ key: 'lists', icon: List, href: '/lists' },
		{ key: 'statistics', icon: BarChart2, href: '/statistics' },
		{ key: 'settings', icon: Settings, href: '/settings' }
	] as const;
</script>

<nav class="bottom-nav">
	<div class="nav-inner">
		{#each tabs as tab}
			{@const active = page.url.pathname === tab.href}
			{@const Icon = tab.icon}
			<a
				href={tab.href}
				class="nav-link"
				class:nav-link--active={active}
				aria-current={active ? 'page' : undefined}
			>
				<Icon size={24} />
				<span class="nav-label">{$_(`nav.${tab.key}`)}</span>
			</a>
		{/each}
	</div>
</nav>

<style>
	.bottom-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 20;
		background: var(--color-bg-component);
		border-top: 1px solid var(--color-border-default);
		padding-bottom: 8px;
		padding-top: 9px;
	}

	.nav-inner {
		display: flex;
		align-items: center;
		justify-content: space-around;
		max-width: 448px;
		margin: 0 auto;
		padding: 0 24px;
	}

	.nav-link {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		text-decoration: none;
		color: var(--color-text-tertiary);
		flex: 1;
		padding: 4px 0;
	}

	.nav-link--active {
		color: var(--color-text-default);
	}

	.nav-label {
		font-size: 10px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: -0.03em;
	}
</style>
