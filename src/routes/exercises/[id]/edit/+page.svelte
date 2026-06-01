<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Music, BookOpen, Disc3, MoreHorizontal, Mic2, Headphones, Music2, Speaker, ListMusic, Radio, Camera } from 'lucide-svelte';
	import SubPageHeader from '$components/SubPageHeader.svelte';
	import { db, type Category } from '$db/index';
	import { getCategories, seedCategories } from '$lib/db/categories';

	const ICON_MAP: Record<string, typeof Music> = {
		Music, BookOpen, Disc3, MoreHorizontal, Mic2, Headphones, Music2, Speaker, ListMusic, Radio
	};

	const exerciseId = $derived(parseInt(page.params.id ?? '0'));
	const originalId = $derived(page.url.searchParams.get('originalId'));

	let categories = $state<Category[]>([]);
	let name = $state('');
	let category = $state<string | null>(null);
	let author = $state('');
	let book = $state('');
	let targetBpm = $state(120);
	let durationMin = $state<number | ''>('');
	let description = $state('');
	let currentPhotoBlob = $state<Blob | null>(null);
	let photoFile = $state<File | null>(null);
	let photoPreview = $state<string | null>(null);
	let photoInput = $state<HTMLInputElement | null>(null);

	const canSave = $derived(name.trim().length > 0 && category !== null);

	async function load() {
		const ex = await db.exercises.get(exerciseId);
		if (!ex) { goto('/'); return; }

		name = ex.name;
		category = ex.category;
		author = ex.author ?? '';
		book = ex.book ?? '';
		targetBpm = ex.targetBpm;
		durationMin = ex.duration ? Math.round(ex.duration / 60) : '';
		description = ex.description ?? '';

		if (ex.referencePhoto) {
			currentPhotoBlob = ex.referencePhoto;
			photoPreview = URL.createObjectURL(ex.referencePhoto);
		}
	}

	function handlePhotoChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		if (photoPreview && photoFile) URL.revokeObjectURL(photoPreview);
		photoFile = file;
		photoPreview = URL.createObjectURL(file);
	}

	async function save() {
		if (!canSave || !category) return;
		const mins = Number(durationMin) || 0;
		const photo = photoFile ?? currentPhotoBlob ?? undefined;

		await db.exercises.update(exerciseId, {
			name: name.trim(),
			targetBpm: Math.min(Math.max(Number(targetBpm), 40), 240),
			category,
			author: author.trim() || undefined,
			book: book.trim() || undefined,
			duration: mins > 0 ? mins * 60 : undefined,
			description: description.trim() || undefined,
			referencePhoto: photo || undefined
		});
		goto(`/exercises/${exerciseId}`);
	}

	async function discard() {
		if (originalId) {
			// Duplicate mode: delete the copy and go back to the original
			await db.exercises.delete(exerciseId);
			goto(`/exercises/${originalId}`);
		} else {
			goto(`/exercises/${exerciseId}`);
		}
	}

	onMount(async () => {
		await seedCategories();
		categories = await getCategories();
		await load();
	});
</script>

<div class="page">
	<SubPageHeader title="Edit Exercise" onBack={discard} />

	<main class="page-main">
		<!-- Exercise Name -->
		<div class="field">
			<label class="field-label" for="ex-name">Name</label>
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
			<p class="field-label" id="cat-label">Category</p>
			<div class="cat-grid" role="group" aria-labelledby="cat-label">
				{#each categories as cat}
					{@const Icon = ICON_MAP[cat.icon] ?? Music}
					<button
						type="button"
						class="cat-btn"
						class:cat-btn--active={category === cat.name}
						onclick={() => (category = cat.name)}
					>
						<Icon size={16} />
						{cat.name}
					</button>
				{/each}
			</div>
			<a
				href="/categories/new?returnTo=/exercises/{exerciseId}/edit{originalId ? `?originalId=${originalId}` : ''}"
				class="add-cat-link"
			>
				+ Add category
			</a>
		</div>

		<!-- Author / Book -->
		<div class="field-row">
			<div class="field">
				<label class="field-label" for="ex-author">Author</label>
				<input
					id="ex-author"
					type="text"
					class="field-input"
					placeholder="e.g. Hanon"
					bind:value={author}
				/>
			</div>
			<div class="field">
				<label class="field-label" for="ex-book">Book</label>
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
			<label class="field-label" for="ex-bpm">Target BPM</label>
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
				<button type="button" class="photo-preview-btn" onclick={() => photoInput?.click()}>
					<img src={photoPreview} alt="Reference" class="photo-preview" />
				</button>
			{:else}
				<button type="button" class="photo-drop-zone" onclick={() => photoInput?.click()}>
					<Camera size={28} />
					<span>Scan Sheet Music</span>
				</button>
			{/if}
		</div>
	</main>

	<footer class="page-footer">
		<button class="btn-discard" onclick={discard}>Discard</button>
		<button class="btn-save" onclick={save} disabled={!canSave}>Save</button>
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

	.field-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	/* ── Category ────────────────────────────────────────── */
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
		transition: background 0.15s, border-color 0.15s, color 0.15s;
	}

	.cat-btn--active {
		background: var(--color-brand-primary);
		border-color: var(--color-brand-primary);
		color: var(--color-text-default);
		font-weight: var(--font-weight-strong);
	}

	/* ── Suffix inputs ───────────────────────────────────── */
	/* ── Add category link ───────────────────────────────── */
	.add-cat-link {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		color: var(--color-brand-primary);
		text-decoration: none;
		margin-top: 4px;
	}

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

	.bpm-range {
		display: flex;
		justify-content: space-between;
		padding: 0 4px;
		font-size: var(--font-size-sm);
		color: var(--color-text-tertiary);
	}

	/* ── Textarea ────────────────────────────────────────── */
	.field-textarea {
		height: auto;
		min-height: 100px;
		padding: 14px 16px;
		resize: none;
		line-height: 1.6;
	}

	/* ── Photo ───────────────────────────────────────────── */
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
		border-top: 1px solid var(--color-border-default);
		padding: 17px 16px 16px;
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
	}

	.btn-discard {
		height: 56px;
		border-radius: 12px;
		border: 1px solid var(--color-border-default);
		background: none;
		color: var(--color-text-secondary);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-family: inherit;
		cursor: pointer;
	}

	.btn-save {
		height: 56px;
		border-radius: 12px;
		border: none;
		background: var(--color-brand-primary);
		color: var(--color-text-default);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		font-family: inherit;
		cursor: pointer;
		box-shadow: 0 10px 15px -3px rgba(255, 212, 0, 0.2), 0 4px 6px -4px rgba(255, 212, 0, 0.2);
		transition: opacity 0.15s;
	}

	.btn-save:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
