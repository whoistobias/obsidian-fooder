<script lang="ts">
	import { slide } from 'svelte/transition';
	import type { FoodNode } from '../../types';
	import { icon } from '../attachments/icon';
	import ListItem from './ListItem.svelte';
	import Self from './NodeListItem.svelte';

	interface Props {
		node: FoodNode;
		depth?: number;
	}

	let { node, depth = 0 }: Props = $props();

	const indentStep = '16px + 0.666px';

	let expanded = $state(true);

	function nodeKey(child: FoodNode): string {
		return child.type === 'food' ? child.item.name : child.label;
	}

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

	function toggleExpanded() {
		expanded = !expanded;
	}
</script>

{#if node.type === 'group'}
	{@const bleedDepth = maxRenderDepth(node, depth) - depth}
	<div>
		<ListItem {depth} onclick={toggleExpanded}>
			<div
				class="flex items-center justify-center -ml-5 size-4 [&_svg]:size-3.75 self-center text-nav-collapse-icon [&_svg]:stroke-[2.5] transition-transform duration-200"
				class:-rotate-90={!expanded}
				{@attach icon('chevron-down')}
			></div>
			<div class="">{node.label}</div>
			<div class="flex-1"></div>
			<div
				class="text-ui-smaller text-faint group-hover:text-normal group-hover:opacity-100"
				class:opacity-0={expanded}
				class:opacity-100={!expanded}
			>
				{node.totals.calories} kcal
			</div>
		</ListItem>
		{#if expanded}
			<div
				transition:slide={{ duration: 200 }}
				style:padding-left="calc({bleedDepth} * ({indentStep}))"
				style:margin-left="calc(-{bleedDepth} * ({indentStep}))"
			>
				<div
					class="border-l-[0.666px] border-indentation-guide pl-1 ml-3"
				>
					{#each node.children as child, i (i + nodeKey(child))}
						<Self node={child} depth={depth + 1} />
					{/each}
				</div>
			</div>
		{/if}
	</div>
{:else}
	<ListItem {depth}>
		<div>
			{node.item.name}
			<span class="text-ui-smaller text-faint"
				>{node.item.weight_grams}g</span
			>
		</div>
		<div class="text-ui-smaller text-faint group-hover:text-normal">
			{node.item.calories} kcal
		</div>
	</ListItem>
	{#each node.item.issues as issue, issueIndex (issueIndex)}
		<div
			class="flex justify-between items-baseline last:text-faint last:text-ui-smaller"
			style:padding-left="{(depth + 1) * 0.75}rem"
		>
			<div class="text-error!">{issue}</div>
		</div>
	{/each}
{/if}
