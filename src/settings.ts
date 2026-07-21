import { App, PluginSettingTab, type SettingDefinitionItem } from 'obsidian';
import type FooderPlugin from './main';

export interface FooderSettings {
	dailyCalorieTarget: number;
	dailyProteinTarget: number;
	dailyCarbsTarget: number;
	dailyFatTarget: number;
}

export const DEFAULT_SETTINGS: FooderSettings = {
	dailyCalorieTarget: 2000,
	dailyProteinTarget: 50,
	dailyCarbsTarget: 100,
	dailyFatTarget: 40,
};

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
		];
	}
}
