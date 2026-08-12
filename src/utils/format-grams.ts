/** Format gram amounts for display; underlying values stay full precision. */
export function formatGrams(grams: number): string {
	return String(Number(grams.toFixed(1)));
}
