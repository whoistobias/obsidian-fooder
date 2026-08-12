import { parseQuantity } from './parse-quantity';
import { ALL_UNIT_VALUES, toGrams } from './units';

const UNIT_PATTERN = Array.from(ALL_UNIT_VALUES)
    .sort((a, b) => b.length - a.length)
    .join('|');

const NUMBER_PATTERN = /(\d+\s*\/\s*\d+|\d+\.\d+|\d+)/;

const UNIT_PATTERN_REGEX = new RegExp(
    `(?:^|[\\s\\d])(${UNIT_PATTERN})(?=\\b|[\\s]|$|[^a-z])`,
    'i',
);

export interface ParsedPortionLabel {
    displayLabel: string;
    /** Absolute portion in grams when the label includes a weight unit. */
    portionGrams?: number;
    /** Portion as a fraction of the batch (e.g. 0.5 for `1/2 dinner`). */
    portionRatio?: number;
}

export function parsePortionFromLabel(
    label: string,
): ParsedPortionLabel | null {
    const trimmed = label.trim();
    if (!trimmed) {
        return null;
    }

    const numberMatch = trimmed.match(NUMBER_PATTERN);
    const quantity = parseQuantity(trimmed);

    if (quantity.unit !== 'unit') {
        const portionGrams = toGrams(quantity.amount, quantity.unit);
        if (portionGrams === null || portionGrams <= 0) {
            return null;
        }

        const displayLabel = stripQuantityFromLabel(trimmed, true);
        if (!displayLabel) {
            return null;
        }

        return { displayLabel, portionGrams };
    }

    if (!numberMatch) {
        return null;
    }

    if (quantity.amount <= 0) {
        return null;
    }

    const displayLabel = stripQuantityFromLabel(trimmed, false);
    if (!displayLabel) {
        return null;
    }

    return {
        displayLabel,
        portionRatio: quantity.amount,
    };
}

function stripQuantityFromLabel(
    label: string,
    stripWeightUnit: boolean,
): string {
    let result = label;
    const numberMatch = result.match(NUMBER_PATTERN);
    if (numberMatch && numberMatch.index !== undefined) {
        result =
            result.slice(0, numberMatch.index) +
            result.slice(numberMatch.index + numberMatch[0].length);
    }

    if (stripWeightUnit) {
        const unitMatch = result.match(UNIT_PATTERN_REGEX);
        if (unitMatch?.[1]) {
            const unitIndex = result
                .toLowerCase()
                .indexOf(unitMatch[1].toLowerCase());
            if (unitIndex >= 0) {
                result =
                    result.slice(0, unitIndex) +
                    result.slice(unitIndex + unitMatch[1].length);
            }
        }
    }

    return result.replace(/\s+/g, ' ').trim();
}

export function resolvePortionGrams(
    portion: ParsedPortionLabel,
    batchTotalGrams: number,
): number {
    if (portion.portionGrams !== undefined) {
        return portion.portionGrams;
    }

    return portion.portionRatio! * batchTotalGrams;
}
