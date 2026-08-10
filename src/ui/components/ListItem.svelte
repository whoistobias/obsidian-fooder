<script lang="ts">
    import type { Snippet } from 'svelte';
    import { slide } from 'svelte/transition';
    import type { ClassValue, HTMLAttributes } from 'svelte/elements';

    type Props = HTMLAttributes<HTMLDivElement> & {
        class?: ClassValue;
        depth?: number;
        active?: boolean;
        detailsOpen?: boolean;
        children?: Snippet;
        details?: Snippet;
    };

    let {
        class: className = '',
        depth = 0,
        active = false,
        detailsOpen = false,
        children,
        details,
        ...restProps
    }: Props = $props();
</script>

<div
    class={[
        'flex flex-col hover:text-normal hover:bg-background-modifier-hover rounded-(--radius-s)',
        active && 'text-normal bg-background-modifier-hover',
        className,
    ]}
    style:padding-left="calc({depth} * (16px + 0.666px))"
    style:margin-left="calc(-{depth} * (16px + 0.666px))"
    {...restProps}
>
    <div
        class={[
            'flex flex-col p-(--nav-item-padding)',
            detailsOpen && 'gap-2-1',
        ]}
    >
        <div
            class="flex group gap-2-1 justify-between text-muted text-ui-small items-baseline"
        >
            {@render children?.()}
        </div>
        {#if detailsOpen && details}
            <div transition:slide={{ duration: 200 }}>
                {@render details()}
            </div>
        {/if}
    </div>
</div>
