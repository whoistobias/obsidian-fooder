import { App, getAllTags, TFile } from 'obsidian';

const RECIPE_TAG = '#recipe';

export function fileHasRecipeTag(app: App, file: TFile): boolean {
	const cache = app.metadataCache.getFileCache(file);
	if (!cache) {
		return false;
	}
	const tags = getAllTags(cache);
	if (!tags) {
		return false;
	}
	return tags.some((tag) => tag === RECIPE_TAG);
}
