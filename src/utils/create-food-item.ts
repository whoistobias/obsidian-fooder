import {
    TFile,
    type CachedMetadata,
    type FrontMatterCache,
    type Loc,
} from 'obsidian';
import { type FooderSettings } from '../settings';
import type { FoodItem, Quantity, RequiredFrontmatter } from '../types';
import { parseQuantity } from './parse-quantity';
import { parseUnit, UNITS } from './units';

export function createFoodItem(
    file: TFile,
    cache: CachedMetadata,
    displayText: string | undefined,
    settings: FooderSettings,
    sourcePosition: Loc,
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
        sourcePosition,
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
    } = validateFrontmatter(cache.frontmatter ?? {}, settings);
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

function convertToGrams(quantity: Quantity, servingSizeGrams: number): number {
    if (quantity.unit === 'unit') {
        return servingSizeGrams * quantity.amount;
    }

    return quantityToGrams(quantity);
}

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
    settings: FooderSettings,
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
    const servingSize: unknown = frontmatterCache[settings.servingSizeProperty];
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
        frontmatterCache[settings.servingSizeUnitProperty];
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
        frontmatterCache[settings.caloriesProperty],
        'calories',
        issues,
    );
    frontmatter.calories = calories ?? frontmatter.calories;

    const protein = validateNumber(
        frontmatterCache[settings.proteinProperty],
        'protein',
        issues,
    );
    frontmatter.protein = protein ?? frontmatter.protein;
    const carbs = validateNumber(
        frontmatterCache[settings.carbsProperty],
        'carbs',
        issues,
    );
    frontmatter.carbs = carbs ?? frontmatter.carbs;

    const fat = validateNumber(
        frontmatterCache[settings.fatProperty],
        'fat',
        issues,
    );
    frontmatter.fat = fat ?? frontmatter.fat;

    const fiber: unknown = frontmatterCache[settings.fiberProperty];
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
        issues.push(`${title} must be a number`);
    } else {
        return input;
    }
    return null;
}
