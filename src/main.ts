import { MarkdownView, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import {
	DEFAULT_SETTINGS,
	FooderSettingTab,
	type FooderSettings,
} from './settings';
import { FooderView, VIEW_TYPE_FOODER } from './ui/macros-view';
import { fileHasRecipeTag } from './utils/recipe';

export default class FooderPlugin extends Plugin {
	settings!: FooderSettings;
	private fooderViewActivation: Promise<void> | null = null;

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_FOODER, (leaf) => new FooderView(leaf, this));

		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				void this.syncFooderView();
			}),
		);

		this.registerEvent(
			this.app.workspace.on('file-open', () => {
				void this.syncFooderView();
			}),
		);

		this.registerEvent(
			this.app.vault.on('modify', (file) => {
				if (file instanceof TFile) {
					void this.refreshFooderViewIfActive(file);
				}
			}),
		);

		this.registerEvent(
			this.app.metadataCache.on('changed', (file) => {
				void this.refreshFooderViewIfActive(file);
			}),
		);

		this.addCommand({
			id: 'show-linked-foods',
			name: 'Show linked foods',
			callback: () => {
				void this.activateFooderView();
			},
		});

		this.addSettingTab(new FooderSettingTab(this.app, this));

		await this.syncFooderView();
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<FooderSettings>,
		);
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	updateFooderViewsSettings(): void {
		for (const leaf of this.app.workspace.getLeavesOfType(VIEW_TYPE_FOODER)) {
			if (leaf.view instanceof FooderView) {
				leaf.view.updateSettings(this.settings);
			}
		}
	}

	private getActiveMarkdownFile(): TFile | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		return view?.file ?? null;
	}

	private getFooderView(): FooderView | null {
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOODER)[0];
		const view = leaf?.view;
		return view instanceof FooderView ? view : null;
	}

	private async syncFooderView(): Promise<void> {
		const file = this.getActiveMarkdownFile();

		if (file && fileHasRecipeTag(this.app, file)) {
			await this.activateFooderView();
			await this.getFooderView()?.updateForFile(file);
			return;
		}

		// this.app.workspace.detachLeavesOfType(VIEW_TYPE_FOODER);
	}

	private async refreshFooderViewIfActive(
		_modifiedFile: TFile,
	): Promise<void> {
		const activeFile = this.getActiveMarkdownFile();
		if (!activeFile || !fileHasRecipeTag(this.app, activeFile)) {
			return;
		}

		const fooderView = this.getFooderView();
		if (fooderView) {
			await fooderView.updateForFile(activeFile);
			return;
		}

		await this.syncFooderView();
	}

	private async activateFooderView(): Promise<void> {
		if (!this.fooderViewActivation) {
			this.fooderViewActivation = this.openFooderView().finally(() => {
				this.fooderViewActivation = null;
			});
		}

		await this.fooderViewActivation;
	}

	private async openFooderView(): Promise<void> {
		const { workspace } = this.app;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_FOODER);

		for (const duplicateLeaf of leaves.slice(1)) {
			duplicateLeaf.detach();
		}

		let leaf: WorkspaceLeaf | null = leaves[0] ?? null;

		if (!leaf) {
			leaf = workspace.getRightLeaf(false);
			if (!leaf) {
				return;
			}

			await leaf.setViewState({
				type: VIEW_TYPE_FOODER,
				active: true,
			});
		}

		void workspace.revealLeaf(leaf);
	}
}
