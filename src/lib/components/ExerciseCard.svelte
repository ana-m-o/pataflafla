<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import type { Exercise, Practice } from '$db/index';

	interface Props {
		exercise: Exercise;
		lastPractice?: Practice;
	}

	let { exercise, lastPractice }: Props = $props();

	const id = $derived(exercise.id ?? 0);

	const progress = $derived(
		lastPractice ? Math.min((lastPractice.bpm / exercise.targetBpm) * 100, 100) : 0
	);

	function exerciseMeta(ex: Exercise): string {
		return [
			ex.author ? `Author: ${ex.author}` : null,
			ex.book ? `Book: ${ex.book}` : null
		]
			.filter(Boolean)
			.join(' • ');
	}

	function dateLabel(dateStr: string): string {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		if (dateStr >= today) return $_('exercises.today');
		if (dateStr >= yesterday) return $_('exercises.yesterday');
		const diffDays = Math.round(
			(new Date(today).getTime() - new Date(dateStr).getTime()) / 86400000
		);
		return $_('exercises.daysAgo', { values: { days: diffDays } });
	}

	function emoji(dateStr: string): string {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		if (dateStr >= today) return '🔥';
		if (dateStr >= yesterday) return '😃';
		return '😐';
	}
</script>

<!-- Stretched-link pattern: the h3 link covers the full card; Practice is z-1 above it -->
<article class="card">
	<div class="card-header">
		<div class="card-info">
			<h3 class="exercise-name">
				<a href="/exercises/{id}" class="card-link">{exercise.name}</a>
			</h3>
			{#if exercise.author || exercise.book}
				<p class="exercise-meta">{exerciseMeta(exercise)}</p>
			{/if}
		</div>
		<a href="/exercises/{id}/practice" class="btn-practice">
			{$_('exercises.practice')}
		</a>
	</div>

	<div class="stats-grid">
		<div class="stat-cell">
			<span class="stat-label">{$_('exercises.target')}</span>
			<div class="stat-value">
				<span class="stat-number">{exercise.targetBpm}</span>
				<span class="stat-unit">BPM</span>
			</div>
		</div>

		<div class="stat-cell" class:stat-cell--accent={!!lastPractice}>
			<span class="stat-label">{$_('exercises.lastPracticed')}</span>
			{#if lastPractice}
				<div class="stat-value">
					<span class="stat-number">{lastPractice.bpm}</span>
					<span class="stat-unit">BPM</span>
				</div>
				<span class="stat-date">{dateLabel(lastPractice.date)} • {emoji(lastPractice.date)}</span>
			{:else}
				<div class="stat-value">
					<span class="stat-number stat-number--empty">—</span>
				</div>
			{/if}
		</div>
	</div>

	<div
		class="progress-track"
		role="progressbar"
		aria-valuenow={Math.round(progress)}
		aria-valuemin={0}
		aria-valuemax={100}
	>
		<div class="progress-fill" style="width: {progress}%"></div>
	</div>
</article>

<style>
	.card {
		background: var(--color-bg-component);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		padding: 17px;
		display: flex;
		flex-direction: column;
		gap: 12px;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
		position: relative; /* needed for stretched-link */
	}

	.card-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 12px;
	}

	/* Stretched link covers the full card */
	.card-link {
		text-decoration: none;
		color: inherit;
	}

	.card-link::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: inherit;
	}

	.exercise-name {
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		margin: 0;
		line-height: var(--line-height-h3);
	}

	.exercise-meta {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		margin: 2px 0 0;
		line-height: var(--line-height-sm);
	}

	/* Practice link sits above the stretched-link via z-index */
	.btn-practice {
		position: relative;
		z-index: 1;
		background: var(--color-brand-primary);
		color: var(--color-text-default);
		border-radius: 8px;
		padding: 4px 16px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		white-space: nowrap;
		flex-shrink: 0;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
		letter-spacing: 0.02em;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.stat-cell {
		background: var(--color-bg-layout);
		border-radius: 8px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.stat-cell--accent {
		border-left: 2px solid var(--color-brand-primary);
		padding-left: 6px;
	}

	.stat-label {
		font-size: 10px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		letter-spacing: 0.04em;
	}

	.stat-value {
		display: flex;
		align-items: baseline;
		gap: 3px;
		margin-top: 4px;
	}

	.stat-number {
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		line-height: 1;
	}

	.stat-number--empty {
		color: var(--color-text-tertiary);
	}

	.stat-unit {
		font-size: 10px;
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
	}

	.stat-date {
		font-size: 9px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		margin-top: 3px;
		letter-spacing: 0.04em;
	}

	.progress-track {
		background: var(--color-bg-subtle);
		height: 6px;
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--color-brand-primary);
		border-radius: 9999px;
		transition: width 0.4s ease;
	}
</style>
