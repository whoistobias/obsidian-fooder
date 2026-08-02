import { getAllTags, type CachedMetadata } from 'obsidian';

export function normalizeTag(tag: string): string {
    const trimmed = tag.trim();
    if (!trimmed) {
        return '';
    }

    return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export function formatTagForDisplay(tag: string): string {
    return normalizeTag(tag);
}

export function validateTag(tag: string): string | void {
    if (!tag) {
        return 'Enter a tag.';
    }

    if (/\s/.test(tag)) {
        return 'Tags cannot contain spaces.';
    }
}

export function fileHasTag(file_cache: CachedMetadata, tag: string): boolean {
    const tags = getAllTags(file_cache);
    if (!tags) {
        return false;
    }
    return tags.some((v) => v === normalizeTag(tag));
}

export function fileHasAnyTag(
    file_cache: CachedMetadata,
    tags: string[],
): boolean {
    const file_tags = getAllTags(file_cache);
    if (!file_tags) {
        return false;
    }
    return tags.some((tag) =>
        file_tags.some((file_tag) => file_tag === normalizeTag(tag)),
    );
}
