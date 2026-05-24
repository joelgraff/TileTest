import js from '@eslint/js';
import globals from 'globals';

export default [
    {
        ignores: [
            'node_modules/**',
            'playwright-report/**',
            'test-results/**'
        ]
    },
    {
        ...js.configs.recommended,
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                Phaser: 'readonly'
            }
        },
        rules: {
            ...js.configs.recommended.rules,
            'no-console': 'off'
        }
    },
    {
        files: ['tests/**/*.js', 'playwright.config.js', 'vitest.config.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.node
            }
        }
    }
];