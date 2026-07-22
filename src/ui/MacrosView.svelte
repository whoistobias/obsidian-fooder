<script lang="ts">
	import type { FooderSettings } from '../settings';
	import type { FoodItem } from '../types';
	import ProgressBar from './ProgressBar.svelte';

	interface MacrosSummary {
		calories: number;
		protein: number;
		fat: number;
		carbs: number;
		fiber: number;
		itemsWithIssues: number;
	}

	interface Props {
		items: FoodItem[];
		settings: FooderSettings;
	}

	let { items, settings }: Props = $props();

	const emptyMessage = 'Open a recipe note to see linked foods.';

	let summary: MacrosSummary = $derived.by(() => {
		const summed = items.reduce(
			(acc, item) => {
				acc.calories += item.calories;
				acc.protein += item.protein;
				acc.fat += item.fat;
				acc.carbs += item.carbs;
				acc.fiber += item.fiber;
				acc.itemsWithIssues += item.issues.length ? 1 : 0;
				return acc;
			},
			{
				calories: 0,
				protein: 0,
				fat: 0,
				carbs: 0,
				fiber: 0,
				itemsWithIssues: 0,
			},
		);
		return {
			calories: Number(summed.calories.toFixed(1)),
			protein: Number(summed.protein.toFixed(1)),
			fat: Number(summed.fat.toFixed(1)),
			carbs: Number(summed.carbs.toFixed(1)),
			fiber: Number(summed.fiber.toFixed(1)),
			itemsWithIssues: summed.itemsWithIssues,
		};
	});
</script>

<div class="fooder__macros-view">
	{#if items.length}
		<div class="fooder__item">
			<div class="fooder__calories">
				<div class="fooder__calories-current">{summary.calories}</div>
				<div>&nbsp;/ {settings.dailyCalorieTarget} kcal</div>
			</div>
			{#if summary.itemsWithIssues > 0}
				<div class="fooder__line-item">
					<div class="fooder__error-text">
						{summary.itemsWithIssues}
						{summary.itemsWithIssues === 1 ? 'item' : 'items'} with issues
					</div>
				</div>
			{/if}
			<ProgressBar
				value={summary.calories}
				max={settings.dailyCalorieTarget}
				color="#c3c2b7"
			/>
		</div>
		<div class="fooder__item">
			<div class="fooder__item-header">
				<div>protein</div>
				<div>{summary.protein} / {settings.dailyProteinTarget}</div>
			</div>
			<ProgressBar
				value={summary.protein}
				max={settings.dailyProteinTarget}
				color="#0f6e56"
			/>
		</div>
		<div class="fooder__item">
			<div class="fooder__item-header">
				<div>carbs</div>
				<div>{summary.carbs} / {settings.dailyCarbsTarget}</div>
			</div>
			<ProgressBar
				value={summary.carbs}
				max={settings.dailyCarbsTarget}
				color="#185fa5"
			/>
		</div>
		<div class="fooder__item">
			<div class="fooder__item-header">
				<div>fat</div>
				<div>{summary.fat} / {settings.dailyFatTarget}</div>
			</div>
			<ProgressBar
				value={summary.fat}
				max={settings.dailyFatTarget}
				color="#854f0b"
			/>
		</div>
		<hr />
		<div class="fooder__section-header">Logged</div>
		{#each items as item, i (i + item.name)}
			<div class="fooder__line-item">
				<div>{item.name} <span>{item.weight_grams}g</span></div>
				<div>{item.calories} kcal</div>
			</div>
			{#each item.issues as issue, i (i)}
				<div class="fooder__line-item">
					<div class="fooder__error-text">{issue}</div>
				</div>
			{/each}
		{/each}
	{:else}
		<p class="fooder-view__empty">{emptyMessage}</p>
	{/if}
</div>

<style>
	.fooder__line-item {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		:last-child {
			color: var(--text-faint);
			font-size: var(--font-ui-smaller);
		}
	}
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
	.fooder__error-text {
		color: var(--text-error) !important;
	}
</style>
