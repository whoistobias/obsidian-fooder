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

<div class="flex h-1 bg-background-modifier-border rounded-xs overflow-hidden">
	<div
		class="rounded-xs shrink"
		style="width: {percent}%; background-color: {color};"
	></div>
	<div class="rounded-xs bg-[#b13132]" style="width: {overflow}%"></div>
</div>
