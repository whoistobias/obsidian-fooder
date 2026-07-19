<script lang="ts">
	interface Props {
		value?: number;
		max?: number;
		color?: string;
	}

	let {
		value = 0,
		max = 100,
		color = 'var(--interactive-accent)',
	}: Props = $props();

	const percent = $derived(max > 0 ? Math.min((value / max) * 100, 100) : 0);
	const overflow = $derived(
		(value / max) * 100 > 100 ? (value / max) * 100 - 100 : 0,
	);
</script>

<div class="fooder__progress-bar">
	<div
		class="fooder__progress-bar__fill fooder__progress-bar__fill-main"
		style="width: {percent}%; background-color: {color};"
	></div>
	<div
		class="fooder__progress-bar__fill fooder__progress-bar__fill-overflow"
		style="width: {overflow}%"
	></div>
</div>

<style>
	.fooder__progress-bar {
		height: 4px;
		background-color: var(--background-modifier-border);
		border-radius: 2px;
		overflow: hidden;
		display: flex;
	}

	.fooder__progress-bar__fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.2s ease;
	}
	.fooder__progress-bar__fill-main {
		flex-shrink: 1;
	}
	.fooder__progress-bar__fill-overflow {
		background-color: #b13132;
	}
</style>
