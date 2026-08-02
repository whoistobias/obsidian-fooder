import { App, Modal, Notice, Setting } from 'obsidian';
import { normalizeTag, validateTag } from '../utils/tags';

export class AddTagModal extends Modal {
    private tag = '';

    constructor(
        app: App,
        private existingTags: string[],
        private onAdd: (tag: string) => void,
    ) {
        super(app);
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        this.setTitle('Add tag');

        new Setting(contentEl)
            .setName('Tag')
            .setDesc('Example: recipe')
            .addText((text) => {
                text.setPlaceholder('Recipe').onChange((value) => {
                    this.tag = value;
                });
                text.inputEl.addEventListener('keydown', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        this.submit();
                    }
                });
            });

        new Setting(contentEl).addButton((button) =>
            button
                .setButtonText('Add')
                .setCta()
                .onClick(() => {
                    this.submit();
                }),
        );
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private submit(): void {
        const normalized = normalizeTag(this.tag);
        const error = validateTag(normalized);
        if (error) {
            new Notice(error);
            return;
        }

        const stored = normalized.slice(1);
        if (this.existingTags.includes(stored)) {
            new Notice('That tag is already in the list.');
            return;
        }

        this.onAdd(stored);
        this.close();
    }
}
