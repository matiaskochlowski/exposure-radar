// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*', 'src/data/kev-snapshot.json'],
  },
  {
    // Layering rules from docs/CONVENTIONS.md, enforced so agents (and people) can't drift.
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-native/*', 'expo*', '@tanstack/*', 'zustand*'],
              message: 'src/domain must stay pure TypeScript.',
            },
            {
              group: ['@/data/*', '@/store/*', '@/components/*', '@/app/*', '@/hooks/*'],
              message: 'src/domain may only import from src/domain.',
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', { name: 'fetch', message: 'No I/O in src/domain.' }],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Pass `now` in instead (docs/CONVENTIONS.md, Time).',
        },
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Pass `now` in instead (docs/CONVENTIONS.md, Time).',
        },
      ],
    },
  },
  {
    files: ['src/components/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/store/*', '@/data/*-client'],
              message: 'Components take props; screens own data and stores.',
            },
          ],
        },
      ],
    },
  },
]);
