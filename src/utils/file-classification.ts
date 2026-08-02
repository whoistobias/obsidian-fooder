import { App, type CachedMetadata, type TFile } from 'obsidian';
import type { FooderSettings } from '../settings';
import { fileHasAnyTag } from './tags';

function isDescendantOf(file: TFile, folderPath: string): boolean {
    let parent = file.parent;
    while (parent) {
        if (parent.path === folderPath) {
            return true;
        }
        parent = parent.parent;
    }
    return false;
}

export function fileIsInFolder(
    app: App,
    file: TFile,
    folderPath: string,
): boolean {
    const folder = app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
        return false;
    }

    return isDescendantOf(file, folder.path);
}

export function fileMatchesTagsOrFolders(
    app: App,
    file: TFile,
    cache: CachedMetadata,
    tags: string[],
    folders: string[],
): boolean {
    if (fileHasAnyTag(cache, tags)) {
        return true;
    }

    return folders.some((folderPath) => fileIsInFolder(app, file, folderPath));
}

export function isNutritionFile(
    app: App,
    file: TFile,
    cache: CachedMetadata,
    settings: FooderSettings,
): boolean {
    return fileMatchesTagsOrFolders(
        app,
        file,
        cache,
        settings.nutritionTags,
        settings.nutritionFolders,
    );
}

export function isFoodFile(
    app: App,
    file: TFile,
    cache: CachedMetadata,
    settings: FooderSettings,
): boolean {
    return fileMatchesTagsOrFolders(
        app,
        file,
        cache,
        settings.foodTags,
        settings.foodFolders,
    );
}

export function isRecipeFile(
    app: App,
    file: TFile,
    cache: CachedMetadata,
    settings: FooderSettings,
): boolean {
    return fileMatchesTagsOrFolders(
        app,
        file,
        cache,
        settings.recipeTags,
        settings.recipeFolders,
    );
}

export function isMacroViewFile(
    app: App,
    file: TFile,
    cache: CachedMetadata,
    settings: FooderSettings,
): boolean {
    return (
        isNutritionFile(app, file, cache, settings) ||
        isRecipeFile(app, file, cache, settings)
    );
}
