type UnitMetadata = {
	symbol: string;
	toGrams: number | null;
	aliases: readonly string[];
};

export const UNITS = {
	g: { symbol: 'g', toGrams: 1, aliases: ['gram'] },
	kg: { symbol: 'kg', toGrams: 1000, aliases: ['kilogram'] },
	mg: { symbol: 'mg', toGrams: 0.001, aliases: ['milligram'] },
	oz: { symbol: 'oz', toGrams: 28.3495, aliases: ['ounce'] },
	lb: { symbol: 'lb', toGrams: 453.592, aliases: ['pound'] },
	ml: { symbol: 'ml', toGrams: 1, aliases: ['milliliter'] },
	l: { symbol: 'l', toGrams: 1000, aliases: ['liter'] }, // water-density approximation; good enough for most liquids
	tsp: { symbol: 'tsp', toGrams: 4.92892, aliases: ['teaspoon'] },
	tbsp: { symbol: 'tbsp', toGrams: 14.7868, aliases: ['tablespoon'] },
	cup: { symbol: 'cup', toGrams: 240, aliases: [] },
	floz: { symbol: 'floz', toGrams: 29.5735, aliases: ['fluid ounce'] },
	unit: { symbol: 'unit', toGrams: null, aliases: ['each', 'piece'] }, // dimensionless
} as const satisfies Record<string, UnitMetadata>;

export const ALL_UNIT_VALUES = Object.values(UNITS).flatMap((meta) => [
	meta.symbol,
	...meta.aliases,
]);

export type UnitOfMeasure = keyof typeof UNITS;

export function formatUnit(unit: UnitOfMeasure): string {
	return UNITS[unit].symbol;
}

export function parseUnit(input: string): UnitOfMeasure | null {
	const normalized = input.trim().toLowerCase();
	for (const [key, meta] of Object.entries(UNITS)) {
		if (
			key === normalized ||
			meta.symbol === normalized ||
			(meta.aliases as readonly string[]).includes(normalized)
		) {
			return key as UnitOfMeasure;
		}
	}
	return null;
}

export function toGrams(amount: number, unit: UnitOfMeasure): number | null {
	const factor = UNITS[unit].toGrams;
	return factor == null ? null : amount * factor;
}
