import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'dist/',
      'build/',
      'coverage/',
      'public/sw.js',
      'public/workbox-*.js',
    ],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
    rules: {
      'no-console': 'off',
    },
  },
];