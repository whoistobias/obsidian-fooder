import type { Quantity } from '../types';
import { parseAmountInText } from './parse-quantity';
import { ALL_UNIT_VALUES, formatUnit, parseUnit, toGrams, type UnitOfMeasure } from './units';

const UNIT_NAME_PATTERN = /^[\p{L}\p{N}]+$/u;

const STANDARD_UNIT_TOKENS = Array.from(ALL_UNIT_VALUES).sort(
	(a, b) => b.length - a.length,
);

export interface DefinedUnit {
	/** Key as written in frontmatter. */
	key: string;
	/** Lowercase key used for matching. */
	name: string;
	amount: number;
	unit: UnitOfMeasure;
}

export interface ParsedCustomUnits {
	units: DefinedUnit[];
	/** Lowercase name → issue. The name still matches aliases and then fails closed. */
	unusable: Map<string, string>;
	/** Issues attached to every link to the note. */
	noteIssues: string[];
}

export type AliasQuantity =
	| { kind: 'standard'; quantity: Quantity }
	| { kind: 'custom'; multiplier: number; unit: DefinedUnit }
	| { kind: 'rejected'; issue: string };

export function parseCustomUnits(
	frontmatter: { readonly [key: string]: unknown },
	unitsProperty: string,
): ParsedCustomUnits {
	const empty: ParsedCustomUnits = {
		units: [],
		unusable: new Map(),
		noteIssues: [],
	};

	if (!(unitsProperty in frontmatter)) {
		return empty;
	}

	const raw = frontmatter[unitsProperty];
	if (!Array.isArray(raw)) {
		return {
			units: [],
			unusable: new Map(),
			noteIssues: ['units must be a list'],
		};
	}

	const groups = new Map<string, { key: string; value: string }[]>();
	const noteIssues: string[] = [];
	let reportedNonString = false;

	for (const entry of raw) {
		if (typeof entry !== 'string') {
			if (!reportedNonString) {
				noteIssues.push('units entries must be strings');
				reportedNonString = true;
			}
			continue;
		}

		const split = splitUnitEntry(entry);
		if (!split) {
			noteIssues.push(`invalid unit entry "${entry.trim()}"`);
			continue;
		}

		if (!UNIT_NAME_PATTERN.test(split.key)) {
			noteIssues.push(`invalid unit name "${split.key}"`);
			continue;
		}

		const name = split.key.toLowerCase();
		const entries = groups.get(name) ?? [];
		entries.push(split);
		groups.set(name, entries);
	}

	const units: DefinedUnit[] = [];
	const unusable = new Map<string, string>();

	for (const [name, entries] of groups) {
		const first = entries[0];
		if (!first) {
			continue;
		}

		if (entries.length > 1) {
			unusable.set(name, `ambiguous unit "${first.key}"`);
			continue;
		}

		const parsed = parseStrictStandardQuantity(first.value);
		if (!parsed) {
			unusable.set(name, `invalid unit "${first.key}"`);
			continue;
		}

		units.push({
			key: first.key,
			name,
			amount: parsed.amount,
			unit: parsed.unit,
		});
	}

	return { units, unusable, noteIssues };
}

export function resolveAliasQuantity(
	displayText: string | undefined,
	parsed: ParsedCustomUnits,
): AliasQuantity {
	const text = displayText?.trim() ?? '';
	const amount = parseAmountInText(text);
	if (!text) {
		return { kind: 'standard', quantity: { amount: 1, unit: 'unit' } };
	}

	for (let index = 0; index < text.length; index++) {
		if (index > 0 && !/[\s\d]/.test(text[index - 1] ?? '')) {
			continue;
		}

		const best = bestUnitAt(text, index, parsed);
		if (!best) {
			continue;
		}

		if (best.kind === 'rejected') {
			return { kind: 'rejected', issue: best.issue };
		}

		if (best.kind === 'custom') {
			return { kind: 'custom', multiplier: amount, unit: best.unit };
		}

		return { kind: 'standard', quantity: { amount, unit: best.unit } };
	}

	return { kind: 'standard', quantity: { amount, unit: 'unit' } };
}

export function definedUnitToGrams(
	multiplier: number,
	unit: DefinedUnit,
	referenceGrams: number,
): number {
	if (unit.unit === 'unit') {
		return referenceGrams * unit.amount * multiplier;
	}

	return (toGrams(unit.amount, unit.unit) ?? 0) * multiplier;
}

export function formatCustomUnitNote(unit: DefinedUnit): string {
	const amount = formatAmount(unit.amount);
	if (unit.unit === 'unit') {
		return `${amount} ${unit.amount === 1 ? 'serving' : 'servings'}`;
	}

	return `${amount} ${formatUnit(unit.unit)}`;
}

export interface QuantityQuery {
	amountText: string;
	fragment: string;
}

const QUANTITY_QUERY_PATTERN = /^(\d+\s*\/\s*\d+|\d+\.\d*|\d+)\s*(.*)$/;

export function splitQuantityQuery(query: string): QuantityQuery | null {
	const match = query.match(QUANTITY_QUERY_PATTERN);
	if (!match?.[1]) {
		return null;
	}

	return {
		amountText: match[1],
		fragment: (match[2] ?? '').trim(),
	};
}

export function unitNameMatchesFragment(name: string, fragment: string): boolean {
	const key = name.toLowerCase();
	const typed = fragment.toLowerCase();
	if (!typed) {
		return true;
	}

	return key.startsWith(typed) || typed.startsWith(key);
}

export interface SuggestUnitRows {
	/** Valid custom `g`, shown in the grams slot. */
	grams: DefinedUnit | null;
	/** Built-in grams row, when the note does not define `g`. */
	showDefaultGrams: boolean;
	custom: DefinedUnit[];
}

export function suggestUnitRows(
	parsed: ParsedCustomUnits,
	fragment: string,
): SuggestUnitRows {
	const matches = (name: string) => unitNameMatchesFragment(name, fragment);
	const gramsUnit = parsed.units.find((unit) => unit.name === 'g') ?? null;
	const gramsUnusable = parsed.unusable.has('g');

	return {
		grams: gramsUnit && matches(gramsUnit.name) ? gramsUnit : null,
		showDefaultGrams: !gramsUnit && !gramsUnusable && matches('g'),
		custom: parsed.units
			.filter((unit) => unit.name !== 'g' && matches(unit.name))
			.sort((a, b) =>
				a.key.localeCompare(b.key, undefined, { sensitivity: 'base' }),
			),
	};
}

/** `carton:12` or `can:425g`. A space after the colon is allowed. */
function splitUnitEntry(entry: string): { key: string; value: string } | null {
	const separator = entry.indexOf(':');
	if (separator <= 0) {
		return null;
	}

	const key = entry.slice(0, separator).trim();
	const value = entry.slice(separator + 1).trim();
	if (!key || !value) {
		return null;
	}

	return { key, value };
}

function parseStrictStandardQuantity(
	value: unknown,
): { amount: number; unit: UnitOfMeasure } | null {
	if (typeof value === 'number') {
		if (!Number.isFinite(value) || value <= 0) {
			return null;
		}

		return { amount: value, unit: 'unit' };
	}

	if (typeof value !== 'string') {
		return null;
	}

	const text = value.trim();
	const amountMatch = text.match(/^(\d+\s*\/\s*\d+|\d+\.\d+|\d+)/);
	if (!amountMatch?.[1] || amountMatch.index !== 0) {
		return null;
	}

	const amount = parseAmountToken(amountMatch[1]);
	if (!Number.isFinite(amount) || amount <= 0) {
		return null;
	}

	const rest = text.slice(amountMatch[1].length).trim();
	if (!rest) {
		return { amount, unit: 'unit' };
	}

	const unit = parseUnit(rest);
	if (!unit) {
		return null;
	}

	return { amount, unit };
}

function parseAmountToken(raw: string): number {
	if (raw.includes('/')) {
		const [numeratorText, denominatorText] = raw
			.split('/')
			.map((part) => part.trim());
		const denominator = Number(denominatorText);
		if (!denominator) {
			return Number.NaN;
		}

		return Number(numeratorText) / denominator;
	}

	return Number(raw);
}

function formatAmount(amount: number): string {
	return String(amount);
}

type UnitCandidate =
	| { kind: 'custom'; length: number; unit: DefinedUnit }
	| { kind: 'standard'; length: number; unit: UnitOfMeasure }
	| { kind: 'rejected'; length: number; issue: string };

function bestUnitAt(
	text: string,
	index: number,
	parsed: ParsedCustomUnits,
): UnitCandidate | null {
	const lower = text.slice(index).toLowerCase();
	let best: UnitCandidate | null = null;

	const consider = (candidate: UnitCandidate) => {
		if (!best || candidate.length > best.length) {
			best = candidate;
			return;
		}

		const customOverridesStandard =
			candidate.length === best.length &&
			candidate.kind !== 'standard' &&
			best.kind === 'standard';
		if (customOverridesStandard) {
			best = candidate;
		}
	};

	for (const unit of parsed.units) {
		if (lower.startsWith(unit.name)) {
			consider({ kind: 'custom', length: unit.name.length, unit });
		}
	}

	for (const [name, issue] of parsed.unusable) {
		if (lower.startsWith(name)) {
			consider({ kind: 'rejected', length: name.length, issue });
		}
	}

	const standard = matchStandardUnitAt(text, index);
	if (standard) {
		consider({ kind: 'standard', length: standard.length, unit: standard.unit });
	}

	return best;
}

function matchStandardUnitAt(
	text: string,
	index: number,
): { unit: UnitOfMeasure; length: number } | null {
	const slice = text.slice(index);
	const lower = slice.toLowerCase();

	for (const token of STANDARD_UNIT_TOKENS) {
		const tokenLower = token.toLowerCase();
		if (!lower.startsWith(tokenLower)) {
			continue;
		}

		if (!standardUnitBoundary(slice, tokenLower.length)) {
			continue;
		}

		const unit = parseUnit(token);
		if (!unit) {
			continue;
		}

		return { unit, length: tokenLower.length };
	}

	return null;
}

/** Same end boundary as the standard unit regex: end, whitespace, or a non-letter. */
function standardUnitBoundary(slice: string, length: number): boolean {
	if (length >= slice.length) {
		return true;
	}

	const next = slice[length];
	if (next === undefined) {
		return true;
	}

	return /[^a-z]/i.test(next);
}
