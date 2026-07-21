import { getAllTags, type CachedMetadata } from 'obsidian';

export function fileHasTag(file_cache: CachedMetadata, tag: string): boolean {
	const tags = getAllTags(file_cache);
	if (!tags) {
		return false;
	}
	return tags.some((v) => v === tag);
}
