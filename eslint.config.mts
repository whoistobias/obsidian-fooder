import { createRequire } from 'node:module';
import obsidianmd from 'eslint-plugin-obsidianmd';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { globalIgnores, defineConfig } from 'eslint/config';

// typescript-eslint-parser-for-extra-files calls svelte2tsx without
// `isTsFile: true`, which makes component exports (`export function ...` in
// <script lang="ts">) come out as a JSDoc cast that TypeScript ignores, so
// imports of .svelte files lose their export types. Patch svelte2tsx in the
// shared require cache before the parser lazily requires it.
// See https://github.com/ota-meshi/typescript-eslint-parser-for-extra-files
const require = createRequire(import.meta.url);
const svelte2tsxModule = require('svelte2tsx') as {
	svelte2tsx: (code: string, options?: object) => unknown;
};
const originalSvelte2tsx = svelte2tsxModule.svelte2tsx;
svelte2tsxModule.svelte2tsx = (code, options) =>
	originalSvelte2tsx(code, { isTsFile: true, ...options });

const parserForExtraFiles = require(
	'typescript-eslint-parser-for-extra-files',
) as typeof import('typescript-eslint-parser-for-extra-files');

export default defineConfig(
	globalIgnores([
		'node_modules',
		'dist',
		'esbuild.config.mjs',
		'version-bump.mjs',
		'versions.json',
		'main.js',
		'package.json',
		'package-lock.json',
		'tsconfig.json',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: {
					allowDefaultProject: ['eslint.config.mts', 'manifest.json'],
				},
				tsconfigRootDir: import.meta.dirname,
				extraFileExtensions: ['.json', '.svelte', '.svelte.ts'],
			},
		},
	},
	...obsidianmd.configs.recommended,
	...svelte.configs.recommended,
	{
		// Build tooling only; never bundled into the plugin, so Node APIs are fine.
		files: ['eslint.config.mts'],
		rules: {
			'obsidianmd/no-nodejs-modules': 'off',
		},
	},
	{
		// Resolve real types across the .ts ↔ .svelte boundary (via svelte2tsx)
		// instead of the ambient `declare module '*.svelte'` fallback.
		files: ['src/**/*.ts'],
		languageOptions: {
			parser: parserForExtraFiles,
			parserOptions: {
				projectService: false,
				project: './tsconfig.json',
			},
		},
	},
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				parser: parserForExtraFiles,
				projectService: false,
				project: './tsconfig.json',
			},
		},
	},
	{
		files: ['**/*.svelte.ts'],
		languageOptions: {
			globals: {
				$state: 'readonly',
				$derived: 'readonly',
				$effect: 'readonly',
				$props: 'readonly',
				$bindable: 'readonly',
				$inspect: 'readonly',
			},
		},
	},
);
