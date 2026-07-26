<script lang="ts">
	import type { FooderSettings } from '../settings';
	import type { FoodNode } from '../types';
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
		nodes: FoodNode[];
		settings: FooderSettings;
	}

	let { nodes, settings }: Props = $props();

	const emptyMessage = 'Open a recipe note to see linked foods.';

	let summary: MacrosSummary = $derived.by(() => {
		const summed = {
			calories: 0,
			protein: 0,
			fat: 0,
			carbs: 0,
			fiber: 0,
			itemsWithIssues: 0,
		};

		const walk = (foodNodes: FoodNode[]) => {
			for (const node of foodNodes) {
				if (node.type === 'group') {
					walk(node.children);
					continue;
				}
				summed.calories += node.item.calories;
				summed.protein += node.item.protein;
				summed.fat += node.item.fat;
				summed.carbs += node.item.carbs;
				summed.fiber += node.item.fiber;
				summed.itemsWithIssues += node.item.issues.length ? 1 : 0;
			}
		};
		walk(nodes);

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

<div class="flex flex-col gap-3">
	{#if nodes.length}
		<div class="flex flex-col gap-1">
			<div class="flex items-baseline">
				<div class="text-ui-large">
					{summary.calories}
				</div>
				<div class="text-muted">
					&nbsp;/ {settings.dailyCalorieTarget} kcal
				</div>
			</div>
			{#if summary.itemsWithIssues > 0}
				<div
					class="flex justify-between items-baseline last:text-faint last:text-ui-smaller"
				>
					<div class="text-error!">
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
		<div class="flex flex-col gap-1">
			<div class="flex justify-between items-baseline">
				<div class="text-muted">protein</div>
				<div class="text-faint">
					{summary.protein} / {settings.dailyProteinTarget}
				</div>
			</div>
			<ProgressBar
				value={summary.protein}
				max={settings.dailyProteinTarget}
				color="#0f6e56"
			/>
		</div>
		<div class="flex flex-col gap-1">
			<div class="flex justify-between items-baseline">
				<div class="text-muted">carbs</div>
				<div class="text-faint">
					{summary.carbs} / {settings.dailyCarbsTarget}
				</div>
			</div>
			<ProgressBar
				value={summary.carbs}
				max={settings.dailyCarbsTarget}
				color="#185fa5"
			/>
		</div>
		<div class="flex flex-col gap-1">
			<div class="flex justify-between items-baseline">
				<div class="text-muted">fat</div>
				<div class="text-faint">
					{summary.fat} / {settings.dailyFatTarget}
				</div>
			</div>
			<ProgressBar
				value={summary.fat}
				max={settings.dailyFatTarget}
				color="#854f0b"
			/>
		</div>
		<hr />
		<div class="text-muted text-ui-smaller">Logged</div>
		{#snippet renderNodes(foodNodes: FoodNode[], depth: number)}
			{#each foodNodes as node, i (i + (node.type === 'food' ? node.item.name : node.label))}
				{#if node.type === 'group'}
					<div
						class="flex justify-between items-baseline text-muted text-ui-smaller group"
						style:padding-left="{depth * 0.75}rem"
					>
						<div>{node.label}</div>
						<div
							class="text-ui-smaller opacity-0 transition-opacity group-hover:opacity-1"
						>
							{node.totals.calories} kcal
						</div>
					</div>
					{@render renderNodes(node.children, depth + 1)}
				{:else}
					<div
						class="flex justify-between items-baseline"
						style:padding-left="{depth * 0.75}rem"
					>
						<div class="text-ui-smaller">
							{node.item.name}
							<span>{node.item.weight_grams}g</span>
						</div>
						<div class="text-ui-smaller text-faint">
							{node.item.calories} kcal
						</div>
					</div>
					{#each node.item.issues as issue, issueIndex (issueIndex)}
						<div
							class="flex justify-between items-baseline last:text-faint last:text-ui-smaller"
							style:padding-left="{(depth + 1) * 0.75}rem"
						>
							<div class="fooder__error-text">{issue}</div>
						</div>
					{/each}
				{/if}
			{/each}
		{/snippet}
		{@render renderNodes(nodes, 0)}
	{:else}
		<p class="fooder-view__empty">{emptyMessage}</p>
	{/if}
</div>

<style>
	.flex {
		display: flex;
	}
	.flex-col {
		flex-direction: column;
	}

	.gap-3 {
		gap: var(--size-4-3);
	}
	.gap-1 {
		gap: var(--size-4-1);
	}
	.justify-between {
		justify-content: space-between;
	}
	.items-baseline {
		align-items: baseline;
	}
	.text-faint,
	.last\:text-faint:last-child {
		color: var(--text-faint);
	}
	.text-ui-large {
		font-size: var(--font-ui-smaller);
	}
	.text-muted {
		color: var(--text-muted);
	}
	.text-error\! {
		color: var(--text-error) !important;
	}
	.text-ui-smaller,
	.last\:text-ui-smaller:last-child {
		font-size: var(--font-ui-smaller);
	}
	.opacity-0 {
		opacity: 0;
	}
	.transition-opacity {
		transition: opacity 0.12s ease;
	}
	.group:hover .group-hover\:opacity-1 {
		opacity: 1;
	}
</style>
