import type { ListItemCache, Pos } from 'obsidian';

export function getListAncestorsForPostition(
	cache: ListItemCache[],
	position: Pos,
): ListItemCache[] {
	const listItems = cache;
	if (listItems.length === 0) return [];

	// 1. Collect all list items that appear before our position
	const relevant = listItems.filter(
		(h) => h.position.start.line <= position.start.line,
	);

	// 2. Walk backward, keeping only list items that get shallower
	const chain: ListItemCache[] = [];

	let currentParentLine = position.start.line;

	const self = relevant.at(-1);
	if (self?.position.start.line !== currentParentLine) {
		return chain;
	} else {
		currentParentLine = self.parent;
	}

	for (let i = relevant.length - 2; i >= 0; i--) {
		const h = relevant[i]!;
		if (h.position.start.line === currentParentLine) {
			chain.push(h);
			currentParentLine = h.parent;
		}
		if (currentParentLine < 0) break; // Reached the root level
	}

	return chain;
}
