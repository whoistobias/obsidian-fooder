import type { Quantity } from '../types';
import { ALL_UNIT_VALUES, parseUnit } from './units';

const UNIT_PATTERN = Array.from(ALL_UNIT_VALUES)
	.sort((a, b) => b.length - a.length)
	.join('|');

const NUMBER_PATTERN = /(\d+\s*\/\s*\d+|\d+\.\d+|\d+)/;

const LEADING_NUMBER_PATTERN = /^(\d+\s*\/\s*\d+|\d+\.\d+|\d+)/;

const UNIT_PATTERN_REGEX = new RegExp(
	`(?:^|[\\s\\d])(${UNIT_PATTERN})(?=\\b|[\\s]|$|[^a-z])`,
	'i',
);

// Matches the display text from wiki-links in the form:  [[note name|..amount unit..]]
// Examples that parse correctly:
//   [[flour|100g flour]]           → amount: 100,  unit: g
//   [[whole milk|200ml whole milk]]→ amount: 200,  unit: ml
//   [[butter|0.5tbsp butter]]      → amount: 0.5,  unit: tbsp
//   [[butter|1/2 tbsp butter]]     → amount: 0.5,  unit: tbsp
//   [[apple]]                      → amount:   1,  unit: unit
//   [[salt|salt]]                  → amount:   1,  unit: unit
/** True when alias text begins with an explicit numeric quantity (e.g. `2 Egg`, `100g flour`). */
export function aliasHasExplicitQuantity(alias: string | undefined): boolean {
	if (!alias) {
		return false;
	}

	return LEADING_NUMBER_PATTERN.test(alias.trimStart());
}

export function parseAmountInText(text: string | undefined): number {
	const trimmed = text?.trim();
	if (!trimmed) {
		return 1;
	}

	const numberMatch = trimmed.match(NUMBER_PATTERN);
	return numberMatch?.[1] ? parseAmount(numberMatch[1]) : 1;
}

export function parseQuantity(displayText: string | undefined): Quantity {
	const defaultQuantity: Quantity = { amount: 1, unit: 'unit' };
	const text = displayText?.trim();
	if (!text) {
		return defaultQuantity;
	}

	const unitMatch = text.match(UNIT_PATTERN_REGEX);

	return {
		amount: parseAmountInText(text),
		unit: unitMatch?.[1] ? (parseUnit(unitMatch[1]) ?? 'unit') : 'unit',
	};
}

function parseAmount(raw: string): number {
	if (raw.includes('/')) {
		const [numeratorText, denominatorText] = raw
			.split('/')
			.map((part) => part.trim());
		return Number(numeratorText) / Number(denominatorText);
	}

	return Number(raw);
}
