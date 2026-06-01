<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { Smile } from 'lucide-svelte';
	import { db, type Exercise, type Practice, type PracticeFeeling } from '$db/index';
	import PracticeEndModal from '$components/PracticeEndModal.svelte';

	const exerciseId = $derived(parseInt(page.params.id ?? '0'));

	let exercise = $state<Exercise | null>(null);
	let lastPractice = $state<Practice | null>(null);
	let photoUrl = $state<string | null>(null);

	// ── Metronome state ───────────────────────────────────
	let bpm = $state(120);
	let isPlaying = $state(false);
	let beat = $state(false); // toggles to trigger pulse animation
	let elapsed = $state(0); // always counts up, used for saving
	let totalDuration = $state(0); // 0 = no limit (seconds from exercise)
	let remaining = $state(0); // countdown, only used when totalDuration > 0
	let showEndModal = $state(false);

	const hasCountdown = $derived(totalDuration > 0);

	let audioCtx: AudioContext | null = null;
	let nextBeatTime = 0;
	let schedulerTimer: ReturnType<typeof setTimeout> | null = null;
	let timerInterval: ReturnType<typeof setInterval> | null = null;
	let bpmRepeatTimer: ReturnType<typeof setInterval> | null = null;

	// ── Smart suggestion ──────────────────────────────────
	const suggestedBpm = $derived.by(() => {
		if (!lastPractice || !exercise) return exercise?.targetBpm ?? 120;
		const step = 5;
		return Math.min(lastPractice.bpm + step, exercise.targetBpm);
	});

	const showSuggestion = $derived(
		!!lastPractice && !!exercise && lastPractice.bpm < exercise.targetBpm
	);

	function formatDate(dateStr: string): string {
		const today = new Date().toISOString().split('T')[0];
		const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
		if (dateStr >= today) return 'today';
		if (dateStr >= yesterday) return 'yesterday';
		const d = new Date(dateStr + 'T12:00:00');
		return `on ${d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
	}

	// ── Metronome engine ──────────────────────────────────
	function scheduleBeep(time: number) {
		if (!audioCtx) return;
		const osc = audioCtx.createOscillator();
		const gain = audioCtx.createGain();
		osc.connect(gain);
		gain.connect(audioCtx.destination);
		osc.frequency.value = 880;
		gain.gain.setValueAtTime(0.5, time);
		gain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
		osc.start(time);
		osc.stop(time + 0.05);

		// Schedule visual pulse
		const delay = Math.max(0, (time - audioCtx.currentTime) * 1000);
		setTimeout(() => {
			beat = !beat;
		}, delay);
	}

	function runScheduler() {
		if (!audioCtx || !isPlaying) return;
		const lookahead = 0.1; // seconds ahead
		while (nextBeatTime < audioCtx.currentTime + lookahead) {
			scheduleBeep(nextBeatTime);
			nextBeatTime += 60 / bpm;
		}
		schedulerTimer = setTimeout(runScheduler, 25);
	}

	function play() {
		if (!audioCtx) audioCtx = new AudioContext();
		if (audioCtx.state === 'suspended') audioCtx.resume();
		isPlaying = true;
		nextBeatTime = audioCtx.currentTime + 0.05;
		runScheduler();
		timerInterval = setInterval(() => {
			elapsed++;
			if (hasCountdown) {
				remaining = Math.max(0, remaining - 1);
				if (remaining === 0) {
					pause();
					showEndModal = true;
				}
			}
		}, 1000);
	}

	function pause() {
		isPlaying = false;
		if (schedulerTimer) { clearTimeout(schedulerTimer); schedulerTimer = null; }
		if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
	}

	function toggle() {
		if (isPlaying) pause(); else play();
	}

	function resetTimer() {
		pause();
		elapsed = 0;
		if (hasCountdown) remaining = totalDuration;
	}

	// ── BPM controls with hold-to-repeat ─────────────────
	function changeBpm(delta: number) {
		bpm = Math.min(240, Math.max(40, bpm + delta));
		// Reset scheduler so next beat is immediate at new tempo
		if (isPlaying && audioCtx) {
			nextBeatTime = audioCtx.currentTime + 0.05;
		}
	}

	function startBpmChange(delta: number) {
		changeBpm(delta);
		bpmRepeatTimer = setInterval(() => changeBpm(delta), 120);
	}

	function stopBpmChange() {
		if (bpmRepeatTimer) { clearInterval(bpmRepeatTimer); bpmRepeatTimer = null; }
	}

	// ── Session end ───────────────────────────────────────
	function finish() {
		pause();
		showEndModal = true;
	}

	async function handleSave(feeling: PracticeFeeling | null, notes: string) {
		await db.practices.add({
			exerciseId,
			bpm,
			date: new Date().toISOString().split('T')[0],
			duration: Math.max(1, Math.round(elapsed / 60)),
			feeling: feeling ?? undefined,
			notes: notes.trim() || undefined
		});
		goto(`/exercises/${exerciseId}`);
	}

	function handleDiscard() {
		goto(`/exercises/${exerciseId}`);
	}

	// ── Timer display ─────────────────────────────────────
	const timerLabel = $derived.by(() => {
		const secs = hasCountdown ? remaining : elapsed;
		return `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;
	});

	// ── Load ──────────────────────────────────────────────
	async function load() {
		const ex = await db.exercises.get(exerciseId);
		if (!ex) { goto('/'); return; }
		exercise = ex;

		if (ex.duration) {
			totalDuration = ex.duration;
			remaining = ex.duration;
		}

		if (ex.referencePhoto) photoUrl = URL.createObjectURL(ex.referencePhoto);

		const practices = await db.practices.where('exerciseId').equals(exerciseId).toArray();
		if (practices.length > 0) {
			lastPractice = practices.sort((a, b) => b.date.localeCompare(a.date))[0];
			bpm = lastPractice.bpm;
		} else {
			bpm = ex.targetBpm;
		}
	}

	onMount(() => {
		load();
		return () => {
			pause();
			audioCtx?.close();
		};
	});
</script>

<div class="page">
	<!-- Header -->
	<header class="page-header">
		<button class="icon-btn" onclick={() => goto(`/exercises/${exerciseId}`)} aria-label="Back">
			<svg width="16" height="16" viewBox="0 0 16 16" fill="none">
				<path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
		</button>
		<div class="header-center">
			<span class="header-sub">{exercise?.name ?? ''}</span>
			<span class="header-title">Practice Mode</span>
		</div>
		<div style="width:32px"></div>
	</header>

	<div class="page-body">
		<!-- Smart Suggestion -->
		{#if showSuggestion && lastPractice}
			<section class="suggestion-section">
				<div class="suggestion-badge">
					<span>✦</span>
					<span>Smart Suggestion</span>
				</div>
				<div class="suggestion-card">
					<div class="suggestion-row">
						<p class="suggestion-title">Recommended: {suggestedBpm} BPM</p>
						<Smile size={20} color="var(--color-brand-primary)" />
					</div>
					<p class="suggestion-desc">
						You last practiced at {lastPractice.bpm} BPM {formatDate(lastPractice.date)}. Ready for a small step up?
					</p>
					<button class="btn-apply" onclick={() => { bpm = suggestedBpm; }}>
						Apply Recommendation ⚡
					</button>
				</div>
			</section>
		{/if}

		<!-- Reference photo -->
		{#if photoUrl}
			<section class="photo-section">
				<div class="photo-frame">
					<img src={photoUrl} alt="Sheet music reference" class="photo-img" />
				</div>
			</section>
		{/if}

		<!-- Metronome -->
		<section class="metronome-section">
			<div class="bpm-display" class:bpm-pulse={beat}>
				<span class="bpm-number">{bpm}</span>
				<div class="bpm-glow"></div>
			</div>
			<p class="bpm-label">Beats Per Minute</p>

			<div class="controls">
				<button
					class="ctrl-btn ctrl-btn--sm"
					aria-label="Decrease BPM"
					onpointerdown={() => startBpmChange(-1)}
					onpointerup={stopBpmChange}
					onpointerleave={stopBpmChange}
				>
					<svg width="18" height="3" viewBox="0 0 18 3" fill="none">
						<rect y="0.25" width="18" height="2.5" rx="1.25" fill="currentColor"/>
					</svg>
				</button>

				<button class="ctrl-btn ctrl-btn--play" onclick={toggle} aria-label={isPlaying ? 'Pause' : 'Play'}>
					{#if isPlaying}
						<!-- Pause icon -->
						<svg width="22" height="28" viewBox="0 0 22 28" fill="none">
							<rect x="0" y="0" width="8" height="28" rx="2" fill="white"/>
							<rect x="14" y="0" width="8" height="28" rx="2" fill="white"/>
						</svg>
					{:else}
						<!-- Play icon -->
						<svg width="22" height="28" viewBox="0 0 22 28" fill="none">
							<path d="M2 2L20 14L2 26V2Z" fill="white"/>
						</svg>
					{/if}
				</button>

				<button
					class="ctrl-btn ctrl-btn--sm"
					aria-label="Increase BPM"
					onpointerdown={() => startBpmChange(1)}
					onpointerup={stopBpmChange}
					onpointerleave={stopBpmChange}
				>
					<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
						<rect y="7.75" width="18" height="2.5" rx="1.25" fill="currentColor"/>
						<rect x="7.75" width="2.5" height="18" rx="1.25" fill="currentColor"/>
					</svg>
				</button>
			</div>
		</section>

		<!-- Timer -->
		<div class="timer-row">
			<span class="timer-label" class:timer-label--active={isPlaying}>{timerLabel}</span>
			<button class="btn-reset" onclick={resetTimer}>
				<svg width="10" height="11" viewBox="0 0 10 11" fill="none">
					<path d="M9 5.5C9 7.71 7.21 9.5 5 9.5C2.79 9.5 1 7.71 1 5.5C1 3.29 2.79 1.5 5 1.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
					<path d="M5 1.5L7 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
					<path d="M5 1.5L3 3.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
				</svg>
				Reset
			</button>
		</div>
	</div>

	<!-- Finish button -->
	<footer class="practice-footer">
		<button class="btn-finish" onclick={finish}>Finish Practice</button>
	</footer>
</div>

{#if showEndModal && exercise}
	<PracticeEndModal
		exerciseName={exercise.name}
		{bpm}
		{elapsed}
		onSave={handleSave}
		onDiscard={handleDiscard}
	/>
{/if}

<style>
	.page {
		min-height: 100dvh;
		display: flex;
		flex-direction: column;
		background: var(--color-bg-layout);
	}

	/* ── Header ──────────────────────────────────────────── */
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px;
		border-bottom: 1px solid var(--color-border-default);
		background: var(--color-bg-layout);
	}

	.icon-btn {
		width: 32px;
		height: 32px;
		border: none;
		background: none;
		border-radius: 9999px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-default);
		padding: 8px;
	}

	.header-center {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1px;
	}

	.header-sub {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-secondary);
		letter-spacing: 0.08em;
	}

	.header-title {
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
	}

	/* ── Body ────────────────────────────────────────────── */
	.page-body {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 24px;
		gap: 0;
		max-width: 448px;
		width: 100%;
		margin: 0 auto;
	}

	/* ── Smart suggestion ────────────────────────────────── */
	.suggestion-section {
		width: 100%;
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 32px;
	}

	.suggestion-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(255, 212, 0, 0.2);
		border: 1px solid rgba(255, 212, 0, 0.3);
		border-radius: 9999px;
		padding: 5px 13px;
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		color: var(--color-text-default);
		letter-spacing: -0.02em;
		align-self: flex-start;
	}

	.suggestion-card {
		background: var(--color-bg-component);
		border: 2px solid var(--color-brand-primary);
		border-radius: 12px;
		padding: 22px;
		box-shadow: 4px 4px 0 var(--color-brand-primary);
		display: flex;
		flex-direction: column;
		gap: 8px;
		width: 100%;
	}

	.suggestion-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.suggestion-title {
		font-size: var(--font-size-h3);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		margin: 0;
	}

	.suggestion-desc {
		font-size: 14px;
		color: var(--color-text-secondary);
		line-height: 1.6;
		margin: 0;
	}

	.btn-apply {
		width: 100%;
		background: var(--color-brand-primary);
		border: none;
		border-radius: 8px;
		padding: 12px;
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		cursor: pointer;
		font-family: inherit;
		margin-top: 4px;
	}

	/* ── Reference photo ─────────────────────────────────── */
	.photo-section {
		width: 100%;
		margin-bottom: 0;
	}

	.photo-frame {
		border: 1px dashed var(--color-brand-primary);
		border-radius: 12px;
		height: 128px;
		overflow: hidden;
	}

	.photo-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}

	/* ── Metronome ───────────────────────────────────────── */
	.metronome-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 33px 0 0;
		width: 100%;
	}

	.bpm-display {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: -8px;
		transition: transform 0.05s ease;
	}

	.bpm-display.bpm-pulse {
		transform: scale(1.03);
	}

	.bpm-number {
		font-size: 120px;
		font-weight: var(--font-weight-strong);
		color: var(--color-text-default);
		letter-spacing: -0.05em;
		line-height: 1;
		position: relative;
		z-index: 1;
		font-variant-numeric: tabular-nums;
	}

	.bpm-glow {
		position: absolute;
		inset: -16px;
		background: rgba(255, 212, 0, 0.1);
		border-radius: 9999px;
		filter: blur(20px);
		z-index: 0;
	}

	.bpm-label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-transform: uppercase;
		color: var(--color-text-tertiary);
		letter-spacing: 0.18em;
		margin: 0;
	}

	/* ── Controls ────────────────────────────────────────── */
	.controls {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 32px;
		margin-top: 48px;
	}

	.ctrl-btn {
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.ctrl-btn--sm {
		width: 56px;
		height: 56px;
		border-radius: 9999px;
		background: none;
		border: 2px solid var(--color-border-default);
		color: var(--color-text-default);
	}

	.ctrl-btn--play {
		width: 96px;
		height: 96px;
		border-radius: 9999px;
		background: var(--color-text-default);
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
	}

	/* ── Finish button ───────────────────────────────────── */
	.practice-footer {
		position: sticky;
		bottom: 0;
		padding: 16px 24px;
		background: var(--color-bg-layout);
		border-top: 1px solid var(--color-border-default);
	}

	.btn-finish {
		width: 100%;
		height: 56px;
		border-radius: 12px;
		border: none;
		background: var(--color-text-default);
		color: var(--color-bg-component);
		font-size: var(--font-size-md);
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-family: inherit;
		cursor: pointer;
	}

	/* ── Timer ───────────────────────────────────────────── */
	.timer-row {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 32px;
		padding-bottom: 16px;
	}

	.timer-label {
		font-size: 28px;
		font-weight: var(--font-weight-medium);
		color: var(--color-text-default);
		opacity: 0.4;
		font-variant-numeric: tabular-nums;
		transition: opacity 0.2s;
	}

	.timer-label--active {
		opacity: 1;
	}

	.btn-reset {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--color-bg-subtle);
		border: none;
		border-radius: 9999px;
		padding: 4px 12px;
		font-size: 10px;
		font-weight: var(--font-weight-strong);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--color-text-secondary);
		cursor: pointer;
		font-family: inherit;
	}
</style>
