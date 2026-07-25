import {
	App,
	TFile,
	type CachedMetadata,
	type FrontMatterCache,
	type HeadingCache,
} from 'obsidian';
import {
	CALORIES_FRONTMATTER_KEY,
	CARBS_FRONTMATTER_KEY,
	FAT_FRONTMATTER_KEY,
	FIBER_FRONTMATTER_KEY,
	PROTEIN_FRONTMATTER_KEY,
	SERVING_SIZE_FRONTMATTER_KEY,
	SERVING_SIZE_UNIT_FRONTMATTER_KEY,
	type FoodItem,
	type FoodNode,
	type GroupNode,
	type Quantity,
	type RequiredFrontmatter,
} from '../types';
import { FOOD_TAG } from './food';
import { parseQuantity } from './parse-quantity';
import { fileHasTag } from './tags';
import { parseUnit, UNITS } from './units';
import { getHeadingsForPosition } from './get-headings-for-position';
import { getListAncestorsForPostition } from './get-list-ancestors-for-position';

export async function getFoodItems(
	app: App,
	source_file: TFile,
): Promise<FoodNode[]> {
	const cache = app.metadataCache.getFileCache(source_file);

	const listItems = cache?.listItems;
	const headings = cache?.headings;
	const links = cache?.links ?? [];
	const nodes: FoodNode[] = [];
	const groups: Map<number, Partial<GroupNode>> = new Map();

	const foods: { ancestorLineNumbers: number[]; food: FoodItem }[] = [];

	const v = cache?.headings;
	for (const link of links) {
		const file = app.metadataCache.getFirstLinkpathDest(
			link.link,
			source_file.path,
		);
		if (!file) {
			continue;
		}
		const cache = app.metadataCache.getFileCache(file);
		if (!cache) {
			continue;
		}
		if (!fileHasTag(cache, `#${FOOD_TAG}`)) {
			continue;
		}

		const ancestorLineNumbers: number[] = [];

		if (listItems) {
			const foundListAncestors = getListAncestorsForPostition(
				listItems,
				link.position,
			);
			for (const listAncestor of foundListAncestors) {
				ancestorLineNumbers.push(listAncestor.position.start.line);
			}
			// const listItem = listItems.find((item) => {
			// 	return item.position.start.line === link.position.start.line;
			// });

			// if (listItem) {
			// 	let parent = listItem.parent;
			// 	while (parent >= 0) {
			// 		ancestorLineNumbers.push(listItem.parent);
			// 		parent =
			// 			listItems.find(
			// 				(item) => item.position.start.line === parent,
			// 			)?.parent || -1;
			// 	}
			// }
		}

		if (headings) {
			let foundHeadings = getHeadingsForPosition(headings, link.position);
			for (const heading of foundHeadings) {
				ancestorLineNumbers.push(heading.position.start.line);
			}
		}

		foods.push({
			ancestorLineNumbers,
			food: createFoodItem(file, cache, link.displayText),
		});
	}

	for (const foodItem of foods) {
		nodes.push({
			item: foodItem.food,
			type: 'food',
		});
	}

	return nodes;
}

function createFoodItem(
	file: TFile,
	cache: CachedMetadata,
	displayText: string | undefined,
): FoodItem {
	const foodItem: FoodItem = {
		name: file.basename,
		weight_grams: 0,
		protein: 0,
		amount: 0,
		calories: 0,
		carbs: 0,
		fat: 0,
		fiber: 0,
		issues: [],
	};

	const {
		frontmatter: {
			servingSize,
			servingSizeUnit,
			calories,
			carbs,
			fat,
			fiber,
			protein,
		},
		issues,
	} = validateFrontmatter(cache.frontmatter ?? {});
	foodItem.issues = issues;
	if (servingSize === 0) {
		return foodItem;
	}
	const servingQuantity: Quantity = {
		amount: servingSize,
		unit: servingSizeUnit,
	};
	const quantity = parseQuantity(displayText);
	const servingSizeGrams = quantityToGrams(servingQuantity);
	const amountGrams = convertToGrams(quantity, servingSizeGrams);

	foodItem.protein = amountGrams * (protein / servingSizeGrams);
	foodItem.calories = amountGrams * (calories / servingSizeGrams);
	foodItem.carbs = amountGrams * (carbs / servingSizeGrams);
	foodItem.fat = amountGrams * (fat / servingSizeGrams);
	foodItem.fiber = amountGrams * (fiber / servingSizeGrams);

	foodItem.weight_grams = amountGrams;
	return foodItem;
}

// Converts the amount of food to grams, needs serving quantity so that if the amount is "unit" (e.g. an apple), it can provide the grams from the serving amount.
function convertToGrams(quantity: Quantity, servingSizeGrams: number): number {
	// const quantityGrams = TODO THIS IS WHERE WE ARE
	if (quantity.unit === 'unit') {
		return servingSizeGrams * quantity.amount;
	} else {
		return quantityToGrams(quantity);
	}
}
// Simply converts a quantity struct to the number of grams
function quantityToGrams(quantity: Quantity): number {
	if (quantity.unit === 'unit') return 0;
	const multiplier = UNITS[quantity.unit].toGrams;
	return quantity.amount * multiplier;
}

interface FrontMatterValidation {
	frontmatter: RequiredFrontmatter;
	issues: string[];
}

function validateFrontmatter(
	frontmatterCache: FrontMatterCache,
): FrontMatterValidation {
	const issues: string[] = [];
	const frontmatter: RequiredFrontmatter = {
		servingSize: 0,
		servingSizeUnit: 'g',
		calories: 0,
		protein: 0,
		carbs: 0,
		fat: 0,
		fiber: 0,
	};
	const servingSize: unknown = frontmatterCache[SERVING_SIZE_FRONTMATTER_KEY];
	if (servingSize == null) {
		issues.push('serving size missing');
	} else if (typeof servingSize !== 'number') {
		issues.push('serving size must be a number');
	} else if (servingSize <= 0) {
		issues.push('serving size must be greater than 0');
	} else {
		frontmatter.servingSize = servingSize;
	}

	const servingSizeUnit: unknown =
		frontmatterCache[SERVING_SIZE_UNIT_FRONTMATTER_KEY];
	if (servingSizeUnit) {
		if (typeof servingSizeUnit !== 'string') {
			issues.push('serving size unit must be a string.');
		} else {
			const unit = parseUnit(servingSizeUnit);
			if (unit === null) {
				issues.push(`invalid serving size unit.`);
			} else {
				frontmatter.servingSizeUnit = unit;
			}
		}
	}

	const calories = validateNumber(
		frontmatterCache[CALORIES_FRONTMATTER_KEY],
		'calories',
		issues,
	);
	frontmatter.calories = calories ?? frontmatter.calories;

	const protein = validateNumber(
		frontmatterCache[PROTEIN_FRONTMATTER_KEY],
		'protein',
		issues,
	);
	frontmatter.protein = protein ?? frontmatter.protein;
	const carbs = validateNumber(
		frontmatterCache[CARBS_FRONTMATTER_KEY],
		'carbs',
		issues,
	);
	frontmatter.carbs = carbs ?? frontmatter.carbs;

	const fat = validateNumber(
		frontmatterCache[FAT_FRONTMATTER_KEY],
		'fat',
		issues,
	);
	frontmatter.fat = fat ?? frontmatter.fat;

	const fiber: unknown = frontmatterCache[FIBER_FRONTMATTER_KEY];
	if (fiber) {
		if (typeof fiber !== 'number') {
			issues.push('fiber must be a number');
		} else {
			frontmatter.fiber = fiber;
		}
	}

	return { frontmatter, issues };
}

function validateNumber(
	input: unknown,
	title: string,
	issues: string[],
): number | null {
	if (input == null) {
		issues.push(`${title} missing`);
	} else if (typeof input !== 'number') {
		issues.push('${} must be a number');
	} else {
		return input;
	}
	return null;
}
