<script lang="ts">
	import type { PracticeFeeling } from '$db/index';

	interface Props {
		exerciseName: string;
		bpm: number;
		elapsed: number; // seconds
		onSave: (feeling: PracticeFeeling | null, notes: string) => void;
		onDiscard: () => void;
	}

	let { exerciseName, bpm, elapsed, onSave, onDiscard }: Props = $props();

	let feeling = $state<PracticeFeeling | null>(null);
	let notes = $state('');

	const FEELINGS: { key: PracticeFeeling; label: string; emoji: string }[] = [
		{ key: 'poor', label: 'Poor', emoji: '😟' },
		{ key: 'okay', label: 'Okay', emoji: '😐' },
		{ key: 'good', label: 'Good', emoji: '🙂' },
		{ key: 'great', label: 'Great', emoji: '😄' }
	];

	const minutes = $derived(Math.round(elapsed / 60));
	const minuteLabel = $derived(
		minutes <= 0 ? 'Less than a minute' : minutes === 1 ? '1 minute' : `${minutes} minutes`
	);
</script>

<div class="modal">
	<header class="modal-header">
		<button class="close-btn" onclick={onDiscard} aria-label="Close">✕</button>
		<span class="modal-title">Practice Session Ended</span>
		<div style="width: 30px"></div>
	</header>

	<div class="modal-body">
		<!-- Check icon -->
		<div class="check-circle">
			<svg width="20" height="15" viewBox="0 0 20 15" fill="none">
				<path d="M2 7L8 13L18 2" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</div>

		<!-- Summary -->
		<div class="summary">
			<p class="summary-line">{minuteLabel} of {exerciseName}</p>
			<p class="summary-line">at {bpm} BPM</p>
		</div>

		<!-- How did it feel -->
		<div class="section">
			<h2 class="section-label">How did it feel?</h2>
			<div class="feeling-grid">
				{#each FEELINGS as f}
					<button
						class="feeling-btn"
						class:feeling-btn--active={feeling === f.key}
						onclick={() => (feeling = f.key)}
					>
						<span class="feeling-emoji" class:feeling-emoji--active={feeling === f.key}>
							{f.emoji}
						</span>
						<span class="feeling-label" class:feeling-label--active={feeling === f.key}>
							{f.label}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- Session notes -->
		<div class="section">
			<h2 class="section-label">Session Notes</h2>
			<textarea
				class="notes-input"
				placeholder="Add your notes here... (e.g., focus on wrist relaxation, left hand lead)"
				bind:value={notes}
			></textarea>
		</div>

		<!-- Actions -->
		<div class="actions">
			<button class="btn-save" onclick={() => onSave(feeling, notes)}>Save Session</button>
			<button class="btn-discard" onclick={onDiscard}>Discard</button>
		</div>
	</div>
</div>

<style>
	.modal {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: var(--color-bg-layout);
		display: flex;
		flex-direction: column;
		animation: slide-up 0.28s cubic-bezier(0.32, 0.72, 0, 1);
		overflow-y: auto;
	}

	@keyframes slide-up {
		from { transform: translateY(100%); }
		to { transform: translateY(0); }
	}

	/* ── Header ──────────────────────────────────────────── */
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 16px 17px;
		border-bottom: 1px solid var(--color-border-default);
		flex-shrink: 0;
	}

	.close-btn {
		width: 30px;
		height: 30px;
		border: none;
		background: none;
		font-size: 16px;
		color: var(--color-text-default);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.modal-title {
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: -0.02em;
		text-align: center;
	}

	/* ── Body ────────────────────────────────────────────── */
	.modal-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32px;
		padding: 32px 24px 42px;
		max-width: 448px;
		width: 100%;
		margin: 0 auto;
	}

	/* ── Check circle ────────────────────────────────────── */
	.check-circle {
		width: 64px;
		height: 64px;
		background: var(--color-brand-primary);
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	/* ── Summary ─────────────────────────────────────────── */
	.summary {
		text-align: center;
	}

	.summary-line {
		font-size: var(--font-size-h2);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		line-height: 1.25;
		margin: 0;
	}

	/* ── Section ─────────────────────────────────────────── */
	.section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24px;
		width: 100%;
	}

	.section-label {
		font-size: 14px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		letter-spacing: 0.1em;
		text-align: center;
		margin: 0;
	}

	/* ── Feeling selector ────────────────────────────────── */
	.feeling-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		width: 100%;
		max-width: 320px;
	}

	.feeling-btn {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12px;
		background: none;
		border: none;
		cursor: pointer;
	}

	.feeling-emoji {
		width: 56px;
		height: 56px;
		border-radius: 12px;
		border: 2px solid var(--color-border-default);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 24px;
		transition: border-color 0.15s, background 0.15s;
	}

	.feeling-emoji--active {
		border-color: var(--color-brand-primary);
		background: rgba(255, 212, 0, 0.1);
	}

	.feeling-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: -0.04em;
	}

	.feeling-label--active {
		color: var(--color-brand-primary);
	}

	/* ── Notes ───────────────────────────────────────────── */
	.notes-input {
		width: 100%;
		min-height: 120px;
		padding: 18px;
		background: var(--color-bg-component);
		border: 2px solid var(--color-border-default);
		border-radius: 12px;
		font-size: var(--font-size-md);
		font-family: inherit;
		color: var(--color-text-default);
		line-height: 1.6;
		resize: none;
		outline: none;
		transition: border-color 0.15s;
	}

	.notes-input:focus {
		border-color: var(--color-brand-primary);
	}

	.notes-input::placeholder {
		color: var(--color-text-tertiary);
		font-weight: var(--font-weight-regular);
	}

	/* ── Actions ─────────────────────────────────────────── */
	.actions {
		display: flex;
		flex-direction: column;
		gap: 16px;
		width: 100%;
	}

	.btn-save {
		width: 100%;
		padding: 16px;
		background: var(--color-brand-primary);
		border: none;
		border-radius: 12px;
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-default);
		cursor: pointer;
		font-family: inherit;
		box-shadow: 0 10px 15px -3px rgba(255, 212, 0, 0.2), 0 4px 6px -4px rgba(255, 212, 0, 0.2);
	}

	.btn-discard {
		width: 100%;
		padding: 18px;
		background: none;
		border: 2px solid var(--color-border-default);
		border-radius: 12px;
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-secondary);
		cursor: pointer;
		font-family: inherit;
	}
</style>
