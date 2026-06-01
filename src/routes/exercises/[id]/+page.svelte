<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { ChevronLeft, MoreVertical, Play, Plus, Camera } from 'lucide-svelte';
	import { Dialog, DropdownMenu } from 'bits-ui';
	import { db, type Exercise, type Practice, type PracticeFeeling } from '$db/index';
	import ProgressChart from '$components/ProgressChart.svelte';

	const exerciseId = $derived(parseInt(page.params.id ?? '0'));

	let exercise = $state<Exercise | null>(null);
	let practices = $state<Practice[]>([]); // sorted desc by date
	let photoUrl = $state<string | null>(null);
	let deleteOpen = $state(false);
	let entryOpen = $state(false);
	let photoInputEl = $state<HTMLInputElement | null>(null);

	// Add manual entry form
	let entryBpm = $state(0);
	let entryDuration = $state<number | ''>('');
	let entryFeeling = $state<PracticeFeeling | null>(null);
	let entryNotes = $state('');

	const FEELINGS: { key: PracticeFeeling; label: string; emoji: string }[] = [
		{ key: 'poor', label: 'Poor', emoji: '😟' },
		{ key: 'okay', label: 'Okay', emoji: '😐' },
		{ key: 'good', label: 'Good', emoji: '🙂' },
		{ key: 'great', label: 'Great', emoji: '😄' }
	];

	const feelingEmoji: Record<PracticeFeeling, string> = {
		poor: '😟', okay: '😐', good: '🙂', great: '😄'
	};

	// Derived stats
	const lastPractice = $derived(practices[0]);
	const prevPractice = $derived(practices[1]);

	const currentDelta = $derived(
		lastPractice && prevPractice ? lastPractice.bpm - prevPractice.bpm : null
	);

	const sessionCount = $derived(practices.length);

	async function load() {
		const ex = await db.exercises.get(exerciseId);
		if (!ex) { goto('/'); return; }
		exercise = ex;

		if (ex.referencePhoto) {
			photoUrl = URL.createObjectURL(ex.referencePhoto);
		}

		const all = await db.practices.where('exerciseId').equals(exerciseId).toArray();
		practices = all.sort((a, b) => b.date.localeCompare(a.date));

		if (lastPractice) {
			entryBpm = lastPractice.bpm;
		} else if (exercise) {
			entryBpm = exercise.targetBpm;
		}
	}

	async function deleteExercise() {
		await db.practices.where('exerciseId').equals(exerciseId).delete();
		await db.exercises.delete(exerciseId);
		goto('/');
	}

	async function generateDuplicateName(originalName: string): Promise<string> {
		const all = await db.exercises.toArray();
		const names = new Set(all.map((e) => e.name));
		const base = originalName.replace(/\s+\d+$/, ''); // strip trailing number
		let n = 2;
		while (names.has(`${base} ${n}`)) n++;
		return `${base} ${n}`;
	}

	async function duplicateExercise() {
		if (!exercise) return;
		const newName = await generateDuplicateName(exercise.name);
		const newId = (await db.exercises.add({
			name: newName,
			targetBpm: exercise.targetBpm,
			category: exercise.category,
			author: exercise.author,
			book: exercise.book,
			duration: exercise.duration,
			description: exercise.description,
			referencePhoto: exercise.referencePhoto,
			createdAt: new Date().toISOString().split('T')[0]
		})) as number;
		goto(`/exercises/${newId}/edit?originalId=${exerciseId}`);
	}

	async function handlePhotoChange(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (photoUrl) URL.revokeObjectURL(photoUrl);
		await db.exercises.update(exerciseId, { referencePhoto: file });
		photoUrl = URL.createObjectURL(file);
	}

	async function deletePractice(practiceId: number) {
		await db.practices.delete(practiceId);
		await load();
	}

	async function addEntry() {
		if (!entryBpm || !exercise) return;
		await db.practices.add({
			exerciseId,
			bpm: Number(entryBpm),
			date: new Date().toISOString().split('T')[0],
			duration: entryDuration ? Number(entryDuration) : undefined,
			feeling: entryFeeling ?? undefined,
			notes: entryNotes.trim() || undefined
		});
		entryOpen = false;
		entryNotes = '';
		entryDuration = '';
		entryFeeling = null;
		await load();
	}

	function formatDate(dateStr: string): string {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		if (dateStr >= today) return 'Today';
		if (dateStr >= yesterday) return 'Yesterday';
		const d = new Date(dateStr + 'T12:00:00');
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
	}

	function deltaColor(delta: number): string {
		if (delta > 0) return 'var(--color-brand-success)';
		if (delta < 0) return 'var(--color-brand-danger)';
		return 'var(--color-text-tertiary)';
	}

	function deltaLabel(delta: number): string {
		if (delta > 0) return `+${delta}`;
		return String(delta);
	}

	onMount(() => { load(); });
</script>

<div class="page">
	<!-- Header -->
	<header class="page-header">
		<button class="icon-btn" onclick={() => goto('/')} aria-label="Go back">
			<ChevronLeft size={20} />
		</button>

		<span class="header-title">Exercise Detail</span>

		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<button class="icon-btn" aria-label="Options" {...props}>
						<MoreVertical size={20} />
					</button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content class="dropdown-content">
					<DropdownMenu.Item
						class="dropdown-item"
						onSelect={() => goto(`/exercises/${exerciseId}/edit`)}
					>
						Edit
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="dropdown-item"
						onSelect={duplicateExercise}
					>
						Duplicate
					</DropdownMenu.Item>
					<DropdownMenu.Item
						class="dropdown-item dropdown-item--danger"
						onSelect={() => (deleteOpen = true)}
					>
						Delete
					</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	</header>

	{#if exercise}
		<div class="page-content">
			<!-- Hero -->
			<section class="hero">
				<div class="hero-thumb">
					{#if photoUrl}
						<img src={photoUrl} alt="Reference" class="hero-photo" />
					{:else}
						<Camera size={28} color="rgba(15,23,42,0.5)" />
					{/if}
				</div>
				<div class="hero-info">
					<h1 class="hero-name">{exercise.name}</h1>
					{#if exercise.author}
						<p class="hero-author">by {exercise.author}</p>
					{/if}
					{#if exercise.book}
						<span class="hero-book">{exercise.book}</span>
					{/if}
				</div>
			</section>

			<!-- Quick stats -->
			<section class="stats-grid">
				<div class="stat-card">
					<span class="stat-label">Target</span>
					<div class="stat-value">
						<span class="stat-number">{exercise.targetBpm}</span>
						<span class="stat-unit">BPM</span>
					</div>
					{#if lastPractice}
						{@const pct = Math.round((lastPractice.bpm / exercise.targetBpm) * 100)}
						<span class="stat-sub" style="color: {pct >= 100 ? 'var(--color-brand-success)' : 'var(--color-text-tertiary)'}">
							{pct}% reached
						</span>
					{:else}
						<span class="stat-sub">—</span>
					{/if}
				</div>

				<div class="stat-card">
					<span class="stat-label">Current</span>
					<div class="stat-value">
						<span class="stat-number">{lastPractice?.bpm ?? '—'}</span>
						{#if lastPractice}<span class="stat-unit">BPM</span>{/if}
					</div>
					{#if currentDelta !== null}
						<span class="stat-sub" style="color: {deltaColor(currentDelta)}">
							{deltaLabel(currentDelta)} BPM
						</span>
					{:else}
						<span class="stat-sub">—</span>
					{/if}
				</div>

				<div class="stat-card">
					<span class="stat-label">Sessions</span>
					<div class="stat-value">
						<span class="stat-number">{sessionCount}</span>
					</div>
					<span class="stat-sub">Total</span>
				</div>
			</section>

			<!-- Reference photo -->
			<section class="section">
				<h2 class="section-title">Reference Photo</h2>
				<input
					bind:this={photoInputEl}
					type="file"
					accept="image/*"
					capture="environment"
					class="photo-input-hidden"
					onchange={handlePhotoChange}
				/>
				<button class="photo-edit-btn" onclick={() => photoInputEl?.click()} aria-label="Change reference photo">
					{#if photoUrl}
						<img src={photoUrl} alt="Reference" class="reference-photo" />
						<span class="photo-edit-badge"><Camera size={14} /></span>
					{:else}
						<div class="photo-placeholder">
							<Camera size={28} />
							<span>Scan Sheet Music</span>
						</div>
					{/if}
				</button>
			</section>

			<!-- Progress chart -->
			<section class="section">
				<h2 class="section-title">Performance Progress</h2>
				<div class="chart-card">
					<ProgressChart {practices} targetBpm={exercise.targetBpm} />
				</div>
			</section>

			<!-- Practice history -->
			<section class="section">
				<div class="section-header">
					<h2 class="section-title">Practice History</h2>
				</div>

				{#if practices.length === 0}
					<p class="empty-msg">No practice sessions yet.</p>
				{:else}
					<div class="history-list">
						{#each practices as p, i (p.id)}
							{@const delta = i < practices.length - 1 ? p.bpm - practices[i + 1].bpm : null}
							<div class="session-card" style="opacity: {Math.max(1 - i * 0.15, 0.5)}">
								<div class="session-row">
									<div>
										<p class="session-date">{formatDate(p.date)}{p.duration ? ` • ${p.duration}m` : ''}{p.feeling ? ` • ${feelingEmoji[p.feeling]}` : ''}</p>
										<p class="session-bpm">{p.bpm} BPM</p>
									</div>
									<div class="session-actions">
										{#if delta !== null}
											<span class="session-delta" style="color: {deltaColor(delta)}">
												{deltaLabel(delta)}
											</span>
										{/if}
										<DropdownMenu.Root>
											<DropdownMenu.Trigger>
												{#snippet child({ props })}
													<button class="session-menu-btn" aria-label="Options" {...props}>
														<svg width="4" height="16" viewBox="0 0 4 16" fill="currentColor">
															<circle cx="2" cy="2" r="1.5"/>
															<circle cx="2" cy="8" r="1.5"/>
															<circle cx="2" cy="14" r="1.5"/>
														</svg>
													</button>
												{/snippet}
											</DropdownMenu.Trigger>
											<DropdownMenu.Portal>
												<DropdownMenu.Content class="dropdown-content">
													<DropdownMenu.Item
														class="dropdown-item dropdown-item--danger"
														onSelect={() => deletePractice(p.id!)}
													>
														Delete practice
													</DropdownMenu.Item>
												</DropdownMenu.Content>
											</DropdownMenu.Portal>
										</DropdownMenu.Root>
									</div>
								</div>
								{#if p.notes}
									<p class="session-notes">"{p.notes}"</p>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</section>
		</div>

		<!-- Action buttons -->
		<footer class="page-footer">
			<button class="btn-primary" onclick={() => goto(`/exercises/${exerciseId}/practice`)}>
				<Play size={14} />
				Start Practice Session
			</button>
			<button class="btn-secondary" onclick={() => (entryOpen = true)}>
				<Plus size={12} />
				Add Manual Entry
			</button>
		</footer>
	{/if}
</div>

<!-- Delete confirmation dialog -->
<Dialog.Root bind:open={deleteOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="dialog-content">
			<Dialog.Title class="dialog-title">Delete Exercise?</Dialog.Title>
			<Dialog.Description class="dialog-desc">
				This will permanently delete the exercise and all its practice history. This action cannot be undone.
			</Dialog.Description>
			<div class="dialog-actions">
				<Dialog.Close class="btn-dialog-cancel">Cancel</Dialog.Close>
				<button class="btn-dialog-delete" onclick={deleteExercise}>Delete</button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<!-- Add manual entry dialog -->
<Dialog.Root bind:open={entryOpen}>
	<Dialog.Portal>
		<Dialog.Overlay class="dialog-overlay" />
		<Dialog.Content class="dialog-content">
			<Dialog.Title class="dialog-title">Add Manual Entry</Dialog.Title>
			<form onsubmit={(e) => { e.preventDefault(); addEntry(); }}>
				<div class="field">
					<label class="field-label" for="entry-bpm">BPM *</label>
					<input id="entry-bpm" type="number" class="field-input" bind:value={entryBpm} min="20" max="400" required />
				</div>
				<div class="field">
					<label class="field-label" for="entry-dur">Duration (min)</label>
					<input id="entry-dur" type="number" class="field-input" bind:value={entryDuration} min="1" max="300" placeholder="Optional" />
				</div>
				<div class="field">
					<p class="field-label" id="entry-feel-label">How did it feel?</p>
					<div class="entry-feelings" role="group" aria-labelledby="entry-feel-label">
						{#each FEELINGS as f}
							<button
								type="button"
								class="entry-feel-btn"
								class:entry-feel-btn--active={entryFeeling === f.key}
								onclick={() => (entryFeeling = f.key)}
								title={f.label}
							>
								{f.emoji}
							</button>
						{/each}
					</div>
				</div>
				<div class="field">
					<label class="field-label" for="entry-notes">Notes</label>
					<textarea id="entry-notes" class="field-input field-textarea" bind:value={entryNotes} placeholder="How did it go?"></textarea>
				</div>
				<div class="dialog-actions">
					<Dialog.Close class="btn-dialog-cancel">Cancel</Dialog.Close>
					<button type="submit" class="btn-dialog-confirm">Save</button>
				</div>
			</form>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>

<style>
	/* ── Layout ──────────────────────────────────────────── */
	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-bottom: 0;
	}

	.page-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0;
		padding-bottom: 140px; /* clearance for sticky footer */
	}

	/* ── Header ──────────────────────────────────────────── */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 8px;
		background: color-mix(in srgb, var(--color-bg-layout) 85%, transparent);
		backdrop-filter: blur(6px);
		-webkit-backdrop-filter: blur(6px);
	}

	.header-title {
		font-size: var(--font-size-h4);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: -0.02em;
	}

	.icon-btn {
		width: 40px;
		height: 40px;
		border: none;
		background: none;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-default);
	}

	/* ── Hero ────────────────────────────────────────────── */
	.hero {
		display: flex;
		gap: 16px;
		align-items: flex-start;
		padding: 24px;
	}

	.hero-thumb {
		width: 96px;
		height: 96px;
		border-radius: 12px;
		background: var(--color-brand-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		overflow: hidden;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
	}

	.hero-photo {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.hero-name {
		font-size: 36px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		line-height: 1;
		letter-spacing: -0.05em;
		margin: 0;
	}

	.hero-author {
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-secondary);
		margin: 4px 0;
	}

	.hero-book {
		display: inline-block;
		background: var(--color-bg-subtle);
		border-radius: 4px;
		padding: 3px 8px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: 0.04em;
		line-height: 1.2em;
	}

	/* ── Quick stats ─────────────────────────────────────── */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12px;
		padding: 0 24px 24px;
	}

	.stat-card {
		background: var(--color-bg-component);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		padding: 17px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.stat-label {
		font-size: 10px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		letter-spacing: 0.08em;
	}

	.stat-value {
		display: flex;
		align-items: baseline;
		gap: 3px;
	}

	.stat-number {
		font-size: 24px;
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		letter-spacing: -0.025em;
		line-height: 1.2;
	}

	.stat-unit {
		font-size: 10px;
		font-weight: var(--font-weight-regular);
		color: var(--color-text-default);
		opacity: 0.5;
		text-transform: uppercase;
	}

	.stat-sub {
		font-size: 10px;
		font-weight: var(--font-weight-strong);
		color: var(--color-text-tertiary);
		line-height: 1.2em;
	}

	/* ── Sections ────────────────────────────────────────── */
	.section {
		padding: 0 24px 24px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.section-title {
		font-size: 14px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: 0.1em;
		margin: 0;
	}

	/* ── Reference photo ─────────────────────────────────── */
	.photo-input-hidden {
		display: none;
	}

	.photo-edit-btn {
		position: relative;
		display: block;
		width: 100%;
		border: none;
		padding: 0;
		background: none;
		cursor: pointer;
		border-radius: 12px;
		overflow: hidden;
	}

	.reference-photo {
		width: 100%;
		height: 128px;
		object-fit: cover;
		display: block;
	}

	.photo-edit-badge {
		position: absolute;
		bottom: 8px;
		right: 8px;
		width: 28px;
		height: 28px;
		background: var(--color-brand-primary);
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-default);
	}

	.photo-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 8px;
		height: 128px;
		border: 2px dashed rgba(255, 212, 0, 0.3);
		border-radius: 12px;
		background: rgba(255, 212, 0, 0.05);
		color: var(--color-brand-primary);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	/* ── Progress chart ──────────────────────────────────── */
	.chart-card {
		background: var(--color-bg-component);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		padding: 17px;
	}

	/* ── Practice history ────────────────────────────────── */
	.empty-msg {
		color: var(--color-text-tertiary);
		font-size: var(--font-size-sm);
		text-align: center;
		padding: 24px 0;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.session-card {
		background: var(--color-bg-component);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		padding: 17px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.session-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
	}

	.session-date {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		margin: 0;
	}

	.session-bpm {
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		margin: 2px 0 0;
	}

	.session-actions {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.session-menu-btn {
		width: 28px;
		height: 28px;
		border: none;
		background: none;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-tertiary);
		cursor: pointer;
	}

	.session-menu-btn:hover {
		background: var(--color-bg-subtle);
		color: var(--color-text-default);
	}

	.session-delta {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		flex-shrink: 0;
		margin-top: 2px;
	}

	.session-notes {
		font-size: 14px;
		font-weight: var(--font-weight-regular);
		color: var(--color-text-secondary);
		margin: 0;
		line-height: 1.5;
	}

	/* ── Action footer ───────────────────────────────────── */
	.page-footer {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 10;
		padding: 16px 24px;
		background: var(--color-bg-layout);
		border-top: 1px solid var(--color-border-default);
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.btn-primary {
		height: 56px;
		border-radius: 12px;
		border: none;
		background: var(--color-brand-primary);
		color: var(--color-text-default);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-family: inherit;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
	}

	.btn-secondary {
		height: 48px;
		border-radius: 12px;
		border: none;
		background: var(--color-text-default);
		color: var(--color-bg-component);
		font-size: 14px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-family: inherit;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
	}

	/* ── Dialogs (portaled) ──────────────────────────────── */
	:global(.dialog-overlay) {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 50;
	}

	:global(.dialog-content) {
		position: fixed;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		background: var(--color-bg-component);
		border-radius: 16px;
		padding: 24px;
		width: min(400px, calc(100vw - 32px));
		z-index: 51;
		box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
	}

	:global(.dialog-title) {
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		margin-bottom: 8px;
		display: block;
	}

	.dialog-desc {
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin-bottom: 20px;
	}

	.dialog-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		margin-top: 16px;
	}

	:global(.btn-dialog-cancel) {
		background: none;
		border: 1px solid var(--color-border-default);
		border-radius: 8px;
		padding: 8px 16px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		cursor: pointer;
		font-family: inherit;
	}

	.btn-dialog-delete {
		background: var(--color-brand-danger);
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: white;
		cursor: pointer;
		font-family: inherit;
	}

	.btn-dialog-confirm {
		background: var(--color-brand-primary);
		border: none;
		border-radius: 8px;
		padding: 8px 16px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		cursor: pointer;
		font-family: inherit;
	}

	/* ── Dropdown menu (portaled) ────────────────────────── */
	:global(.dropdown-content) {
		background: var(--color-bg-component);
		border: 1px solid var(--color-border-default);
		border-radius: 12px;
		padding: 4px;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
		z-index: 50;
		min-width: 140px;
	}

	:global(.dropdown-item) {
		display: block;
		width: 100%;
		padding: 10px 16px;
		border: none;
		background: none;
		text-align: left;
		font-size: 14px;
		font-weight: var(--font-weight-medium);
		color: var(--color-text-default);
		border-radius: 8px;
		cursor: pointer;
		font-family: inherit;
	}

	:global(.dropdown-item:hover) {
		background: var(--color-bg-subtle);
	}

	:global(.dropdown-item--danger) {
		color: var(--color-brand-danger);
	}

	/* ── Form fields ─────────────────────────────────────── */
	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 12px;
	}

	.field-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		letter-spacing: 0.04em;
	}

	.field-input {
		padding: 10px 14px;
		background: var(--color-bg-subtle);
		border: 1px solid var(--color-border-default);
		border-radius: 8px;
		font-size: var(--font-size-md);
		color: var(--color-text-default);
		font-family: inherit;
		outline: none;
	}

	.field-input:focus {
		border-color: var(--color-brand-primary);
	}

	.field-textarea {
		resize: vertical;
		min-height: 80px;
		line-height: 1.5;
	}

	.entry-feelings {
		display: flex;
		gap: 8px;
	}

	.entry-feel-btn {
		flex: 1;
		height: 48px;
		border-radius: 10px;
		border: 2px solid var(--color-border-default);
		background: none;
		font-size: 22px;
		cursor: pointer;
		transition: border-color 0.15s, background 0.15s;
	}

	.entry-feel-btn--active {
		border-color: var(--color-brand-primary);
		background: rgba(255, 212, 0, 0.1);
	}
</style>
