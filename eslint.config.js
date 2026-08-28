import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

export default [
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', 'assets/**'] },
  eslint.configs.recommended,
  {
    files: ['public/sw.js'],
    languageOptions: { globals: { caches: 'readonly', fetch: 'readonly', location: 'readonly', Response: 'readonly', self: 'readonly', URL: 'readonly' } },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
      globals: {
        Blob: 'readonly', document: 'readonly', FileReader: 'readonly', FormData: 'readonly', history: 'readonly',
        HTMLAnchorElement: 'readonly', HTMLButtonElement: 'readonly', HTMLDivElement: 'readonly', HTMLElement: 'readonly',
        HTMLFormElement: 'readonly', HTMLInputElement: 'readonly', HTMLOutputElement: 'readonly', HTMLSelectElement: 'readonly',
        HTMLTextAreaElement: 'readonly', localStorage: 'readonly', navigator: 'readonly', requestAnimationFrame: 'readonly',
        structuredClone: 'readonly', SVGSVGElement: 'readonly', SVGGElement: 'readonly', URL: 'readonly', window: 'readonly',
        crypto: 'readonly', confirm: 'readonly', fetch: 'readonly', console: 'readonly', process: 'readonly', Buffer: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      ...tseslint.configs.recommended.rules,
      'no-undef': 'off',
    },
  },
];
