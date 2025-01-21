import js from '@eslint/js'
import react from 'eslint-plugin-react'
import tseslint from 'typescript-eslint'

export default tseslint.config({
  files: ['**/*.{js,jsx,mjs,cjs,ts,tsx}'],
  ignores: ['dist'],
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    ...tseslint.configs.stylistic,
    ...tseslint.configs.strict,
  ],
  files: ['**/*.{ts,tsx}'],
  languageOptions: {
    ecmaVersion: 2020,
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    react,
  },
  rules: {
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/consistent-type-imports': 'error',
    'react/jsx-no-useless-fragment': 'error',
    'react/self-closing-comp': 'error',
  },
})
