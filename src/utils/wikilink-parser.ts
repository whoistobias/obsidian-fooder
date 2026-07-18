const WIKILINK_REGEX = /\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g;

export function extractWikilinks(content: string): string[] {
	const links: string[] = [];
	let match: RegExpExecArray | null;

	while ((match = WIKILINK_REGEX.exec(content)) !== null) {
		const link = match[1]?.trim();
		if (link) {
			links.push(link);
		}
	}

	return links;
}
