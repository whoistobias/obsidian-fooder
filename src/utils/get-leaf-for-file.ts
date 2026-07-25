import { App, FileView, TFile, WorkspaceLeaf } from 'obsidian';

export function getLeafForFile(app: App, file: TFile): WorkspaceLeaf | null {
	let match: WorkspaceLeaf | null = null;

	// Iterate through every active leaf in the workspace
	app.workspace.iterateAllLeaves((leaf) => {
		if (match) return;
		if (
			leaf.view instanceof FileView &&
			leaf.view.file?.path === file.path
		) {
			match = leaf;
		}
	});

	return match;
}
