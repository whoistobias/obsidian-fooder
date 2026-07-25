import type { HeadingCache, Pos } from 'obsidian';

export function getHeadingsForPosition(
	cache: HeadingCache[],
	position: Pos,
): HeadingCache[] {
	const headings = cache;
	if (!headings || headings.length === 0) return [];

	// 1. Collect all headings that appear before our position
	const relevant = headings.filter(
		(h) => h.position.start.line <= position.start.line,
	);

	// 2. Walk backward, keeping only headings that get shallower
	//    (i.e. build the chain from the nearest heading up to H1)
	const chain: HeadingCache[] = [];
	let minLevel = Infinity;

	for (let i = relevant.length - 1; i >= 0; i--) {
		const h = relevant[i]!;
		if (h.level < minLevel) {
			chain.push(h);
			minLevel = h.level;
		}
		if (minLevel === 1) break; // reached the top, no need to go further
	}

	return chain;
}
