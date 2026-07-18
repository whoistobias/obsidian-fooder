import { App, PluginSettingTab, Setting } from 'obsidian';
import type FooderPlugin from './main';

export interface FooderSettings {
	dailyCalorieGoal: number;
}

export const DEFAULT_SETTINGS: FooderSettings = {
	dailyCalorieGoal: 2000,
};

export class FooderSettingTab extends PluginSettingTab {
	plugin: FooderPlugin;

	constructor(app: App, plugin: FooderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Daily calorie goal')
			.setDesc('Target calories for each day.')
			.addText((text) =>
				text
					.setPlaceholder(String(DEFAULT_SETTINGS.dailyCalorieGoal))
					.setValue(String(this.plugin.settings.dailyCalorieGoal))
					.onChange(async (value) => {
						const parsed = Number(value);
						if (!Number.isFinite(parsed) || parsed <= 0) {
							return;
						}

						this.plugin.settings.dailyCalorieGoal = parsed;
						await this.plugin.saveSettings();
						this.plugin.updateFooderViewsSettings();
					}),
			);
	}
}
