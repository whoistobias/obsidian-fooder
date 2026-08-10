import { getContext, setContext } from 'svelte';

const MACRO_SELECTION_KEY = Symbol('macro-selection');

export function createMacroSelection() {
	let selectedNodeKey = $state<string | null>(null);

	return {
		get selectedNodeKey() {
			return selectedNodeKey;
		},
		toggleNode(key: string) {
			selectedNodeKey = selectedNodeKey === key ? null : key;
		},
		isSelected(key: string) {
			return selectedNodeKey === key;
		},
		clearSelection() {
			selectedNodeKey = null;
		},
	};
}

export type MacroSelection = ReturnType<typeof createMacroSelection>;

export function setMacroSelectionContext(selection: MacroSelection) {
	setContext(MACRO_SELECTION_KEY, selection);
}

export function getMacroSelectionContext(): MacroSelection {
	return getContext(MACRO_SELECTION_KEY);
}
