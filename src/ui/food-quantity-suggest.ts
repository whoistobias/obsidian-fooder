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
import {
    formatCustomUnitNote,
    parseCustomUnits,
    splitQuantityQuery,
    suggestUnitRows,
} from '../utils/custom-units';
import { isFoodFile, isRecipeFile } from '../utils/file-classification';
import { aliasHasExplicitQuantity } from '../utils/parse-quantity';

const WIKILINK_QUANTITY_PATTERN = /\[\[([^\]]+)\]\](?!\s)([^[]*)$/;

/** Dismiss when user typed a trailing space, except `2 `-style in-progress amounts. */
function shouldDismissQuantityQuery(query: string): boolean {
    if (!query.endsWith(' ')) {
        return false;
    }

    return !/^(\d+\s*\/\s*\d+|\d+\.\d*|\d+)\s+$/.test(query);
}

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
    /** Text inserted before the food name. Omitted for the empty-query placeholder. */
    aliasPrefix?: string;
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
        const query = match[2] ?? '';

        if (aliasHasExplicitQuantity(linkAlias)) {
            return null;
        }

        if (shouldDismissQuantityQuery(query)) {
            return null;
        }

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
            query,
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

        const query = splitQuantityQuery(context.query);
        if (!query) {
            return [
                {
                    title: context.query,
                    note: displayName,
                    titleMuted: false,
                    aliasPrefix: context.query,
                },
            ];
        }

        const cache = this.app.metadataCache.getFileCache(this.linkedFile);
        const customUnits = parseCustomUnits(
            cache?.frontmatter ?? {},
            this.plugin.settings.unitsProperty,
        );
        const rows = suggestUnitRows(customUnits, query.fragment);
        const suggestions: FoodSuggestion[] = [];

        if (!query.fragment) {
            suggestions.push({
                title: query.amountText,
                note: displayName,
                titleMuted: false,
                aliasPrefix: query.amountText,
            });
        }

        if (rows.grams) {
            const gramsLabel = `${query.amountText}${rows.grams.key}`;
            suggestions.push({
                title: gramsLabel,
                note: formatCustomUnitNote(rows.grams),
                titleMuted: false,
                aliasPrefix: gramsLabel,
            });
        } else if (rows.showDefaultGrams) {
            const gramsLabel = `${query.amountText}g`;
            suggestions.push({
                title: gramsLabel,
                note: 'grams',
                titleMuted: false,
                aliasPrefix: gramsLabel,
            });
        }

        for (const unit of rows.custom) {
            suggestions.push({
                title: `${query.amountText} ${unit.key}`,
                note: formatCustomUnitNote(unit),
                titleMuted: false,
                aliasPrefix: `${query.amountText} ${unit.key}`,
            });
        }

        return suggestions;
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
        value: FoodSuggestion,
        evt: MouseEvent | KeyboardEvent,
    ): void {
        const context = this.context;
        if (!context || !this.linkText) {
            return;
        }

        if (value.aliasPrefix === undefined) {
            if (evt instanceof KeyboardEvent && evt.key === 'Enter') {
                this.close();
                context.editor.replaceRange('\n', context.end);
            }
            return;
        }

        const nameForAlias = this.linkAlias ?? this.linkText;
        const alias = `${value.aliasPrefix} ${nameForAlias}`;
        const replacement = `[[${this.linkText}|${alias}]]`;

        context.editor.replaceRange(replacement, context.start, context.end);
    }
}
