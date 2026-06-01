<script lang="ts">
	import { ChevronLeft } from 'lucide-svelte';

	interface Props {
		title: string;
		onBack: () => void;
	}

	let { title, onBack }: Props = $props();
</script>

<header class="page-header">
	<button class="back-btn" onclick={onBack} aria-label="Go back">
		<ChevronLeft size={20} />
	</button>
	<h1 class="page-title">{title}</h1>
</header>

<style>
	.page-header {
		display: flex;
		align-items: center;
		padding: 16px 16px 9px;
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
		padding-right: 48px; /* optical centering vs back button */
	}
</style>
