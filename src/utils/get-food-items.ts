import { App, TFile } from 'obsidian';
import type { FoodNode } from '../types';
import { type FooderSettings } from '../settings';
import { buildFoodNodes, type NodeWithAncestors } from './build-food-nodes';
import {
    applyPortionGroups,
    recomputeStructuralGroupTotals,
} from './apply-portion-groups';
import { createFoodItem } from './create-food-item';
import { isRecipeFile } from './file-classification';
import { collectLinkAncestorLines } from './collect-link-ancestors';
import {
    isMacroRelevantFile,
    resolveRecipeIngredient,
    resolveRecipeReference,
} from './resolve-recipe';

export async function getFoodItems(
    app: App,
    source_file: TFile,
    settings: FooderSettings,
): Promise<FoodNode[]> {
    const cache = app.metadataCache.getFileCache(source_file);
    if (!cache) {
        return [];
    }

    const listItems = cache.listItems;
    const headings = cache.headings;
    const links = cache.links ?? [];
    const nodes: NodeWithAncestors[] = [];
    const sourceIsRecipe = isRecipeFile(
        app,
        source_file,
        cache,
        settings,
    );

    for (const link of links) {
        const file = app.metadataCache.getFirstLinkpathDest(
            link.link,
            source_file.path,
        );
        if (!file) {
            continue;
        }
        const destCache = app.metadataCache.getFileCache(file);
        if (!destCache) {
            continue;
        }
        if (!isMacroRelevantFile(app, file, destCache, settings)) {
            continue;
        }

        const ancestorLineNumbers = collectLinkAncestorLines(
            link.position,
            listItems,
            headings,
        );

        const sourcePosition = {
            line: link.position.start.line,
            col: link.position.start.col,
        };

        let node: FoodNode;
        if (isRecipeFile(app, file, destCache, settings)) {
            if (sourceIsRecipe) {
                node = await resolveRecipeIngredient(
                    app,
                    settings,
                    file,
                    link.displayText,
                    sourcePosition,
                    { visited: new Set(), depth: 0 },
                );
            } else {
                node = await resolveRecipeReference(
                    app,
                    settings,
                    file,
                    link.displayText,
                    sourcePosition,
                );
            }
        } else {
            node = {
                type: 'food',
                item: createFoodItem(
                    file,
                    destCache,
                    link.displayText,
                    settings,
                    link.position.start,
                ),
            };
        }

        nodes.push({
            ancestorLineNumbers,
            node,
        });
    }

    const sourceText = await app.vault.cachedRead(source_file);
    const tree = buildFoodNodes(nodes, sourceText, headings, listItems);
    applyPortionGroups(tree);
    recomputeStructuralGroupTotals(tree);
    return tree;
}

export { createFoodItem } from './create-food-item';
