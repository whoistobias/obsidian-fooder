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

	let percent = $derived(max > 0 ? Math.min((value / max) * 100, 100) : 0);
</script>

<div class="fooder__progress-bar">
	<div
		class="fooder__progress-bar__fill"
		style="width: {percent}%; background-color: {color}"
	></div>
</div>

<style>
	.fooder__progress-bar {
		height: 4px;
		background-color: var(--background-modifier-border);
		border-radius: 2px;
		overflow: hidden;
	}

	.fooder__progress-bar__fill {
		height: 100%;
		border-radius: 2px;
		transition: width 0.2s ease;
	}
</style>
