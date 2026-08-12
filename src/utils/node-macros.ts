import type { FoodNode, NodeMacroSummary } from '../types';

export function getNodeKey(node: FoodNode): string {
	if (node.type === 'group') {
		if (node.sourcePosition) {
			return `group:${node.sourcePosition.line}:${node.sourcePosition.col}`;
		}
		if (node.recipeFile) {
			return `recipe:${node.recipeFile}:${node.line}`;
		}
		return `group:${node.line}`;
	}

	const { line, col } = node.item.sourcePosition;
	return `food:${line}:${col}`;
}

export function foodNodeToSummary(node: FoodNode): NodeMacroSummary {
	if (node.type === 'group') {
		const itemsWithIssues =
			node.totals.itemsWithIssues + (node.issues?.length ? 1 : 0);
		return {
			calories: node.totals.calories,
			protein: node.totals.protein,
			fat: node.totals.fat,
			carbs: node.totals.carbs,
			itemsWithIssues,
		};
	}

	return {
		calories: Number(node.item.calories.toFixed(1)),
		protein: Number(node.item.protein.toFixed(1)),
		fat: Number(node.item.fat.toFixed(1)),
		carbs: Number(node.item.carbs.toFixed(1)),
		itemsWithIssues: node.item.issues.length ? 1 : 0,
	};
}

export function getNodeLabel(node: FoodNode): string {
	return node.type === 'group' ? node.label : node.item.name;
}

export function treeContainsNodeKey(nodes: FoodNode[], key: string): boolean {
	for (const node of nodes) {
		if (getNodeKey(node) === key) {
			return true;
		}

		if (node.type === 'group' && treeContainsNodeKey(node.children, key)) {
			return true;
		}
	}

	return false;
}
