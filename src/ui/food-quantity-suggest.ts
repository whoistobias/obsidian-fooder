import {
    EditorSuggest,
    type Editor,
    type EditorPosition,
    type EditorSuggestContext,
    type EditorSuggestTriggerInfo,
    setIcon,
    type TFile,
} from 'obsidian';
import type FooderPlugin from '../main';
import { isFoodFile, isRecipeFile } from '../utils/file-classification';

const WIKILINK_QUANTITY_PATTERN = /\[\[([^\]]+)\]\](?!\s)([^[]*)$/;

function parseWikilinkContent(linkContent: string): {
    target: string;
    alias?: string;
} {
    const pipeIndex = linkContent.indexOf('|');
    if (pipeIndex === -1) {
        return { target: linkContent };
    }

    return {
        target: linkContent.slice(0, pipeIndex),
        alias: linkContent.slice(pipeIndex + 1),
    };
}

interface FoodSuggestion {
    title: string;
    note: string;
    titleMuted: boolean;
}

export class FoodQuantitySuggest extends EditorSuggest<FoodSuggestion> {
    private linkedFile: TFile | null = null;
    private linkText: string | null = null;
    private linkAlias: string | null = null;

    constructor(private plugin: FooderPlugin) {
        super(plugin.app);
    }

    onTrigger(
        cursor: EditorPosition,
        editor: Editor,
        file: TFile | null,
    ): EditorSuggestTriggerInfo | null {
        this.linkedFile = null;
        this.linkText = null;
        this.linkAlias = null;

        if (!file) return null;

        const line = editor.getLine(cursor.line);

        const before = line.slice(0, cursor.ch);
        const match = before.match(WIKILINK_QUANTITY_PATTERN);
        if (!match?.[1]) {
            return null;
        }

        const { target: linkText, alias: linkAlias } = parseWikilinkContent(
            match[1],
        );
        const dest = this.app.metadataCache.getFirstLinkpathDest(
            linkText,
            file.path,
        );
        if (!dest) {
            return null;
        }

        const cache = this.app.metadataCache.getFileCache(dest);
        if (!cache) {
            return null;
        }

        const { settings } = this.plugin;
        if (
            !isFoodFile(this.app, dest, cache, settings) &&
            !isRecipeFile(this.app, dest, cache, settings)
        ) {
            return null;
        }

        this.linkedFile = dest;
        this.linkText = linkText;
        this.linkAlias = linkAlias ?? null;

        return {
            start: { line: cursor.line, ch: match.index || 0 },
            end: cursor,
            query: match[2] ?? '',
        };
    }

    getSuggestions(context: EditorSuggestContext): FoodSuggestion[] {
        if (!this.linkedFile || !this.linkText) {
            return [];
        }

        const displayName = this.linkAlias ?? this.linkText;

        if (!context.query) {
            return [
                {
                    title: 'Amount',
                    note: displayName,
                    titleMuted: true,
                },
            ];
        }

        return [
            {
                title: context.query,
                note: displayName,
                titleMuted: false,
            },
        ];
    }

    renderSuggestion(item: FoodSuggestion, el: HTMLElement): void {
        el.addClass('mod-complex');

        const content = el.createDiv({ cls: 'suggestion-content' });
        const titleEl = content.createDiv({
            cls: 'suggestion-title',
            text: item.title,
        });
        if (item.titleMuted) {
            titleEl.addClass('text-muted');
        }
        content.createDiv({ cls: 'suggestion-note', text: item.note });

        const aux = el.createDiv({ cls: 'suggestion-aux' });
        const flair = aux.createDiv({ cls: 'suggestion-flair' });
        setIcon(flair, 'arrow-up-right');
    }

    selectSuggestion(
        _value: FoodSuggestion,
        _evt: MouseEvent | KeyboardEvent,
    ): void {
        const context = this.context;
        if (!context || !this.linkText || !context.query) {
            return;
        }

        const nameForAlias = this.linkAlias ?? this.linkText;
        const alias = `${context.query} ${nameForAlias}`;
        const replacement = `[[${this.linkText}|${alias}]]`;

        context.editor.replaceRange(replacement, context.start, context.end);
    }
}
