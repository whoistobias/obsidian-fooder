import { App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type FooderPlugin from './main';
import { AddTagModal } from './ui/add-tag-modal';
import { AddWatchedFolderModal } from './ui/add-watched-folder-modal';
import { formatTagForDisplay } from './utils/tags';
import {
    CALORIES_FRONTMATTER_KEY,
    CARBS_FRONTMATTER_KEY,
    FAT_FRONTMATTER_KEY,
    FIBER_FRONTMATTER_KEY,
    PROTEIN_FRONTMATTER_KEY,
    SERVING_SIZE_FRONTMATTER_KEY,
    SERVING_SIZE_UNIT_FRONTMATTER_KEY,
    YIELD_FRONTMATTER_KEY,
    YIELD_UNIT_FRONTMATTER_KEY,
} from './types';

export interface FooderSettings {
    dailyCalorieTarget: number;
    dailyProteinTarget: number;
    dailyCarbsTarget: number;
    dailyFatTarget: number;
    nutritionFolders: string[];
    nutritionTags: string[];
    foodFolders: string[];
    foodTags: string[];
    recipeFolders: string[];
    recipeTags: string[];
    servingSizeProperty: string;
    servingSizeUnitProperty: string;
    caloriesProperty: string;
    proteinProperty: string;
    carbsProperty: string;
    fatProperty: string;
    fiberProperty: string;
    yieldProperty: string;
    yieldUnitProperty: string;
}

export const DEFAULT_SETTINGS: FooderSettings = {
    dailyCalorieTarget: 2000,
    dailyProteinTarget: 50,
    dailyCarbsTarget: 100,
    dailyFatTarget: 40,
    nutritionFolders: ['Daily'],
    nutritionTags: ['macros', 'fooder'],
    foodFolders: [],
    foodTags: ['food'],
    recipeFolders: [],
    recipeTags: ['recipe'],
    servingSizeProperty: SERVING_SIZE_FRONTMATTER_KEY,
    servingSizeUnitProperty: SERVING_SIZE_UNIT_FRONTMATTER_KEY,
    caloriesProperty: CALORIES_FRONTMATTER_KEY,
    proteinProperty: PROTEIN_FRONTMATTER_KEY,
    carbsProperty: CARBS_FRONTMATTER_KEY,
    fatProperty: FAT_FRONTMATTER_KEY,
    fiberProperty: FIBER_FRONTMATTER_KEY,
    yieldProperty: YIELD_FRONTMATTER_KEY,
    yieldUnitProperty: YIELD_UNIT_FRONTMATTER_KEY,
};
//
function validatePropertyName(value: string): string | void {
    if (!/^[a-zA-Z_][a-zA-Z0-9_ -]*$/.test(value)) {
        return 'Use letters, digits, dashes, spaces, and underscores. Start with a letter or underscore.';
    }
}

export class FooderSettingTab extends PluginSettingTab {
    plugin: FooderPlugin;

    constructor(app: App, plugin: FooderPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    getSettingDefinitions(): SettingDefinitionItem[] {
        const nutritionFolders = this.plugin.settings.nutritionFolders;
        const nutritionTags = this.plugin.settings.nutritionTags;
        const foodFolders = this.plugin.settings.foodFolders;
        const foodTags = this.plugin.settings.foodTags;
        const recipeFolders = this.plugin.settings.recipeFolders;
        const recipeTags = this.plugin.settings.recipeTags;

        return [
            {
                name: 'Calorie target',
                desc: 'Target calories for each day.',
                control: {
                    type: 'number' as const,
                    key: 'dailyCalorieTarget',
                    min: 0,
                },
            },
            {
                name: 'Protein target',
                desc: 'Target protein in grams for each day.',
                control: {
                    type: 'number' as const,
                    key: 'dailyProteinTarget',
                    min: 0,
                },
            },
            {
                name: 'Carbs target',
                desc: 'Target carbohydrates in grams for each day.',
                control: {
                    type: 'number' as const,
                    key: 'dailyCarbsTarget',
                    min: 0,
                },
            },
            {
                name: 'Fat target',
                desc: 'Target fat in grams for each day.',
                control: {
                    type: 'number' as const,
                    key: 'dailyFatTarget',
                    min: 0,
                },
            },
            {
                type: 'group',
                heading: 'Advanced',
                items: [
                    {
                        type: 'page',
                        name: 'Tags and folders',
                        desc: 'Change what Fooder interprets as food, recipes, and notes to calculate nutrition in.',
                        items: [
                            {
                                type: 'group',
                                heading: 'Nutrition',
                                items: [
                                    {
                                        type: 'page',
                                        name: 'Nutrition tags',
                                        desc: 'Notes with these tags will have nutrition calculated automatically.',
                                        items: [
                                            {
                                                type: 'list',
                                                emptyState:
                                                    'No nutrition tags yet.',
                                                addItem: {
                                                    name: 'Add tag',
                                                    action: () => {
                                                        new AddTagModal(
                                                            this.app,
                                                            nutritionTags,
                                                            (tag) => {
                                                                nutritionTags.push(
                                                                    tag,
                                                                );
                                                                void this.plugin
                                                                    .saveSettings()
                                                                    .then(
                                                                        async () => {
                                                                            await this.plugin.onSettingsChanged();
                                                                            this.update();
                                                                        },
                                                                    );
                                                            },
                                                        ).open();
                                                    },
                                                },
                                                onDelete: (index: number) => {
                                                    nutritionTags.splice(
                                                        index,
                                                        1,
                                                    );
                                                    void this.plugin
                                                        .saveSettings()
                                                        .then(async () => {
                                                            await this.plugin.onSettingsChanged();
                                                            this.update();
                                                        });
                                                },
                                                items: nutritionTags.map(
                                                    (tag) => ({
                                                        name: formatTagForDisplay(
                                                            tag,
                                                        ),
                                                        searchable: false,
                                                    }),
                                                ),
                                            },
                                        ],
                                    },
                                    {
                                        type: 'page',
                                        name: 'Nutrition folders',
                                        desc: 'Folders whose notes get nutrition calculated automatically.',
                                        items: [
                                            {
                                                type: 'list',
                                                emptyState:
                                                    'No nutrition folders yet.',
                                                addItem: {
                                                    name: 'Add folder',
                                                    action: () => {
                                                        new AddWatchedFolderModal(
                                                            this.app,
                                                            nutritionFolders,
                                                            (path) => {
                                                                nutritionFolders.push(
                                                                    path,
                                                                );
                                                                void this.plugin
                                                                    .saveSettings()
                                                                    .then(
                                                                        async () => {
                                                                            await this.plugin.onSettingsChanged();
                                                                            this.update();
                                                                        },
                                                                    );
                                                            },
                                                        ).open();
                                                    },
                                                },
                                                onDelete: (index: number) => {
                                                    nutritionFolders.splice(
                                                        index,
                                                        1,
                                                    );
                                                    void this.plugin
                                                        .saveSettings()
                                                        .then(async () => {
                                                            await this.plugin.onSettingsChanged();
                                                            this.update();
                                                        });
                                                },
                                                items: nutritionFolders.map(
                                                    (path) => ({
                                                        name: path || '/',
                                                        searchable: false,
                                                    }),
                                                ),
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: 'group',
                                heading: 'Food',
                                items: [
                                    {
                                        type: 'page',
                                        name: 'Food tags',
                                        desc: 'Notes with these tags will be considered foods.',
                                        items: [
                                            {
                                                type: 'list',
                                                emptyState: 'No food tags yet.',
                                                addItem: {
                                                    name: 'Add tag',
                                                    action: () => {
                                                        new AddTagModal(
                                                            this.app,
                                                            foodTags,
                                                            (tag) => {
                                                                foodTags.push(
                                                                    tag,
                                                                );
                                                                void this.plugin
                                                                    .saveSettings()
                                                                    .then(
                                                                        async () => {
                                                                            await this.plugin.onSettingsChanged();
                                                                            this.update();
                                                                        },
                                                                    );
                                                            },
                                                        ).open();
                                                    },
                                                },
                                                onDelete: (index: number) => {
                                                    foodTags.splice(index, 1);
                                                    void this.plugin
                                                        .saveSettings()
                                                        .then(async () => {
                                                            await this.plugin.onSettingsChanged();
                                                            this.update();
                                                        });
                                                },
                                                items: foodTags.map((tag) => ({
                                                    name: formatTagForDisplay(
                                                        tag,
                                                    ),
                                                    searchable: false,
                                                })),
                                            },
                                        ],
                                    },
                                    {
                                        type: 'page',
                                        name: 'Food folders',
                                        desc: 'Folders whose notes are treated as foods.',
                                        items: [
                                            {
                                                type: 'list',
                                                emptyState:
                                                    'No food folders yet.',
                                                addItem: {
                                                    name: 'Add folder',
                                                    action: () => {
                                                        new AddWatchedFolderModal(
                                                            this.app,
                                                            foodFolders,
                                                            (path) => {
                                                                foodFolders.push(
                                                                    path,
                                                                );
                                                                void this.plugin
                                                                    .saveSettings()
                                                                    .then(
                                                                        async () => {
                                                                            await this.plugin.onSettingsChanged();
                                                                            this.update();
                                                                        },
                                                                    );
                                                            },
                                                        ).open();
                                                    },
                                                },
                                                onDelete: (index: number) => {
                                                    foodFolders.splice(
                                                        index,
                                                        1,
                                                    );
                                                    void this.plugin
                                                        .saveSettings()
                                                        .then(async () => {
                                                            await this.plugin.onSettingsChanged();
                                                            this.update();
                                                        });
                                                },
                                                items: foodFolders.map(
                                                    (path) => ({
                                                        name: path || '/',
                                                        searchable: false,
                                                    }),
                                                ),
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: 'group',
                                heading: 'Recipes',
                                items: [
                                    {
                                        type: 'page',
                                        name: 'Recipe tags',
                                        desc: 'Notes with these tags are considered recipes.',
                                        items: [
                                            {
                                                type: 'list',
                                                emptyState:
                                                    'No recipe tags yet.',
                                                addItem: {
                                                    name: 'Add tag',
                                                    action: () => {
                                                        new AddTagModal(
                                                            this.app,
                                                            recipeTags,
                                                            (tag) => {
                                                                recipeTags.push(
                                                                    tag,
                                                                );
                                                                void this.plugin
                                                                    .saveSettings()
                                                                    .then(
                                                                        async () => {
                                                                            await this.plugin.onSettingsChanged();
                                                                            this.update();
                                                                        },
                                                                    );
                                                            },
                                                        ).open();
                                                    },
                                                },
                                                onDelete: (index: number) => {
                                                    recipeTags.splice(index, 1);
                                                    void this.plugin
                                                        .saveSettings()
                                                        .then(async () => {
                                                            await this.plugin.onSettingsChanged();
                                                            this.update();
                                                        });
                                                },
                                                items: recipeTags.map(
                                                    (tag) => ({
                                                        name: formatTagForDisplay(
                                                            tag,
                                                        ),
                                                        searchable: false,
                                                    }),
                                                ),
                                            },
                                        ],
                                    },
                                    {
                                        type: 'page',
                                        name: 'Recipe folders',
                                        desc: 'Folders whose notes are treated as recipes.',
                                        items: [
                                            {
                                                type: 'list',
                                                emptyState:
                                                    'No recipe folders yet.',
                                                addItem: {
                                                    name: 'Add folder',
                                                    action: () => {
                                                        new AddWatchedFolderModal(
                                                            this.app,
                                                            recipeFolders,
                                                            (path) => {
                                                                recipeFolders.push(
                                                                    path,
                                                                );
                                                                void this.plugin
                                                                    .saveSettings()
                                                                    .then(
                                                                        async () => {
                                                                            await this.plugin.onSettingsChanged();
                                                                            this.update();
                                                                        },
                                                                    );
                                                            },
                                                        ).open();
                                                    },
                                                },
                                                onDelete: (index: number) => {
                                                    recipeFolders.splice(
                                                        index,
                                                        1,
                                                    );
                                                    void this.plugin
                                                        .saveSettings()
                                                        .then(async () => {
                                                            await this.plugin.onSettingsChanged();
                                                            this.update();
                                                        });
                                                },
                                                items: recipeFolders.map(
                                                    (path) => ({
                                                        name: path || '/',
                                                        searchable: false,
                                                    }),
                                                ),
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'page',
                        name: 'Custom frontmatter',
                        desc: 'Customize property names used for nutrition data in food notes and bases.',
                        items: [
                            {
                                type: 'group',
                                extraButtons: [
                                    (button) =>
                                        button
                                            .setIcon('lucide-rotate-ccw')
                                            .setTooltip('Reset to defaults')
                                            .onClick(async () => {
                                                const keys = [
                                                    'servingSizeProperty',
                                                    'caloriesProperty',
                                                    'proteinProperty',
                                                    'carbsProperty',
                                                    'fatProperty',
                                                    'fiberProperty',
                                                    'servingSizeUnitProperty',
                                                    'yieldProperty',
                                                    'yieldUnitProperty',
                                                ] as const;
                                                for (const key of keys) {
                                                    this.plugin.settings[key] =
                                                        DEFAULT_SETTINGS[key];
                                                }
                                                await this.plugin.saveSettings();
                                                await this.plugin.onSettingsChanged();
                                                this.update();
                                            }),
                                ],
                                items: [
                                    {
                                        name: 'Serving size',
                                        desc: 'Frontmatter property name for serving size in food notes.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'servingSizeProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.servingSizeProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.servingSizeProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Calories',
                                        desc: 'Frontmatter property name for calories in food notes.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'caloriesProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.caloriesProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.caloriesProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Protein',
                                        desc: 'Frontmatter property name for protein in food notes.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'proteinProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.proteinProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.proteinProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Carbs',
                                        desc: 'Frontmatter property name for carbs in food notes.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'carbsProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.carbsProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.carbsProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Fat',
                                        desc: 'Frontmatter property name for fat in food notes.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'fatProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.fatProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.fatProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Fiber',
                                        desc: 'Frontmatter property name for fiber in food notes.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'fiberProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.fiberProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.fiberProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Serving size unit',
                                        desc: 'Frontmatter property name for serving size unit in food notes.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'servingSizeUnitProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.servingSizeUnitProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.servingSizeUnitProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Yield',
                                        desc: 'Frontmatter property name for recipe batch yield.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'yieldProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.yieldProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.yieldProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                    {
                                        name: 'Yield unit',
                                        desc: 'Frontmatter property name for recipe yield unit.',
                                        control: {
                                            type: 'text' as const,
                                            key: 'yieldUnitProperty',
                                            placeholder:
                                                DEFAULT_SETTINGS.yieldUnitProperty,
                                            defaultValue:
                                                DEFAULT_SETTINGS.yieldUnitProperty,
                                            validate: validatePropertyName,
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        await super.setControlValue(key, value);
        await this.plugin.onSettingsChanged();
    }
}
