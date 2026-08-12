import {
    App,
    TFile,
    type CachedMetadata,
    type FrontMatterCache,
} from 'obsidian';
import type { FooderSettings } from '../settings';
import type {
    FoodItem,
    FoodNode,
    GroupNode,
    Quantity,
    SourcePosition,
} from '../types';
import {
    buildFoodNodes,
    sumNodeTotals,
    type NodeWithAncestors,
} from './build-food-nodes';
import { collectLinkAncestorLines } from './collect-link-ancestors';
import { isFoodFile, isRecipeFile } from './file-classification';
import { createFoodItem } from './create-food-item';
import { parseQuantity } from './parse-quantity';
import { parseUnit, UNITS, type UnitOfMeasure } from './units';

const MAX_RECIPE_DEPTH = 15;

interface PortionInfo {
    yieldGrams: number | null;
    servingSizeGrams: number | null;
    issues: string[];
}

interface ResolveContext {
    visited: Set<string>;
    depth: number;
}

export async function resolveRecipeReference(
    app: App,
    settings: FooderSettings,
    recipeFile: TFile,
    displayText: string | undefined,
    sourcePosition: SourcePosition,
): Promise<GroupNode> {
    const ctx: ResolveContext = { visited: new Set(), depth: 0 };
    const batch = await resolveRecipeBatch(app, settings, recipeFile, ctx);
    const frontmatter =
        app.metadataCache.getFileCache(recipeFile)?.frontmatter ?? {};

    return finalizeRecipeNode(
        batch,
        displayText,
        settings,
        frontmatter,
        sourcePosition,
    );
}

export async function resolveRecipeIngredient(
    app: App,
    settings: FooderSettings,
    recipeFile: TFile,
    displayText: string | undefined,
    sourcePosition: SourcePosition,
    ctx: ResolveContext,
): Promise<FoodNode> {
    const batch = await resolveRecipeBatch(app, settings, recipeFile, ctx);
    const frontmatter =
        app.metadataCache.getFileCache(recipeFile)?.frontmatter ?? {};

    return finalizeRecipeNode(
        batch,
        displayText,
        settings,
        frontmatter,
        sourcePosition,
    );
}

function finalizeRecipeNode(
    batch: GroupNode,
    displayText: string | undefined,
    settings: FooderSettings,
    frontmatter: FrontMatterCache,
    sourcePosition: SourcePosition,
): GroupNode {
    const ingredientSumGrams = batch.totals.weight_grams;
    const scale = getReferenceScale(
        ingredientSumGrams,
        displayText,
        settings,
        frontmatter,
    );

    const scaled = scaleFoodNode(batch, scale) as GroupNode;
    // Recipe row weight reflects yield/portions eaten; children keep recipe amounts.
    scaled.totals.weight_grams = Number(
        getRequestedGrams(
            ingredientSumGrams,
            displayText,
            settings,
            frontmatter,
        ).toFixed(1),
    );

    scaled.sourcePosition = sourcePosition;
    scaled.scaleFactor = scale;
    return scaled;
}

function getRequestedGrams(
    ingredientSumGrams: number,
    displayText: string | undefined,
    settings: FooderSettings,
    frontmatter: FrontMatterCache,
): number {
    const portion = getPortionInfo(
        frontmatter,
        settings,
        ingredientSumGrams,
    );
    const yieldGrams = portion.yieldGrams ?? ingredientSumGrams;
    if (yieldGrams <= 0) {
        return 0;
    }

    const quantity = parseQuantity(displayText);
    const unitGrams =
        portion.servingSizeGrams ?? portion.yieldGrams ?? yieldGrams;
    return convertQuantityToGrams(quantity, unitGrams);
}

async function resolveRecipeBatch(
    app: App,
    settings: FooderSettings,
    recipeFile: TFile,
    ctx: ResolveContext,
): Promise<GroupNode> {
    const issues: string[] = [];

    if (ctx.depth > MAX_RECIPE_DEPTH) {
        return emptyRecipeGroup(recipeFile, [
            `max recipe depth exceeded (${MAX_RECIPE_DEPTH})`,
        ]);
    }

    if (ctx.visited.has(recipeFile.path)) {
        return emptyRecipeGroup(recipeFile, [
            `circular reference involving ${recipeFile.basename}`,
        ]);
    }

    ctx.visited.add(recipeFile.path);
    ctx.depth += 1;

    const cache = app.metadataCache.getFileCache(recipeFile);
    const listItems = cache?.listItems;
    const headings = cache?.headings;
    const nodes: NodeWithAncestors[] = [];
    let failedIngredients = 0;
    let totalIngredients = 0;

    for (const link of cache?.links ?? []) {
        const dest = app.metadataCache.getFirstLinkpathDest(
            link.link,
            recipeFile.path,
        );
        if (!dest) {
            continue;
        }

        const destCache = app.metadataCache.getFileCache(dest);
        if (!destCache) {
            continue;
        }

        const isRecipe = isRecipeFile(app, dest, destCache, settings);
        const isFood = isFoodFile(app, dest, destCache, settings);
        if (!isRecipe && !isFood) {
            continue;
        }

        totalIngredients += 1;
        const childPosition: SourcePosition = {
            line: link.position.start.line,
            col: link.position.start.col,
        };

        let child: FoodNode;
        if (isRecipe) {
            child = await resolveRecipeIngredient(
                app,
                settings,
                dest,
                link.displayText,
                childPosition,
                ctx,
            );
        } else {
            child = {
                type: 'food',
                item: createFoodItem(
                    dest,
                    destCache,
                    link.displayText,
                    settings,
                    link.position.start,
                ),
            };
        }

        if (nodeHasIssues(child)) {
            failedIngredients += 1;
        }

        nodes.push({
            ancestorLineNumbers: collectLinkAncestorLines(
                link.position,
                listItems,
                headings,
            ),
            node: child,
        });
    }

    ctx.depth -= 1;
    ctx.visited.delete(recipeFile.path);

    const sourceText = await app.vault.cachedRead(recipeFile);
    const children = buildFoodNodes(nodes, sourceText, headings, listItems);
    const totals = sumNodeTotals(children);

    if (failedIngredients > 0) {
        issues.push(
            `incomplete: ${failedIngredients} of ${totalIngredients} ingredients failed`,
        );
    }

    return {
        type: 'group',
        label: recipeFile.basename,
        line: -1,
        children,
        totals,
        recipeFile: recipeFile.path,
        issues: issues.length > 0 ? issues : undefined,
    };
}

function getReferenceScale(
    ingredientSumGrams: number,
    displayText: string | undefined,
    settings: FooderSettings,
    frontmatter: FrontMatterCache,
): number {
    const portion = getPortionInfo(
        frontmatter,
        settings,
        ingredientSumGrams,
    );
    const yieldGrams = portion.yieldGrams ?? ingredientSumGrams;
    if (yieldGrams <= 0) {
        return 0;
    }

    const requestedGrams = getRequestedGrams(
        ingredientSumGrams,
        displayText,
        settings,
        frontmatter,
    );
    return requestedGrams / yieldGrams;
}

function getPortionInfo(
    frontmatter: FrontMatterCache,
    settings: FooderSettings,
    computedBatchGrams: number,
): PortionInfo {
    const issues: string[] = [];
    const servingSizeGrams = parsePositiveQuantityGrams(
        frontmatter[settings.servingSizeProperty],
        frontmatter[settings.servingSizeUnitProperty],
        'serving size',
        issues,
    );
    const yieldGrams = parsePositiveQuantityGrams(
        frontmatter[settings.yieldProperty],
        frontmatter[settings.yieldUnitProperty],
        'yield',
        issues,
    );

    if (servingSizeGrams === null && yieldGrams === null && computedBatchGrams <= 0) {
        issues.push('yield or serving size missing');
    }

    return {
        yieldGrams: yieldGrams ?? (computedBatchGrams > 0 ? computedBatchGrams : null),
        servingSizeGrams,
        issues,
    };
}

function parsePositiveQuantityGrams(
    amountValue: unknown,
    unitValue: unknown,
    label: string,
    issues: string[],
): number | null {
    if (amountValue == null) {
        return null;
    }

    if (typeof amountValue !== 'number' || amountValue <= 0) {
        issues.push(`${label} must be a number greater than 0`);
        return null;
    }

    let unit: UnitOfMeasure = 'g';
    if (unitValue != null) {
        if (typeof unitValue !== 'string') {
            issues.push(`${label} unit must be a string`);
        } else {
            const parsed = parseUnit(unitValue);
            if (parsed === null) {
                issues.push(`invalid ${label} unit`);
            } else {
                unit = parsed;
            }
        }
    }

    return quantityToGrams({ amount: amountValue, unit });
}

function convertQuantityToGrams(
    quantity: Quantity,
    unitReferenceGrams: number,
): number {
    if (quantity.unit === 'unit') {
        return unitReferenceGrams * quantity.amount;
    }

    return quantityToGrams(quantity);
}

function quantityToGrams(quantity: Quantity): number {
    if (quantity.unit === 'unit') {
        return 0;
    }

    const multiplier = UNITS[quantity.unit].toGrams;
    return quantity.amount * multiplier;
}

export function scaleFoodNode(node: FoodNode, factor: number): FoodNode {
    if (factor === 1) {
        return node;
    }

    if (node.type === 'food') {
        return {
            type: 'food',
            item: scaleFoodItem(node.item, factor),
        };
    }

    const scaledChildren = node.children.map((child) =>
        scaleFoodNode(child, factor),
    );
    const totals = sumNodeTotals(scaledChildren);

    return {
        ...node,
        children: scaledChildren,
        totals,
        scaleFactor:
            node.scaleFactor !== undefined
                ? node.scaleFactor * factor
                : factor,
    };
}

function scaleFoodItem(item: FoodItem, factor: number): FoodItem {
    return {
        ...item,
        calories: item.calories * factor,
        protein: item.protein * factor,
        carbs: item.carbs * factor,
        fat: item.fat * factor,
        fiber: item.fiber * factor,
        weight_grams: item.weight_grams * factor,
    };
}

function nodeHasIssues(node: FoodNode): boolean {
    if (node.type === 'food') {
        return node.item.issues.length > 0;
    }

    return (node.issues?.length ?? 0) > 0 || node.totals.itemsWithIssues > 0;
}

function emptyRecipeGroup(file: TFile, issues: string[]): GroupNode {
    return {
        type: 'group',
        label: file.basename,
        line: -1,
        children: [],
        totals: {
            calories: 0,
            protein: 0,
            fat: 0,
            carbs: 0,
            fiber: 0,
            weight_grams: 0,
            itemsWithIssues: 1,
        },
        recipeFile: file.path,
        issues,
    };
}

export function isMacroRelevantFile(
    app: App,
    file: TFile,
    cache: CachedMetadata,
    settings: FooderSettings,
): boolean {
    return (
        isFoodFile(app, file, cache, settings) ||
        isRecipeFile(app, file, cache, settings)
    );
}

export function fileDependsOnTarget(
    app: App,
    settings: FooderSettings,
    source: TFile,
    target: TFile,
    visited: Set<string>,
): boolean {
    if (source.path === target.path) {
        return true;
    }

    if (visited.has(source.path)) {
        return false;
    }

    visited.add(source.path);

    const cache = app.metadataCache.getFileCache(source);
    if (!cache?.links) {
        return false;
    }

    for (const link of cache.links) {
        const dest = app.metadataCache.getFirstLinkpathDest(
            link.link,
            source.path,
        );
        if (!dest) {
            continue;
        }

        const destCache = app.metadataCache.getFileCache(dest);
        if (!destCache) {
            continue;
        }

        if (!isMacroRelevantFile(app, dest, destCache, settings)) {
            continue;
        }

        if (dest.path === target.path) {
            return true;
        }

        if (
            isRecipeFile(app, dest, destCache, settings) &&
            fileDependsOnTarget(app, settings, dest, target, visited)
        ) {
            return true;
        }
    }

    return false;
}
