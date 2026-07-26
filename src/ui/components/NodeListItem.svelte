<script lang="ts">
	import type { FoodNode } from '../../types';
	import { icon } from '../attachments/icon';
	import ListItem from './ListItem.svelte';
	import Self from './NodeListItem.svelte';

	interface Props {
		node: FoodNode;
		depth?: number;
	}

	let { node, depth = 0 }: Props = $props();

	function nodeKey(child: FoodNode): string {
		return child.type === 'food' ? child.item.name : child.label;
	}
</script>

{#if node.type === 'group'}
	<div>
		<ListItem {depth}>
			<div
				class="-ml-5 size-4 self-center text-nav-collapse-icon stroke-2"
				{@attach icon('chevron-down')}
			></div>
			<div class="">{node.label}</div>
			<div class="flex-1"></div>
			<div class="text-ui-smaller opacity-0 group-hover:opacity-100">
				{node.totals.calories} kcal
			</div>
		</ListItem>
		<div
			class="border-l border-indentation-guide ml-[12px]"
			style:margin-left="calc({depth + 1} *12px)"
		>
			{#each node.children as child, i (i + nodeKey(child))}
				<Self node={child} depth={depth + 1} />
			{/each}
		</div>
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
