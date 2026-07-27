import { App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type FooderPlugin from './main';
import {
    CALORIES_FRONTMATTER_KEY,
    CARBS_FRONTMATTER_KEY,
    FAT_FRONTMATTER_KEY,
    FIBER_FRONTMATTER_KEY,
    PROTEIN_FRONTMATTER_KEY,
    SERVING_SIZE_FRONTMATTER_KEY,
    SERVING_SIZE_UNIT_FRONTMATTER_KEY,
} from './types';

export interface FooderSettings {
    dailyCalorieTarget: number;
    dailyProteinTarget: number;
    dailyCarbsTarget: number;
    dailyFatTarget: number;
    servingSizeProperty: string;
    servingSizeUnitProperty: string;
    caloriesProperty: string;
    proteinProperty: string;
    carbsProperty: string;
    fatProperty: string;
    fiberProperty: string;
}

export const DEFAULT_SETTINGS: FooderSettings = {
    dailyCalorieTarget: 2000,
    dailyProteinTarget: 50,
    dailyCarbsTarget: 100,
    dailyFatTarget: 40,
    servingSizeProperty: SERVING_SIZE_FRONTMATTER_KEY,
    servingSizeUnitProperty: SERVING_SIZE_UNIT_FRONTMATTER_KEY,
    caloriesProperty: CALORIES_FRONTMATTER_KEY,
    proteinProperty: PROTEIN_FRONTMATTER_KEY,
    carbsProperty: CARBS_FRONTMATTER_KEY,
    fatProperty: FAT_FRONTMATTER_KEY,
    fiberProperty: FIBER_FRONTMATTER_KEY,
};

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
                heading: 'Custom property names',
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
                                ] as const;
                                for (const key of keys) {
                                    this.plugin.settings[key] =
                                        DEFAULT_SETTINGS[key];
                                }
                                await this.plugin.saveSettings();
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
                            placeholder: DEFAULT_SETTINGS.servingSizeProperty,
                            defaultValue: DEFAULT_SETTINGS.servingSizeProperty,
                            validate: validatePropertyName,
                        },
                    },
                    {
                        name: 'Calories',
                        desc: 'Frontmatter property name for calories in food notes.',
                        control: {
                            type: 'text' as const,
                            key: 'caloriesProperty',
                            placeholder: DEFAULT_SETTINGS.caloriesProperty,
                            defaultValue: DEFAULT_SETTINGS.caloriesProperty,
                            validate: validatePropertyName,
                        },
                    },
                    {
                        name: 'Protein',
                        desc: 'Frontmatter property name for protein in food notes.',
                        control: {
                            type: 'text' as const,
                            key: 'proteinProperty',
                            placeholder: DEFAULT_SETTINGS.proteinProperty,
                            defaultValue: DEFAULT_SETTINGS.proteinProperty,
                            validate: validatePropertyName,
                        },
                    },
                    {
                        name: 'Carbs',
                        desc: 'Frontmatter property name for carbs in food notes.',
                        control: {
                            type: 'text' as const,
                            key: 'carbsProperty',
                            placeholder: DEFAULT_SETTINGS.carbsProperty,
                            defaultValue: DEFAULT_SETTINGS.carbsProperty,
                            validate: validatePropertyName,
                        },
                    },
                    {
                        name: 'Fat',
                        desc: 'Frontmatter property name for fat in food notes.',
                        control: {
                            type: 'text' as const,
                            key: 'fatProperty',
                            placeholder: DEFAULT_SETTINGS.fatProperty,
                            defaultValue: DEFAULT_SETTINGS.fatProperty,
                            validate: validatePropertyName,
                        },
                    },
                    {
                        name: 'Fiber',
                        desc: 'Frontmatter property name for fiber in food notes.',
                        control: {
                            type: 'text' as const,
                            key: 'fiberProperty',
                            placeholder: DEFAULT_SETTINGS.fiberProperty,
                            defaultValue: DEFAULT_SETTINGS.fiberProperty,
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
                ],
            },
        ];
    }

    async setControlValue(key: string, value: unknown): Promise<void> {
        await super.setControlValue(key, value);
        await this.plugin.refreshFooderViews();
    }
}
