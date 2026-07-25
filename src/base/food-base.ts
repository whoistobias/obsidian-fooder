import { App, Notice, TFile } from 'obsidian';
import { FOOD_TAG } from '../utils/food';
import {
	CALORIES_FRONTMATTER_KEY,
	PROTEIN_FRONTMATTER_KEY,
	CARBS_FRONTMATTER_KEY,
	FAT_FRONTMATTER_KEY,
	FIBER_FRONTMATTER_KEY,
	SERVING_SIZE_FRONTMATTER_KEY,
} from '../types';

export const FOOD_BASE_PATH = 'Foods.base';

const FOOD_BASE_CONTENT = `filters:
  and:
    - file.hasTag("${FOOD_TAG}")

properties:
  note.${CALORIES_FRONTMATTER_KEY}:
    displayName: Calories
  note.${PROTEIN_FRONTMATTER_KEY}:
    displayName: Protein
  note.${CARBS_FRONTMATTER_KEY}:
    displayName: Carbs
  note.${FAT_FRONTMATTER_KEY}:
    displayName: Fat
  note.${FIBER_FRONTMATTER_KEY}:
    displayName: Fiber
  note.${SERVING_SIZE_FRONTMATTER_KEY}:
    displayName: Serving size

views:
  - type: table
    name: "All foods"
    order:
      - file.name
      - ${CALORIES_FRONTMATTER_KEY}
      - ${PROTEIN_FRONTMATTER_KEY}
      - ${CARBS_FRONTMATTER_KEY}
      - ${FAT_FRONTMATTER_KEY}
      - ${FIBER_FRONTMATTER_KEY}
      - ${SERVING_SIZE_FRONTMATTER_KEY}
`;

export async function ensureFoodBase(app: App): Promise<TFile> {
	const existing = app.vault.getAbstractFileByPath(FOOD_BASE_PATH);
	if (existing instanceof TFile) {
		new Notice('Food base already exists.');
		return existing;
	}

	const file = await app.vault.create(FOOD_BASE_PATH, FOOD_BASE_CONTENT);
	new Notice('Created food base.');
	return file;
}
