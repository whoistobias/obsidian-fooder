import { App, TFile } from 'obsidian';
import type { FoodItem } from '../types';
import { extractWikilinks } from './wikilink-parser';

export async function getFoodItems(app: App, file: TFile): Promise<FoodItem[]> {
	const cache = app.metadataCache.getFileCache(file);
	const cacheLinks = cache?.links ?? [];

	if (cacheLinks.length > 0) {
		return cacheLinks.map((link) => ({ name: link.link }));
	}

	const content = await app.vault.cachedRead(file);
	return extractWikilinks(content).map((name) => ({ name }));
}
