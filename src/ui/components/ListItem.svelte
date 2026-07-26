<script lang="ts">
	import type { ClassValue, HTMLAttributes } from 'svelte/elements';

	type Props = HTMLAttributes<HTMLDivElement> & {
		class?: ClassValue;
		depth?: number;
	};

	let { class: className = '', depth = 0 }: Props = $props();
</script>

<div
	class={[
		'flex flex-col hover:text-normal hover:bg-background-modifier-hover rounded-(--radius-s)',
		className,
	]}
	style:padding-left="calc({depth} * 12px)"
	style:margin-left="calc(-{depth} * (12px + 1px))"
>
	<div
		class="flex group gap-2-1 justify-between text-muted text-ui-small items-baseline p-(--nav-item-padding)"
	>
		<slot />
	</div>
</div>
