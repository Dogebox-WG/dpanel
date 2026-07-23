import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'src/gen/**', 'src/static/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // Enforce interface for object type definitions (autofixable; only flags convertible shapes)
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      // Ban type assertions; `as const` is always allowed by this rule
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
  },
);
