import { App, TFile } from 'obsidian';
import type { FoodItem } from '../types';

export async function getFoodItems(app: App, file: TFile): Promise<FoodItem[]> {
	const cache = app.metadataCache.getFileCache(file);
	const links = cache?.links ?? [];
	return links.map((link) => ({ name: link.link }));
}
