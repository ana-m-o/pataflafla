<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { Music, Disc3, Mic2, Headphones, Music2, Speaker, ListMusic, Radio } from 'lucide-svelte';
	import SubPageHeader from '$components/SubPageHeader.svelte';
	import { db } from '$db/index';

	const returnTo = $derived(page.url.searchParams.get('returnTo') ?? '/');

	const ICONS = [
		{ key: 'Music',       Icon: Music },
		{ key: 'Disc3',       Icon: Disc3 },
		{ key: 'Mic2',        Icon: Mic2 },
		{ key: 'Headphones',  Icon: Headphones },
		{ key: 'Music2',      Icon: Music2 },
		{ key: 'Speaker',     Icon: Speaker },
		{ key: 'ListMusic',   Icon: ListMusic },
		{ key: 'Radio',       Icon: Radio }
	];

	const COLORS = [
		'#ffd400', // yellow (brand)
		'#fb7185', // rose
		'#818cf8', // indigo
		'#34d399', // emerald
		'#38bdf8', // sky
		'#fb923c', // orange
		'#94a3b8'  // slate
	];

	let name = $state('');
	let selectedIcon = $state('Music');
	let selectedColor = $state('#ffd400');

	const canSave = $derived(name.trim().length > 0);

	async function create() {
		if (!canSave) return;
		await db.categories.add({
			name: name.trim(),
			icon: selectedIcon,
			color: selectedColor,
			createdAt: new Date().toISOString().split('T')[0]
		});
		goto(returnTo);
	}
</script>

<div class="page">
	<SubPageHeader title={$_('categories.title')} onBack={() => goto(returnTo)} />

	<main class="page-main">
		<!-- Name -->
		<div class="field">
			<label class="field-label" for="cat-name">{$_('categories.nameLabel')}</label>
			<input
				id="cat-name"
				type="text"
				class="field-input"
				placeholder={$_('categories.namePlaceholder')}
				bind:value={name}
	
			/>
		</div>

		<!-- Icon selector -->
		<div class="field">
			<p class="field-label">{$_('categories.selectIcon')}</p>
			<div class="icon-grid">
				{#each ICONS as { key, Icon }}
					<button
						type="button"
						class="icon-btn"
						class:icon-btn--active={selectedIcon === key}
						onclick={() => (selectedIcon = key)}
						aria-label={key}
					>
						<Icon size={20} />
					</button>
				{/each}
			</div>
		</div>

		<!-- Color selector -->
		<div class="field">
			<p class="field-label">{$_('categories.accentColor')}</p>
			<div class="color-row">
				{#each COLORS as color}
					<button
						type="button"
						class="color-swatch"
						class:color-swatch--active={selectedColor === color}
						style="background: {color};"
						onclick={() => (selectedColor = color)}
						aria-label={color}
					></button>
				{/each}
			</div>
		</div>
	</main>

	<footer class="page-footer">
		<button class="btn-create" onclick={create} disabled={!canSave}>
			{$_('categories.create')}
		</button>
	</footer>
</div>

<style>
	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
	}

	/* ── Main ────────────────────────────────────────────── */
	.page-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 24px 16px 8px;
	}

	/* ── Fields ──────────────────────────────────────────── */
	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.field-label {
		font-size: 14px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		letter-spacing: 0.05em;
	}

	.field-input {
		width: 100%;
		height: 56px;
		padding: 0 17px;
		background: var(--color-bg-component);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		font-size: var(--font-size-h3);
		font-family: inherit;
		color: var(--color-text-default);
		outline: none;
		transition: border-color 0.15s;
	}

	.field-input:focus {
		border-color: var(--color-brand-primary);
	}

	.field-input::placeholder {
		color: var(--color-text-tertiary);
		font-weight: var(--font-weight-medium);
	}

	/* ── Icon grid ───────────────────────────────────────── */
	.icon-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 12px;
	}

	.icon-btn {
		aspect-ratio: 1;
		border-radius: 12px;
		border: 1px solid rgba(255, 212, 0, 0.1);
		background: rgba(255, 212, 0, 0.05);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: 0;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.icon-btn--active {
		background: rgba(255, 212, 0, 0.2);
		border-color: var(--color-brand-primary);
		color: var(--color-text-default);
	}

	/* ── Color row ───────────────────────────────────────── */
	.color-row {
		display: flex;
		gap: 16px;
		flex-wrap: wrap;
	}

	.color-swatch {
		width: 40px;
		height: 40px;
		border-radius: 9999px;
		border: none;
		cursor: pointer;
		flex-shrink: 0;
		outline: none;
		transition: box-shadow 0.15s;
	}

	.color-swatch--active {
		box-shadow: 0 0 0 3px white, 0 0 0 5px var(--color-text-default);
	}

	/* ── Footer ──────────────────────────────────────────── */
	.page-footer {
		padding: 0 24px 32px;
	}

	.btn-create {
		width: 100%;
		padding: 16px;
		background: var(--color-brand-primary);
		border: none;
		border-radius: 12px;
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		cursor: pointer;
		font-family: inherit;
		box-shadow: 0 10px 15px -3px rgba(255, 212, 0, 0.2), 0 4px 6px -4px rgba(255, 212, 0, 0.2);
		transition: opacity 0.15s;
	}

	.btn-create:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
