import type { FooderSettings } from '../settings';
import type { FoodItem } from '../types';

export function createFooderViewProps(initial: { settings: FooderSettings }) {
	const props = $state({
		items: [] as FoodItem[],
		settings: { ...initial.settings },
	});

	return props;
}

export type FooderViewProps = ReturnType<typeof createFooderViewProps>;
