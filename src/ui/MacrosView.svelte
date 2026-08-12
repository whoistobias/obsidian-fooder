<script lang="ts">
    import type { FooderSettings } from '../settings';
    import type { FoodNode } from '../types';
    import { getNodeKey, treeContainsNodeKey } from '../utils/node-macros';
    import NodeListItem from './components/NodeListItem.svelte';
    import ProgressBar from './components/ProgressBar.svelte';
    import {
        createMacroSelection,
        setMacroSelectionContext,
    } from './macro-selection.svelte';

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

    const macroSelection = createMacroSelection();
    setMacroSelectionContext(macroSelection);

    const emptyMessage = 'No foods found.';

    $effect(() => {
        const key = macroSelection.selectedNodeKey;
        if (key !== null && !treeContainsNodeKey(nodes, key)) {
            macroSelection.clearSelection();
        }
    });

    let summary: MacrosSummary = $derived.by(() => {
        const summed = {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            fiber: 0,
            itemsWithIssues: 0,
        };

        for (const node of nodes) {
            if (node.type === 'group') {
                summed.calories += node.totals.calories;
                summed.protein += node.totals.protein;
                summed.fat += node.totals.fat;
                summed.carbs += node.totals.carbs;
                summed.fiber += node.totals.fiber;
                summed.itemsWithIssues += node.totals.itemsWithIssues;
                if (node.issues?.length) {
                    summed.itemsWithIssues += 1;
                }
                continue;
            }

            summed.calories += node.item.calories;
            summed.protein += node.item.protein;
            summed.fat += node.item.fat;
            summed.carbs += node.item.carbs;
            summed.fiber += node.item.fiber;
            summed.itemsWithIssues += node.item.issues.length ? 1 : 0;
        }

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

<div class="flex flex-col gap-2-1">
    {#if nodes.length}
        <div class="flex flex-col gap-4">
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
                            {summary.itemsWithIssues === 1 ? 'item' : 'items'} with
                            issues
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
        </div>
        <hr />

        {#each nodes as node (getNodeKey(node))}
            <NodeListItem {node} {settings} />
        {/each}
    {:else}
        <p class="text-center text-faint text-ui-small py-6 px-4">
            {emptyMessage}
        </p>
    {/if}
</div>
