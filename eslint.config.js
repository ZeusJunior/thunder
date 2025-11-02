/** I do not like this way of defining the eslint config */
const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = [
  {
    ignores: [
      "**/node_modules/",
      "**/dist/",
      "**/build/",
      "**/app/",
      "**/out/",
      "**/.next/",
      "**/next-env.d.ts",
    ],
  },
  ...compat.extends("next/core-web-vitals"),
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2021,
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      semi: ["error", "always"],
      "@typescript-eslint/no-explicit-any": "warn",
      indent: ["error", 2, { "SwitchCase": 1 }],
      quotes: ["error", "single"],
    },
  },
];
