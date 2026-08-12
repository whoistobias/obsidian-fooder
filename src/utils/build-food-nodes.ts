import type { HeadingCache, ListItemCache } from 'obsidian';
import type { FoodNode, GroupNode, MacroTotals } from '../types';

export interface NodeWithAncestors {
    ancestorLineNumbers: number[];
    node: FoodNode;
}

const LIST_MARKER_RE = /^\s*(?:[-*+]|\d+[.)])\s+(?:\[[ xX]\]\s+)?/;

function emptyTotals(): MacroTotals {
    return {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        weight_grams: 0,
        itemsWithIssues: 0,
    };
}

export function buildFoodNodes(
    nodes: NodeWithAncestors[],
    sourceText: string,
    headings: HeadingCache[] | undefined,
    listItems: ListItemCache[] | undefined,
): FoodNode[] {
    const root: FoodNode[] = [];
    const groupsByLine = new Map<number, GroupNode>();
    const labelsByLine = new Map<number, string>();

    for (const { ancestorLineNumbers, node } of nodes) {
        const path = [...new Set(ancestorLineNumbers)].sort((a, b) => a - b);
        let siblings = root;

        for (const line of path) {
            let group = groupsByLine.get(line);
            if (!group) {
                group = {
                    type: 'group',
                    line,
                    label: getLabelForLine(
                        line,
                        sourceText,
                        headings,
                        listItems,
                        labelsByLine,
                    ),
                    children: [],
                    totals: emptyTotals(),
                };
                groupsByLine.set(line, group);
                siblings.push(group);
            }
            siblings = group.children;
        }

        siblings.push(node);
    }

    for (const node of root) {
        if (node.type === 'group' && !node.recipeFile) {
            node.totals = sumNodeTotals(node.children);
        }
    }

    return root;
}

export function sumNodeTotals(nodes: FoodNode[]): MacroTotals {
    const totals = emptyTotals();

    for (const node of nodes) {
        if (node.type === 'group') {
            const childTotals = sumNodeTotals(node.children);
            const recipeDisplayWeight =
                node.recipeFile !== undefined ? node.totals.weight_grams : 0;
            node.totals = {
                ...childTotals,
                weight_grams:
                    node.recipeFile !== undefined && recipeDisplayWeight > 0
                        ? Number(recipeDisplayWeight.toFixed(1))
                        : childTotals.weight_grams,
            };
            addTotals(totals, node.totals);
            if (node.issues?.length) {
                totals.itemsWithIssues += 1;
            }
            continue;
        }

        totals.calories += node.item.calories;
        totals.protein += node.item.protein;
        totals.fat += node.item.fat;
        totals.carbs += node.item.carbs;
        totals.fiber += node.item.fiber;
        totals.weight_grams += node.item.weight_grams;
        totals.itemsWithIssues += node.item.issues.length ? 1 : 0;
    }

    return {
        calories: Number(totals.calories.toFixed(1)),
        protein: Number(totals.protein.toFixed(1)),
        fat: Number(totals.fat.toFixed(1)),
        carbs: Number(totals.carbs.toFixed(1)),
        fiber: Number(totals.fiber.toFixed(1)),
        weight_grams: Number(totals.weight_grams.toFixed(1)),
        itemsWithIssues: totals.itemsWithIssues,
    };
}

function addTotals(target: MacroTotals, source: MacroTotals): void {
    target.calories += source.calories;
    target.protein += source.protein;
    target.fat += source.fat;
    target.carbs += source.carbs;
    target.fiber += source.fiber;
    target.weight_grams += source.weight_grams;
    target.itemsWithIssues += source.itemsWithIssues;
}

function getLabelForLine(
    line: number,
    sourceText: string,
    headings: HeadingCache[] | undefined,
    listItems: ListItemCache[] | undefined,
    cache: Map<number, string>,
): string {
    const cached = cache.get(line);
    if (cached !== undefined) {
        return cached;
    }

    const heading = headings?.find((h) => h.position.start.line === line);
    if (heading) {
        cache.set(line, heading.heading);
        return heading.heading;
    }

    const listItem = listItems?.find(
        (item) => item.position.start.line === line,
    );
    if (listItem) {
        const raw = sourceText.slice(
            listItem.position.start.offset,
            listItem.position.end.offset,
        );
        const label = raw.replace(LIST_MARKER_RE, '').trim();
        cache.set(line, label);
        return label;
    }

    cache.set(line, '');
    return '';
}
