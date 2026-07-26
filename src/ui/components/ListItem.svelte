<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: ClassValue;
		depth?: number;
		children?: Snippet;
	};

	let {
		class: className = '',
		depth = 0,
		children,
		...restProps
	}: Props = $props();
</script>

<div
	class={[
		'flex flex-col hover:text-normal hover:bg-background-modifier-hover rounded-(--radius-s)',
		className,
	]}
	style:padding-left="calc({depth} * (16px + 0.666px))"
	style:margin-left="calc(-{depth} * (16px + 0.666px))"
	{...restProps}
>
	<div
		class="flex group gap-2-1 justify-between text-muted text-ui-small items-baseline p-(--nav-item-padding)"
	>
		{@render children?.()}
	</div>
</div>
