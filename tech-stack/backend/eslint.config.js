// Flat config (ESLint 10). Pairs with typescript-eslint.
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    // Generated files and build output are never linted.
    ignores: ['dist/**', 'node_modules/**', 'public/**', 'src/core/db/types.ts', 'src/core/db/enums.ts'],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Dependency direction is one-way: modules/ may import core/ and shared/, never the reverse.
    // The single exception is core/http/app.ts, the composition root that mounts the API router.
    files: ['src/core/**/*.ts', 'src/shared/**/*.ts'],
    ignores: ['src/core/http/app.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/modules/**'],
              message: 'core/ and shared/ must not depend on a feature slice. Move the shared piece into core/.',
            },
          ],
        },
      ],
    },
  },
  {
    // Slices must not reach into each other's internals — share via core/ or shared/ instead.
    files: ['src/modules/*/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['../*/*'], message: 'A slice must not import another slice. Promote it to core/ or shared/.' }] },
      ],
    },
  }
)
