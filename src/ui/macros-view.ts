import { ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { mount, unmount } from 'svelte';
import type FooderPlugin from '../main';
import type { FooderSettings } from '../settings';
import FooderViewComponent from './MacrosView.svelte';
import {
	createFooderViewProps,
	type FooderViewProps,
} from './fooder-view-props.svelte';
import { getFoodItems } from '../utils/get-food-items';
import type MacrosView from './MacrosView.svelte';

export const VIEW_TYPE_FOODER = 'fooder-view';

interface UpdateForFileOptions {
	force?: boolean;
}

export class FooderView extends ItemView {
	private viewProps: FooderViewProps | undefined;
	private svelteComponent: ReturnType<typeof MacrosView> | undefined;
	private pendingFile: TFile | null | undefined;
	private loadedFilePath: string | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		private plugin: FooderPlugin,
	) {
		super(leaf);
	}

	getViewType(): string {
		return VIEW_TYPE_FOODER;
	}

	getDisplayText(): string {
		return 'Fooder';
	}

	getIcon(): string {
		return 'carrot';
	}

	async onOpen(): Promise<void> {
		this.viewProps = createFooderViewProps({
			settings: this.plugin.settings,
		});
		this.svelteComponent = mount(FooderViewComponent, {
			target: this.contentEl,
			props: this.viewProps,
		});

		if (this.pendingFile !== undefined) {
			const file = this.pendingFile;
			this.pendingFile = undefined;
			await this.updateForFile(file);
			return;
		}

		await this.plugin.populateFooderView(this);
	}

	async onClose(): Promise<void> {
		if (this.svelteComponent) {
			await unmount(this.svelteComponent);
			this.svelteComponent = undefined;
		}

		this.viewProps = undefined;
		this.pendingFile = undefined;
	}

	async updateForFile(
		file: TFile | null,
		options: UpdateForFileOptions = {},
	): Promise<void> {
		if (!this.viewProps) {
			this.pendingFile = file;
			return;
		}

		if (!file) {
			this.loadedFilePath = null;
			this.viewProps.nodes = [];
			return;
		}

		if (!options.force && file.path === this.loadedFilePath) {
			return;
		}

		this.loadedFilePath = file.path;
		this.viewProps.nodes = await getFoodItems(this.app, file);
	}

	updateSettings(settings: FooderSettings): void {
		if (this.viewProps) {
			this.viewProps.settings = { ...settings };
		}
	}
}
