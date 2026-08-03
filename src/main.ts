import { MarkdownView, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { ensureFoodBase } from './base/food-base';
import {
    DEFAULT_SETTINGS,
    FooderSettingTab,
    type FooderSettings,
} from './settings';
import './styles.css';
import { FooderView, VIEW_TYPE_FOODER } from './ui/macros-view';
import { FoodQuantitySuggest } from './ui/food-quantity-suggest';
import { getLeafForFile } from './utils/get-leaf-for-file';
import { isFoodFile, isMacroViewFile } from './utils/file-classification';

export default class FooderPlugin extends Plugin {
    settings!: FooderSettings;
    private fooderViewActivation: Promise<void> | null = null;

    async onload() {
        await this.loadSettings();

        this.registerView(
            VIEW_TYPE_FOODER,
            (leaf) => new FooderView(leaf, this),
        );

        await this.reconcileExistingFooderLeaves();

        this.registerEvent(
            this.app.workspace.on('file-open', () => {
                void this.syncFooderView();
            }),
        );

        this.registerEvent(
            this.app.metadataCache.on('changed', (file) => {
                void this.refreshFooderViewIfActive(file);
            }),
        );

        this.registerEvent(
            this.app.metadataCache.on('resolved', () => {
                void this.syncFooderView();
            }),
        );

        this.addCommand({
            id: 'show-linked-foods',
            name: 'Show linked foods',
            callback: () => {
                void this.ensureFooderView();
            },
        });

        this.addCommand({
            id: 'show-macros',
            name: 'Show macros',
            callback: () => {
                void this.openMacrosView();
            },
        });

        this.addCommand({
            id: 'setup-food-base',
            name: 'Set up food base',
            callback: async () => {
                const base = await ensureFoodBase(this.app, this.settings);
                if (!base) return;

                let leaf = getLeafForFile(this.app, base);

                if (leaf) {
                    this.app.workspace.setActiveLeaf(leaf, { focus: true });
                    return;
                }

                leaf = this.app.workspace.getMostRecentLeaf();
                if (leaf === null) {
                    leaf = this.app.workspace.getLeaf();
                }
                await leaf.openFile(base);
            },
        });

        this.registerEditorSuggest(new FoodQuantitySuggest(this));

        this.addSettingTab(new FooderSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            void this.syncFooderView();
        });

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

    getActiveFooderFile(): TFile | null {
        const file = this.getActiveMarkdownFile();
        if (!file) {
            return null;
        }
        const cache = this.app.metadataCache.getFileCache(file);
        if (!cache) {
            return null;
        }
        if (!isMacroViewFile(this.app, file, cache, this.settings)) {
            return null;
        }

        return file;
    }

    async onSettingsChanged(): Promise<void> {
        this.updateFooderViewsSettings();
        await this.syncFooderView();
    }

    async populateFooderView(view: FooderView): Promise<void> {
        await view.updateForFile(this.getActiveFooderFile());
    }

    updateFooderViewsSettings(): void {
        for (const view of this.getFooderViews()) {
            view.updateSettings(this.settings);
        }
    }

    async refreshFooderViews(): Promise<void> {
        const file = this.getActiveFooderFile();

        for (const view of this.getFooderViews()) {
            await view.updateForFile(file, { force: true });
        }
    }

    private getActiveMarkdownFile(): TFile | null {
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile?.extension === 'md') {
            return activeFile;
        }

        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        return view?.file ?? null;
    }

    private getFooderViews(): FooderView[] {
        return this.app.workspace
            .getLeavesOfType(VIEW_TYPE_FOODER)
            .map((leaf) => leaf.view)
            .filter((view): view is FooderView => this.isFooderView(view));
    }

    private isFooderView(view: unknown): view is FooderView {
        if (typeof view !== 'object' || view === null) {
            return false;
        }

        const candidate = view as FooderView;
        return (
            typeof candidate.getViewType === 'function' &&
            candidate.getViewType() === VIEW_TYPE_FOODER &&
            typeof candidate.updateForFile === 'function' &&
            typeof candidate.updateSettings === 'function'
        );
    }

    private getFooderView(): FooderView | null {
        return this.getFooderViews()[0] ?? null;
    }

    private async reconcileExistingFooderLeaves(): Promise<void> {
        for (const leaf of this.app.workspace.getLeavesOfType(
            VIEW_TYPE_FOODER,
        )) {
            await leaf.setViewState({ type: 'empty' });
            await leaf.setViewState({
                type: VIEW_TYPE_FOODER,
                active: false,
            });
        }
    }

    private async syncFooderView(): Promise<void> {
        const file = this.getActiveFooderFile();
        if (file) {
            await this.ensureFooderView();
        }

        for (const view of this.getFooderViews()) {
            await view.updateForFile(file);
        }
    }

    private async refreshFooderViewIfActive(
        modifiedFile: TFile,
    ): Promise<void> {
        const activeFile = this.getActiveFooderFile();
        if (!activeFile) {
            return;
        }

        if (
            modifiedFile.path !== activeFile.path &&
            !this.recipeLinksFoodFile(activeFile, modifiedFile)
        ) {
            return;
        }

        const fooderView = this.getFooderView();
        if (fooderView) {
            await fooderView.updateForFile(activeFile, { force: true });
            return;
        }

        await this.syncFooderView();
    }

    private recipeLinksFoodFile(recipeFile: TFile, linkedFile: TFile): boolean {
        const linkedFileCache = this.app.metadataCache.getFileCache(linkedFile);
        if (
            !linkedFileCache ||
            !isFoodFile(this.app, linkedFile, linkedFileCache, this.settings)
        ) {
            return false;
        }

        const recipeCache = this.app.metadataCache.getFileCache(recipeFile);
        if (!recipeCache?.links) {
            return false;
        }

        return recipeCache.links.some((link) => {
            const destination = this.app.metadataCache.getFirstLinkpathDest(
                link.link,
                recipeFile.path,
            );
            return destination?.path === linkedFile.path;
        });
    }

    private async ensureFooderView(): Promise<void> {
        if (!this.fooderViewActivation) {
            this.fooderViewActivation = this.createFooderViewLeaf().finally(
                () => {
                    this.fooderViewActivation = null;
                },
            );
        }

        await this.fooderViewActivation;
    }

    private async openMacrosView(): Promise<void> {
        await this.ensureFooderView();

        const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_FOODER)[0];
        if (leaf) {
            void this.app.workspace.revealLeaf(leaf);
        }
    }

    private async createFooderViewLeaf(): Promise<void> {
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
                active: false,
            });
        } else if (leaf.view.getViewType() !== VIEW_TYPE_FOODER) {
            await leaf.setViewState({
                type: VIEW_TYPE_FOODER,
                active: false,
            });
        }
    }
}
