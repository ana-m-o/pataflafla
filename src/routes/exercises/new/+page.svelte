<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { ChevronLeft, Music, BookOpen, Disc3, MoreHorizontal, Camera } from 'lucide-svelte';
	import { db, type ExerciseCategory } from '$db/index';

	const CAT_ICONS = {
		Scales: Music,
		Etudes: BookOpen,
		Repertoire: Disc3,
		Other: MoreHorizontal
	} as const;

	const CAT_VALUES = ['Scales', 'Etudes', 'Repertoire', 'Other'] as const;

	let name = $state('');
	let category = $state<ExerciseCategory | null>(null);
	let author = $state('');
	let book = $state('');
	let targetBpm = $state(120);
	let durationMin = $state<number | ''>('');
	let description = $state('');
	let photoFile = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);
	let photoInput: HTMLInputElement;

	const canSave = $derived(name.trim().length > 0 && category !== null);

	function handlePhotoChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (photoPreview) URL.revokeObjectURL(photoPreview);
		photoFile = file;
		photoPreview = URL.createObjectURL(file);
	}

	async function save() {
		if (!canSave || !category) return;
		const mins = Number(durationMin) || 0;

		await db.exercises.add({
			name: name.trim(),
			targetBpm: Math.min(Math.max(Number(targetBpm), 40), 240),
			category,
			author: author.trim() || undefined,
			book: book.trim() || undefined,
			duration: mins > 0 ? mins * 60 : undefined,
			description: description.trim() || undefined,
			referencePhoto: photoFile ?? undefined,
			createdAt: new Date().toISOString().split('T')[0]
		});
		goto('/');
	}
</script>

<div class="page">
	<header class="page-header">
		<button class="back-btn" onclick={() => goto('/')} aria-label="Go back">
			<ChevronLeft size={20} />
		</button>
		<h1 class="page-title">{$_('exercises.newExercise')}</h1>
	</header>

	<main class="page-main">
		<!-- Exercise Name -->
		<div class="field">
			<label class="field-label" for="ex-name">{$_('exercises.name')}</label>
			<input
				id="ex-name"
				type="text"
				class="field-input"
				placeholder="e.g. C Major Scale"
				bind:value={name}
			/>
		</div>

		<!-- Category -->
		<div class="field">
			<p class="field-label" id="cat-label">{$_('exercises.category')}</p>
			<div class="cat-grid" role="group" aria-labelledby="cat-label">
				{#each CAT_VALUES as val}
					{@const Icon = CAT_ICONS[val]}
					<button
						type="button"
						class="cat-btn"
						class:cat-btn--active={category === val}
						onclick={() => (category = val)}
					>
						<Icon size={16} />
						{$_(`categories.${val}`)}
					</button>
				{/each}
			</div>
		</div>

		<!-- Author / Book -->
		<div class="field-row">
			<div class="field">
				<label class="field-label" for="ex-author">{$_('exercises.author')}</label>
				<input
					id="ex-author"
					type="text"
					class="field-input"
					placeholder="e.g. Hanon"
					bind:value={author}
				/>
			</div>
			<div class="field">
				<label class="field-label" for="ex-book">{$_('exercises.book')}</label>
				<input
					id="ex-book"
					type="text"
					class="field-input"
					placeholder="Optional"
					bind:value={book}
				/>
			</div>
		</div>

		<!-- Target BPM -->
		<div class="field">
			<label class="field-label" for="ex-bpm">{$_('exercises.targetBpm')}</label>
			<div class="suffix-wrapper">
				<input
					id="ex-bpm"
					type="number"
					class="field-input"
					min="40"
					max="240"
					bind:value={targetBpm}
				/>
				<span class="input-suffix">BPM</span>
			</div>
			<div class="bpm-range">
				<span>Slowest: 40</span>
				<span>Fastest: 240</span>
			</div>
		</div>

		<!-- Duration -->
		<div class="field">
			<label class="field-label" for="dur-min">Duration</label>
			<div class="suffix-wrapper">
				<input
					id="dur-min"
					type="number"
					class="field-input"
					min="1"
					max="120"
					placeholder="e.g. 10"
					bind:value={durationMin}
				/>
				<span class="input-suffix">min</span>
			</div>
		</div>

		<!-- Description -->
		<div class="field">
			<label class="field-label" for="ex-desc">Description</label>
			<textarea
				id="ex-desc"
				class="field-input field-textarea"
				placeholder="Notes, technique tips, context…"
				bind:value={description}
			></textarea>
		</div>

		<!-- Reference Photo -->
		<div class="field">
			<label class="field-label" for="photo-input">Reference Photo</label>
			<input
				id="photo-input"
				bind:this={photoInput}
				type="file"
				accept="image/*"
				capture="environment"
				class="photo-input-hidden"
				onchange={handlePhotoChange}
			/>
			{#if photoPreview}
				<button type="button" class="photo-preview-btn" onclick={() => photoInput.click()}>
					<img src={photoPreview} alt="Reference" class="photo-preview" />
				</button>
			{:else}
				<button type="button" class="photo-drop-zone" onclick={() => photoInput.click()}>
					<Camera size={28} class="photo-icon" />
					<span class="photo-label">Scan Sheet Music</span>
				</button>
			{/if}
		</div>
	</main>

	<footer class="page-footer">
		<button class="btn-save" onclick={save} disabled={!canSave}>
			{$_('exercises.add')}
		</button>
	</footer>
</div>

<style>
	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		padding-bottom: 0;
	}

	/* ── Header ─────────────────────────────────────────── */
	.page-header {
		display: flex;
		align-items: center;
		gap: 0;
		padding: 16px 16px 9px;
		border-bottom: 1px solid rgba(255, 212, 0, 0.1);
		background: var(--color-bg-layout);
		position: sticky;
		top: 0;
		z-index: 10;
	}

	.back-btn {
		background: none;
		border: none;
		border-radius: 9999px;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-default);
		flex-shrink: 0;
	}

	.page-title {
		flex: 1;
		text-align: center;
		font-size: var(--font-size-h4);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		letter-spacing: -0.02em;
		/* optical centering: subtract the back button width */
		padding-right: 48px;
	}

	/* ── Main ────────────────────────────────────────────── */
	.page-main {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 24px;
		padding: 24px 16px 8px;
	}

	/* ── Field ───────────────────────────────────────────── */
	.field {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.field-label {
		font-size: 14px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: 0.05em;
	}

	.field-input {
		width: 100%;
		height: 56px;
		padding: 0 16px;
		background: var(--color-bg-component);
		border: 1px solid rgba(255, 212, 0, 0.2);
		border-radius: 12px;
		font-size: var(--font-size-md);
		font-family: inherit;
		color: var(--color-text-default);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
		outline: none;
		transition: border-color 0.15s;
	}

	.field-input:focus {
		border-color: var(--color-brand-primary);
	}

	.field-input::placeholder {
		color: var(--color-text-tertiary);
		font-weight: var(--font-weight-regular);
	}

	/* ── Author / Book row ───────────────────────────────── */
	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	/* ── Category grid ───────────────────────────────────── */
	.cat-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 8px;
	}

	.cat-btn {
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		border: 1px solid rgba(255, 212, 0, 0.2);
		border-radius: 12px;
		background: var(--color-bg-component);
		color: var(--color-text-secondary);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-medium);
		font-family: inherit;
		transition:
			background 0.15s,
			border-color 0.15s,
			color 0.15s;
	}

	.cat-btn--active {
		background: var(--color-brand-primary);
		border-color: var(--color-brand-primary);
		color: var(--color-text-default);
		font-weight: var(--font-weight-strong);
	}

	/* ── BPM ─────────────────────────────────────────────── */
	.bpm-range {
		display: flex;
		justify-content: space-between;
		padding: 0 4px;
		font-size: var(--font-size-sm);
		color: var(--color-text-tertiary);
	}

	/* ── Input with suffix (Duration, BPM) ──────────────── */
	.suffix-wrapper {
		position: relative;
	}

	.input-suffix {
		position: absolute;
		right: 16px;
		top: 50%;
		transform: translateY(-50%);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-medium);
		color: var(--color-text-tertiary);
		pointer-events: none;
	}

	/* ── Textarea ────────────────────────────────────────── */
	.field-textarea {
		height: auto;
		min-height: 100px;
		padding: 14px 16px;
		resize: none;
		line-height: 1.6;
	}

	/* ── Reference photo ─────────────────────────────────── */
	.photo-input-hidden {
		display: none;
	}

	.photo-drop-zone {
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

	.photo-preview-btn {
		border: none;
		border-radius: 12px;
		overflow: hidden;
		padding: 0;
		width: 100%;
		height: 128px;
		cursor: pointer;
	}

	.photo-preview {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* ── Footer ──────────────────────────────────────────── */
	.page-footer {
		position: sticky;
		bottom: 0;
		background: var(--color-bg-layout);
		border-top: 1px solid rgba(255, 212, 0, 0.1);
		padding: 17px 16px 16px;
	}

	.btn-save {
		width: 100%;
		height: 56px;
		border-radius: 12px;
		border: none;
		background: var(--color-brand-primary);
		color: var(--color-text-default);
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		font-family: inherit;
		cursor: pointer;
		box-shadow:
			0 10px 15px -3px rgba(255, 212, 0, 0.2),
			0 4px 6px -4px rgba(255, 212, 0, 0.2);
		transition: opacity 0.15s;
	}

	.btn-save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

</style>
