<script lang="ts">
    import { slide } from 'svelte/transition';
    import type { FooderSettings } from '../../settings';
    import type { FoodNode } from '../../types';
    import {
        foodNodeToSummary,
        getNodeKey,
        getNodeLabel,
    } from '../../utils/node-macros';
    import { formatKcal } from '../../utils/format-kcal';
    import { getMacroSelectionContext } from '../macro-selection.svelte';
    import { icon } from '../attachments/icon';
    import ListItem from './ListItem.svelte';
    import NodeMacroPanel from './NodeMacroPanel.svelte';
    import Self from './NodeListItem.svelte';

    interface Props {
        node: FoodNode;
        settings: FooderSettings;
        depth?: number;
    }

    let { node, settings, depth = 0 }: Props = $props();

    const indentStep = '16px + 0.666px';
    const macroSelection = getMacroSelectionContext();
    const nodeKey = $derived(getNodeKey(node));
    const nodeSummary = $derived(foodNodeToSummary(node));
    const nodeLabel = $derived(getNodeLabel(node));
    const macrosOpen = $derived(macroSelection.isSelected(nodeKey));

    const startsCollapsed = () =>
        node.type === 'group' && node.recipeFile !== undefined;
    let expanded = $state(!startsCollapsed);

    function maxRenderDepth(
        group: Extract<FoodNode, { type: 'group' }>,
        groupDepth: number,
    ): number {
        let max = groupDepth;

        for (const child of group.children) {
            const childDepth = groupDepth + 1;
            max = Math.max(
                max,
                child.type === 'group'
                    ? maxRenderDepth(child, childDepth)
                    : childDepth,
            );
        }

        return max;
    }

    function toggleExpanded(event: MouseEvent) {
        event.stopPropagation();
        expanded = !expanded;
    }

    function toggleMacroPanel() {
        macroSelection.toggleNode(nodeKey);
    }
</script>

{#if node.type === 'group'}
    {@const bleedDepth = maxRenderDepth(node, depth)}
    <div>
        <ListItem
            {depth}
            active={macrosOpen}
            detailsOpen={macrosOpen}
            onclick={toggleMacroPanel}
        >
            <div
                class="flex items-center justify-center -ml-5 size-4 [&_svg]:size-3.75 self-center text-nav-collapse-icon [&_svg]:stroke-[2.5] transition-transform duration-200"
                class:-rotate-90={!expanded}
                onclick={toggleExpanded}
                onkeydown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        event.stopPropagation();
                        expanded = !expanded;
                    }
                }}
                role="button"
                tabindex="0"
                aria-expanded={expanded}
                aria-label="Toggle {node.label}"
                {@attach icon('chevron-down')}
            ></div>
            <div>{node.label}&nbsp;</div>
            {#if node.recipeFile}
                <span class="text-ui-smaller text-faint"
                    >{node.totals.weight_grams}g</span
                >
            {/if}
            <div class="flex-1"></div>
            <div
                class="text-ui-smaller text-faint group-hover:text-normal group-hover:opacity-100"
                class:opacity-0={expanded}
                class:opacity-100={!expanded}
            >
                {formatKcal(node.totals.calories)} kcal
            </div>
            {#snippet details()}
                <NodeMacroPanel
                    summary={nodeSummary}
                    label={nodeLabel}
                    {settings}
                />
            {/snippet}
        </ListItem>
        {#if node.issues}
            {#each node.issues as issue, issueIndex (issueIndex)}
                <div
                    class="flex justify-between items-baseline text-ui-smaller pl-6"
                >
                    <div class="text-error!">{issue}</div>
                </div>
            {/each}
        {/if}
        {#if expanded}
            <div
                transition:slide={{ duration: 200 }}
                style:padding-left="calc({bleedDepth} * ({indentStep}))"
                style:margin-left="calc(-{bleedDepth} * ({indentStep}))"
            >
                <div
                    class="border-l-[0.666px] border-indentation-guide pl-1 ml-3 flex flex-col gap-2-1 mt-2-1"
                >
                    {#each node.children as child (getNodeKey(child))}
                        <Self node={child} {settings} depth={depth + 1} />
                    {/each}
                </div>
            </div>
        {/if}
    </div>
{:else}
    <div>
        <ListItem
            {depth}
            active={macrosOpen}
            detailsOpen={macrosOpen}
            onclick={toggleMacroPanel}
        >
            <div>
                {node.item.name}&nbsp;<span class="text-ui-smaller text-faint"
                    >{node.item.weight_grams}g</span
                >
            </div>
            <div class="text-ui-smaller text-faint group-hover:text-normal">
                {formatKcal(node.item.calories)} kcal
            </div>
            {#snippet details()}
                <NodeMacroPanel
                    summary={nodeSummary}
                    label={nodeLabel}
                    {settings}
                />
            {/snippet}
        </ListItem>
        {#each node.item.issues as issue, issueIndex (issueIndex)}
            <div
                class="flex justify-between items-baseline text-ui-smaller pl-6"
            >
                <div class="text-error!">{issue}</div>
            </div>
        {/each}
    </div>
{/if}
