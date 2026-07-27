import { App } from 'obsidian';

/** @see https://github.com/Fevol/obsidian-typings — undocumented internal API */
export type PropertyWidgetType =
    | 'aliases'
    | 'checkbox'
    | 'date'
    | 'datetime'
    | 'multitext'
    | 'number'
    | 'tags'
    | 'text';

/** @see https://github.com/Fevol/obsidian-typings — undocumented internal API */
export interface PropertyInfo {
    name: string;
    widget: PropertyWidgetType;
    occurrences: number;
}

/** @see https://github.com/Fevol/obsidian-typings — undocumented internal API */
export interface MetadataTypeManager {
    app: App;
    properties: Record<string, PropertyInfo>;
    types: Record<string, PropertyWidgetType>;
    getAllProperties(): Record<string, PropertyInfo>;
    getAssignedType(property: string): PropertyWidgetType | null;
    getPropertyInfo(property: string): PropertyInfo;
    getTypes(): string[];
    setType(property: string, type: PropertyWidgetType): void;
    unsetType(property: string): void;
}

declare module 'obsidian' {
    interface App {
        metadataTypeManager: MetadataTypeManager;
    }
}
