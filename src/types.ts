import type { UnitOfMeasure } from './utils/units';

export interface FooderLinkSection {
    link: string;
    content: string | null;
    sourcePath: string | null;
    missing: boolean;
}

export interface FooderViewState {
    emptyMessage: string | null;
    sections: FooderLinkSection[];
}

export interface SourcePosition {
    line: number;
    col: number;
}

export interface FoodItem {
    name: string;
    amount: number;
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    weight_grams: number;
    fiber: number;
    issues: string[];
    sourcePosition: SourcePosition;
}

export interface NodeMacroSummary {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    itemsWithIssues: number;
}

export interface MacroTotals {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber: number;
    weight_grams: number;
    itemsWithIssues: number;
}

export interface GroupNode {
    type: 'group';
    label: string;
    line: number;
    children: FoodNode[];
    totals: MacroTotals;
    /** Set when this group represents an expanded recipe reference. */
    recipeFile?: string;
    scaleFactor?: number;
    /** Requested portion in grams for one-off scaled groups. */
    portionGrams?: number;
    issues?: string[];
    /** Link position when this group comes from a wikilink in the source note. */
    sourcePosition?: SourcePosition;
}
export interface ItemNode {
    type: 'food';
    item: FoodItem;
}

export type FoodNode = GroupNode | ItemNode;

export interface Quantity {
    amount: number;
    unit: UnitOfMeasure;
}

export interface RequiredFrontmatter {
    servingSize: number;
    servingSizeUnit: UnitOfMeasure;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
}

export const SERVING_SIZE_FRONTMATTER_KEY = 'serving_size';
export const SERVING_SIZE_UNIT_FRONTMATTER_KEY = 'serving_size_unit';
export const YIELD_FRONTMATTER_KEY = 'yield';
export const YIELD_UNIT_FRONTMATTER_KEY = 'yield_unit';
export const CALORIES_FRONTMATTER_KEY = 'calories';
export const PROTEIN_FRONTMATTER_KEY = 'protein';
export const CARBS_FRONTMATTER_KEY = 'carbs';
export const FAT_FRONTMATTER_KEY = 'fat';
export const FIBER_FRONTMATTER_KEY = 'fiber';
