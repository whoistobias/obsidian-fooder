<script lang="ts">
	import type { FooderSettings } from '../../settings';
	import type { NodeMacroSummary } from '../../types';
	import ProgressBar from './ProgressBar.svelte';

	interface Props {
		summary: NodeMacroSummary;
		label: string;
		settings: FooderSettings;
	}

	let { summary, label, settings }: Props = $props();

	const macroRows = $derived([
		{
			label: 'kcal',
			value: summary.calories,
			max: settings.dailyCalorieTarget,
			color: '#c3c2b7',
		},
		{
			label: 'protein',
			value: summary.protein,
			max: settings.dailyProteinTarget,
			color: '#0f6e56',
		},
		{
			label: 'carbs',
			value: summary.carbs,
			max: settings.dailyCarbsTarget,
			color: '#185fa5',
		},
		{
			label: 'fat',
			value: summary.fat,
			max: settings.dailyFatTarget,
			color: '#854f0b',
		},
	]);
</script>

<section
	class="flex flex-col gap-2 text-ui-smaller"
	aria-label="Macro breakdown for {label}"
>
	{#if summary.itemsWithIssues > 0}
		<div class="flex justify-between items-baseline">
			<div class="text-error!">
				{summary.itemsWithIssues}
				{summary.itemsWithIssues === 1 ? 'item' : 'items'} with issues
			</div>
		</div>
	{/if}
	{#each macroRows as row (row.label)}
		<div class="flex flex-col gap-1">
			<div class="flex justify-between items-baseline">
				<div class="text-muted">{row.label}</div>
				<div class="text-faint">{row.value} / {row.max}</div>
			</div>
			<ProgressBar value={row.value} max={row.max} color={row.color} />
		</div>
	{/each}
</section>
