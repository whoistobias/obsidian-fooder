import type { FooderSettings } from '../settings';
import type { FoodNode } from '../types';

export function createFooderViewProps(initial: { settings: FooderSettings }) {
	const props = $state({
		nodes: [] as FoodNode[],
		settings: { ...initial.settings },
	});

	return props;
}

export type FooderViewProps = ReturnType<typeof createFooderViewProps>;
