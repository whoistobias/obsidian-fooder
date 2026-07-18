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

export interface FoodItem {
	name: string;
}
