<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { Search, User, ChevronUp, ChevronDown, Plus } from 'lucide-svelte';
	import { db, type Exercise, type Practice } from '$db/index';
	import { seedExercises } from '$db/exercises';
	import { getSetting, setSetting } from '$lib/db/settings';
	import ExerciseCard from '$components/ExerciseCard.svelte';

	type GroupBy = 'category' | 'author' | 'book';

	const GROUPBY_KEY = 'groupBy';
	const GROUP_OPTIONS: { key: GroupBy; i18nKey: string }[] = [
		{ key: 'category', i18nKey: 'groupBy.category' },
		{ key: 'author',   i18nKey: 'groupBy.author' },
		{ key: 'book',     i18nKey: 'groupBy.book' }
	];

	interface ExerciseWithStats extends Exercise {
		lastPractice?: Practice;
	}

	let allExercises = $state<ExerciseWithStats[]>([]);
	let query = $state('');
	let groupBy = $state<GroupBy>('category');
	let collapsedGroups = $state(new Set<string>());
	let isLoading = $state(true);

	const filtered = $derived(
		query.trim()
			? allExercises.filter(
					(ex) =>
						ex.name.toLowerCase().includes(query.toLowerCase()) ||
						ex.author?.toLowerCase().includes(query.toLowerCase()) ||
						ex.book?.toLowerCase().includes(query.toLowerCase())
				)
			: allExercises
	);

	const grouped = $derived.by(() => {
		const noAuthor = $_('groupBy.noAuthor');
		const noBook   = $_('groupBy.noBook');
		const map = new Map<string, ExerciseWithStats[]>();

		for (const ex of filtered) {
			const key =
				groupBy === 'category' ? ex.category :
				groupBy === 'author'   ? (ex.author || noAuthor) :
				                         (ex.book   || noBook);
			if (!map.has(key)) map.set(key, []);
			map.get(key)!.push(ex);
		}

		// Named groups first (alphabetical), fallback groups last
		return [...map.entries()].sort(([a], [b]) => {
			const aFallback = a === noAuthor || a === noBook;
			const bFallback = b === noAuthor || b === noBook;
			if (aFallback !== bFallback) return aFallback ? 1 : -1;
			return a.localeCompare(b);
		});
	});

	async function setGroupBy(value: GroupBy) {
		groupBy = value;
		collapsedGroups = new Set(); // reset collapsed on group change
		await setSetting(GROUPBY_KEY, value);
	}

	async function load() {
		isLoading = true;
		const exercises = await db.exercises.toArray();
		exercises.sort((a, b) => a.name.localeCompare(b.name));
		allExercises = await Promise.all(
			exercises.map(async (ex) => {
				const practices = await db.practices.where('exerciseId').equals(ex.id!).toArray();
				const lastPractice = practices.sort((a, b) => b.date.localeCompare(a.date))[0];
				return { ...ex, lastPractice };
			})
		);
		isLoading = false;
	}

	function toggleGroup(key: string) {
		if (collapsedGroups.has(key)) collapsedGroups.delete(key);
		else collapsedGroups.add(key);
	}

	onMount(async () => {
		const saved = await getSetting(GROUPBY_KEY);
		if (saved === 'author' || saved === 'book') groupBy = saved;
		await seedExercises();
		await load();
	});
</script>

<div class="page">
	<header class="page-header">
		<div class="header-top">
			<h1 class="page-title">{$_('exercises.title')}</h1>
			<button class="icon-btn" aria-label="Profile">
				<User size={20} />
			</button>
		</div>

		<div class="search-wrapper">
			<span class="search-icon"><Search size={18} /></span>
			<input
				type="search"
				class="search-input"
				placeholder={$_('exercises.searchPlaceholder')}
				bind:value={query}
			/>
		</div>

		<div class="filter-scroll">
			<div class="filter-chips">
				{#each GROUP_OPTIONS as opt}
					<button
						class="chip"
						class:chip--active={groupBy === opt.key}
						onclick={() => setGroupBy(opt.key)}
					>
						{$_(opt.i18nKey)}
					</button>
				{/each}
			</div>
		</div>
	</header>

	<main class="page-main">
		{#if isLoading}
			<p class="state-msg">…</p>
		{:else if allExercises.length === 0}
			<p class="state-msg">{$_('exercises.noExercises')}</p>
		{:else if grouped.length === 0}
			<p class="state-msg">{$_('exercises.noResults', { values: { query } })}</p>
		{:else}
			{#each grouped as [groupKey, exercises]}
				{@const collapsed = collapsedGroups.has(groupKey)}
				<section class="category-section">
					<button
						class="category-header"
						class:category-header--collapsed={collapsed}
						onclick={() => toggleGroup(groupKey)}
					>
						<span class="category-name">{groupKey}</span>
						{#if collapsed}
							<ChevronDown size={12} />
						{:else}
							<ChevronUp size={12} />
						{/if}
					</button>

					{#if !collapsed}
						<div class="exercises-list">
							{#each exercises as ex (ex.id)}
								<ExerciseCard
									exercise={ex}
									lastPractice={ex.lastPractice}
								/>
							{/each}
						</div>
					{/if}
				</section>
			{/each}
		{/if}
	</main>

	<button class="fab" onclick={() => goto('/exercises/new')} aria-label={$_('exercises.addNew')}>
		<Plus size={22} />
	</button>
</div>

<style>
	/* ── Page layout ─────────────────────────────────────── */
	.page {
		min-height: 100dvh;
		padding-bottom: 104px;
	}

	/* ── Sticky header ───────────────────────────────────── */
	.page-header {
		background: color-mix(in srgb, var(--color-bg-layout) 85%, transparent);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	.header-top {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
	}

	.page-title {
		font-size: var(--font-size-h2);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: var(--letter-spacing-h1);
	}

	.icon-btn {
		background: none;
		border: none;
		border-radius: 9999px;
		padding: 8px;
		color: var(--color-text-default);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ── Search ──────────────────────────────────────────── */
	.search-wrapper {
		position: relative;
		margin: 0 16px;
	}

	.search-icon {
		position: absolute;
		left: 15px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-tertiary);
		pointer-events: none;
		display: flex;
		align-items: center;
	}

	.search-input {
		width: 100%;
		padding: 13px 16px 13px 40px;
		background: var(--color-bg-subtle);
		border: none;
		border-radius: 12px;
		font-size: 14px;
		font-weight: var(--font-weight-medium);
		color: var(--color-text-default);
		font-family: inherit;
		outline: none;
	}

	.search-input::placeholder {
		color: var(--color-text-tertiary);
	}

	/* ── Filter chips ────────────────────────────────────── */
	.filter-scroll {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		padding: 16px;
		scrollbar-width: none;
	}

	.filter-scroll::-webkit-scrollbar {
		display: none;
	}

	.filter-chips {
		display: flex;
		gap: 8px;
		width: max-content;
	}

	.chip {
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border-default);
		border-radius: 9999px;
		padding: 7px 17px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		display: flex;
		align-items: center;
		gap: 4px;
		white-space: nowrap;
		letter-spacing: -0.02em;
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.chip--active {
		background: var(--color-brand-primary);
		border-color: var(--color-brand-primary);
		color: var(--color-text-default);
	}

	/* ── Main content ────────────────────────────────────── */
	.page-main {
		display: flex;
		flex-direction: column;
		gap: 32px;
		padding: 24px 16px;
		max-width: 672px;
	}

	.state-msg {
		color: var(--color-text-tertiary);
		text-align: center;
		padding: 48px 0;
	}

	/* ── Category sections ───────────────────────────────── */
	.category-section {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.category-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 6px;
		border: none;
		border-bottom: 2px solid var(--color-text-default);
		background: none;
		width: 100%;
		color: var(--color-text-default);
	}

	.category-header--collapsed {
		border-bottom-color: var(--color-border-default);
		color: var(--color-text-tertiary);
	}

	.category-name {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.exercises-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* ── FAB ─────────────────────────────────────────────── */
	.fab {
		position: fixed;
		bottom: 96px;
		right: 24px;
		z-index: 15;
		background: var(--color-brand-primary);
		color: var(--color-text-default);
		border: none;
		border-radius: 9999px;
		width: 56px;
		height: 56px;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow:
			0 20px 25px -5px rgba(0, 0, 0, 0.1),
			0 8px 10px -6px rgba(0, 0, 0, 0.1);
	}
</style>
