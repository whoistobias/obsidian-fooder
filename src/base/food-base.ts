import { App, Notice, TFile } from 'obsidian';
import { type FooderSettings } from '../settings';
import { FOOD_TAG } from '../utils/food';

export const FOOD_BASE_PATH = 'Foods.base';

export function buildFoodBaseContent(settings: FooderSettings): string {
    return `filters:
  and:
    - file.hasTag("${FOOD_TAG}")

properties:
  note.${settings.caloriesProperty}:
    displayName: Calories
  note.${settings.proteinProperty}:
    displayName: Protein
  note.${settings.carbsProperty}:
    displayName: Carbs
  note.${settings.fatProperty}:
    displayName: Fat
  note.${settings.fiberProperty}:
    displayName: Fiber
  note.${settings.servingSizeProperty}:
    displayName: Serving size

views:
  - type: table
    name: "All foods"
    order:
      - file.name
      - ${settings.caloriesProperty}
      - ${settings.proteinProperty}
      - ${settings.carbsProperty}
      - ${settings.fatProperty}
      - ${settings.fiberProperty}
      - ${settings.servingSizeProperty}
`;
}

export async function ensureFoodBase(
    app: App,
    settings: FooderSettings,
): Promise<TFile | void> {
    const existing = app.vault.getAbstractFileByPath(FOOD_BASE_PATH);
    const result = initializeTypes(app, settings);

    if (typeof result === 'string') {
        new Notice(result, 0);
        return;
    }

    if (existing instanceof TFile) {
        new Notice('Food base already exists.');
        return existing;
    }

    const file = await app.vault.create(
        FOOD_BASE_PATH,
        buildFoodBaseContent(settings),
    );
    new Notice('Created food base.');
    return file;
}

function initializeTypes(app: App, settings: FooderSettings): void | string {
    const numberFields = [
        settings.servingSizeProperty,
        settings.caloriesProperty,
        settings.carbsProperty,
        settings.fatProperty,
        settings.fiberProperty,
        settings.proteinProperty,
    ];
    const textFields = [settings.servingSizeUnitProperty];
    const properties = app.metadataTypeManager?.getAllProperties();
    if (properties == null) return;
    for (const field of numberFields) {
        if (field in properties) {
            if (properties[field]?.widget !== 'number') {
                return `Property "${field}" is not a number property. Change the type in your vault, or change the property name in the Fooder settings.`;
            }
        }
    }
    for (const field of textFields) {
        if (field in properties) {
            if (properties[field]?.widget !== 'text') {
                return `Property "${field}" is not a text property. Change the type in your vault, or change the property name in the Fooder settings.`;
            }
        }
    }
    for (const field of numberFields) {
        if (!(field in properties)) {
            app.metadataTypeManager.setType(field, 'number');
        }
    }
    for (const field of textFields) {
        if (!(field in properties)) {
            app.metadataTypeManager.setType(field, 'text');
        }
    }
}
