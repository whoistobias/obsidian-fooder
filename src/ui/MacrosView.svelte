<script lang="ts">
	import type { FooderSettings } from '../settings';
	import type { FoodItem } from '../types';
	import ProgressBar from './ProgressBar.svelte';

	interface MacrosSummary {
		calories: number;
	}

	interface Props {
		items: FoodItem[];
		settings: FooderSettings;
	}

	let { items, settings }: Props = $props();

	const emptyMessage = 'Open a recipe note to see linked foods.';

	let summary: MacrosSummary = $derived.by(() => {
		return {
			calories: 2150,
		};
	});
	//
</script>

<div class="fooder__macros-view">
	{#if items.length}
		<div class="fooder__item">
			<div class="fooder__calories">
				<div class="fooder__calories-current">{summary.calories}</div>
				<div>&nbsp;/ {settings.dailyCalorieGoal}</div>
			</div>
			<ProgressBar
				value={summary.calories}
				max={settings.dailyCalorieGoal}
				color="#c3c2b7"
			/>
		</div>
		<div class="fooder__item">
			<div class="fooder__item-header">
				<div>protein</div>
				<div>100 / 150g</div>
			</div>
			<ProgressBar
				value={summary.calories}
				max={settings.dailyCalorieGoal}
				color="#0f6e56"
			/>
		</div>
		<div class="fooder__item">
			<div class="fooder__item-header">
				<div>carbs</div>
				<div>100 / 150g</div>
			</div>
			<ProgressBar
				value={summary.calories}
				max={settings.dailyCalorieGoal}
				color="#185fa5"
			/>
		</div>
		<div class="fooder__item">
			<div class="fooder__item-header">
				<div>fat</div>
				<div>100 / 150g</div>
			</div>
			<ProgressBar
				value={summary.calories}
				max={settings.dailyCalorieGoal}
				color="#854f0b"
			/>
		</div>
		<hr />
		<div class="fooder__section-header">Logged</div>
	{:else}
		<p class="fooder-view__empty">{emptyMessage}</p>
	{/if}
</div>

<style>
	.fooder__section-header {
		color: var(--text-muted);
		font-size: var(--font-ui-smaller);
	}
	.fooder__macros-view {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-3);
	}
	.fooder__calories {
		display: flex;
		align-items: baseline;

		.fooder__calories-current {
			font-size: var(--font-ui-large);
		}
		:last-child {
			color: var(--text-muted);
		}
	}
	.fooder__item-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		:first-child {
			color: var(--text-muted);
		}
		:last-child {
			color: var(--text-faint);
		}
	}
	.fooder__item {
		display: flex;
		flex-direction: column;
		gap: var(--size-4-1);
	}
</style>
