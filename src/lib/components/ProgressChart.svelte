<script lang="ts">
	import type { Practice } from '$db/index';

	interface Props {
		practices: Practice[];
		targetBpm: number;
	}

	let { practices, targetBpm }: Props = $props();

	const W = 300;
	const H = 100;
	const PAD = { top: 20, right: 8, bottom: 8, left: 8 };
	const CW = W - PAD.left - PAD.right;
	const CH = H - PAD.top - PAD.bottom;

	const sorted = $derived(
		[...practices].sort((a, b) => a.date.localeCompare(b.date))
	);

	const allBpm = $derived(sorted.map((p) => p.bpm));
	const minBpm = $derived(Math.max(0, Math.min(...allBpm, targetBpm) - 10));
	const maxBpm = $derived(Math.max(...allBpm, targetBpm) + 10);

	function xPos(i: number): number {
		const n = sorted.length;
		if (n <= 1) return CW / 2;
		return (i / (n - 1)) * CW;
	}

	function yPos(bpm: number): number {
		return CH - ((bpm - minBpm) / (maxBpm - minBpm)) * CH;
	}

	function smoothPath(pts: [number, number][]): string {
		if (pts.length === 0) return '';
		if (pts.length === 1) return `M ${pts[0][0]},${pts[0][1]}`;
		let d = `M ${pts[0][0]},${pts[0][1]}`;
		for (let i = 1; i < pts.length; i++) {
			const [x0, y0] = pts[i - 1];
			const [x1, y1] = pts[i];
			const cpx = (x0 + x1) / 2;
			d += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
		}
		return d;
	}

	const points = $derived(sorted.map((p, i): [number, number] => [xPos(i), yPos(p.bpm)]));

	const linePath = $derived(smoothPath(points));

	const areaPath = $derived.by(() => {
		if (points.length === 0) return '';
		const n = points.length;
		return `${smoothPath(points)} L ${points[n - 1][0]},${CH} L ${points[0][0]},${CH} Z`;
	});

	const targetY = $derived(yPos(targetBpm));

	const lastPoint = $derived(points[points.length - 1]);
</script>

<div class="chart-wrapper">
	<svg viewBox="0 0 {W} {H}" class="chart" aria-label="Progress chart">
		<defs>
			<linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
				<stop offset="0%" stop-color="#ffd400" stop-opacity="0.25" />
				<stop offset="100%" stop-color="#ffd400" stop-opacity="0" />
			</linearGradient>
		</defs>

		<g transform="translate({PAD.left},{PAD.top})">
			<!-- Target dashed line -->
			<line
				x1="0"
				y1={targetY}
				x2={CW}
				y2={targetY}
				stroke="#94a3b8"
				stroke-width="1"
				stroke-dasharray="4 3"
			/>
			<text
				x={CW}
				y={targetY - 4}
				font-size="7"
				fill="#94a3b8"
				text-anchor="end"
				font-family="Space Grotesk, sans-serif"
				font-weight="700"
			>TARGET: {targetBpm} BPM</text>

			{#if points.length > 0}
				<!-- Area fill -->
				<path d={areaPath} fill="url(#area-grad)" />
				<!-- Line -->
				<path
					d={linePath}
					fill="none"
					stroke="#ffd400"
					stroke-width="2"
					stroke-linejoin="round"
					stroke-linecap="round"
				/>
				<!-- Last point dot -->
				{#if lastPoint}
					<circle cx={lastPoint[0]} cy={lastPoint[1]} r="4" fill="#ffd400" />
				{/if}
			{:else}
				<text
					x={CW / 2}
					y={CH / 2}
					font-size="9"
					fill="#94a3b8"
					text-anchor="middle"
					font-family="Space Grotesk, sans-serif"
				>No practice data yet</text>
			{/if}
		</g>
	</svg>
</div>

<style>
	.chart-wrapper {
		width: 100%;
	}

	.chart {
		width: 100%;
		height: auto;
		display: block;
		overflow: visible;
	}
</style>
