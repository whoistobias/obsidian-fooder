import { setIcon, type IconName } from 'obsidian';
import type { Attachment } from 'svelte/attachments';

/**
 * Renders an Obsidian icon on an element via {@link setIcon}.
 *
 * @example
 * ```svelte
 * <span {@attach icon('chevron-right')}></span>
 * <span {@attach icon(collapsed ? 'chevron-right' : 'chevron-down')}></span>
 * ```
 */
export function icon(iconId: IconName): Attachment {
	return (element) => {
		setIcon(element as HTMLElement, iconId);

		return () => {
			(element as HTMLElement).empty();
		};
	};
}
