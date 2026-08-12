import type { FoodNode } from '../types';
import { sumNodeTotals } from './build-food-nodes';
import { parsePortionFromLabel, resolvePortionGrams } from './parse-portion-label';
import { scaleFoodNode } from './resolve-recipe';

/** Apply one-off portion scaling to heading/list groups (post-order, compounding). */
export function applyPortionGroups(nodes: FoodNode[]): void {
    for (const node of nodes) {
        if (node.type !== 'group') {
            continue;
        }

        applyPortionGroups(node.children);

        if (node.recipeFile) {
            continue;
        }

        const portion = parsePortionFromLabel(node.label);
        if (!portion || node.children.length === 0) {
            continue;
        }

        const batchTotal = sumBatchWeight(node.children);
        if (batchTotal <= 0) {
            continue;
        }

        const portionGrams = resolvePortionGrams(portion, batchTotal);
        const scale = portionGrams / batchTotal;

        node.children = node.children.map((child) => scaleFoodNode(child, scale));
        node.label = portion.displayLabel;
        node.portionGrams = portionGrams;
        node.scaleFactor = scale;
        node.totals = sumNodeTotals(node.children);
        node.totals.weight_grams = Number(portionGrams.toFixed(1));
    }
}

function sumBatchWeight(nodes: FoodNode[]): number {
    let sum = 0;

    for (const node of nodes) {
        if (node.type === 'food') {
            sum += node.item.weight_grams;
        } else {
            sum += node.totals.weight_grams;
        }
    }

    return sum;
}

/** Refresh totals on structural groups after portion scaling. */
export function recomputeStructuralGroupTotals(nodes: FoodNode[]): void {
    for (const node of nodes) {
        if (node.type !== 'group') {
            continue;
        }

        recomputeStructuralGroupTotals(node.children);

        if (node.recipeFile) {
            const childTotals = sumNodeTotals(node.children);
            node.totals = {
                ...childTotals,
                weight_grams: node.totals.weight_grams,
            };
            continue;
        }

        if (node.portionGrams === undefined) {
            node.totals = sumNodeTotals(node.children);
        }
    }
}
