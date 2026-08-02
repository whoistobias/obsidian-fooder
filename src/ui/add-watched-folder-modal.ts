import {
	App,
	FuzzySuggestModal,
	normalizePath,
	type TFolder,
} from 'obsidian';

export class AddWatchedFolderModal extends FuzzySuggestModal<TFolder> {
	constructor(
		app: App,
		private existingPaths: string[],
		private onChoose: (path: string) => void,
	) {
		super(app);
		this.setPlaceholder('Pick a folder');
		this.setTitle('Add watched folder');
	}

	getItems(): TFolder[] {
		return this.app.vault.getAllFolders(true);
	}

	getItemText(item: TFolder): string {
		return item.path || '/';
	}

	onChooseItem(item: TFolder, _evt: MouseEvent | KeyboardEvent): void {
		const path = normalizePath(item.path);
		if (this.existingPaths.includes(path)) {
			return;
		}

		this.onChoose(path);
	}
}
