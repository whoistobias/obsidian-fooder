import type { HeadingCache, ListItemCache, Pos } from 'obsidian';
import { getHeadingsForPosition } from './get-headings-for-position';
import { getListAncestorsForPostition } from './get-list-ancestors-for-position';

export function collectLinkAncestorLines(
    linkPosition: Pos,
    listItems: ListItemCache[] | undefined,
    headings: HeadingCache[] | undefined,
): number[] {
    const ancestorLineNumbers: number[] = [];

    if (listItems) {
        for (const listAncestor of getListAncestorsForPostition(
            listItems,
            linkPosition,
        )) {
            ancestorLineNumbers.push(listAncestor.position.start.line);
        }
    }

    if (headings) {
        for (const heading of getHeadingsForPosition(headings, linkPosition)) {
            ancestorLineNumbers.push(heading.position.start.line);
        }
    }

    return ancestorLineNumbers;
}
