// @ts-check
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

import antiSlop from "./tools/eslint/anti-slop/index.ts";

export default defineConfig(
  {
    ignores: [
      "**/dist/**",
      "**/.turbo/**",
      "**/node_modules/**",
      "tools/eslint/anti-slop/**",
    ],
  },
  eslint.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ["**/*.ts"],
    rules: {
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        { requireDefaultForNonUnion: true },
      ],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        { allowString: false, allowNumber: false },
      ],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/consistent-type-exports": "error",
      "@typescript-eslint/prefer-readonly": "error",
      "@typescript-eslint/require-array-sort-compare": "error",
      "@typescript-eslint/promise-function-async": "error",
      "no-shadow": "off",
      "@typescript-eslint/no-shadow": "error",

      // Rules below codify docs/typescript.md.
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "as", objectLiteralTypeAssertions: "never" },
      ],
      "@typescript-eslint/array-type": [
        "error",
        { default: "array", readonly: "generic" },
      ],
      "@typescript-eslint/no-import-type-side-effects": "error",
      "no-param-reassign": ["error", { props: true }],
      "max-depth": ["error", 3],
      "no-restricted-syntax": [
        "error",
        {
          // Inline callbacks such as reduce((total, item) => ...) stay exempt.
          selector:
            "FunctionDeclaration[params.length>1], VariableDeclarator > :matches(ArrowFunctionExpression, FunctionExpression)[params.length>1], MethodDefinition > FunctionExpression[params.length>1]",
          message:
            "A function with two or more parameters takes one options object.",
        },
        {
          selector:
            "TSUnionType:has(> TSNullKeyword):has(> TSUndefinedKeyword), TSPropertySignature[optional=true] > TSTypeAnnotation > TSUnionType:has(> TSNullKeyword)",
          message:
            "Use null or undefined for a value, not both. undefined means not given. null means known to have no value.",
        },
        {
          selector: "TSConditionalType TSConditionalType",
          message: "Do not nest conditional types. Use a simpler type.",
        },
      ],
    },
  },
  {
    files: ["**/*.ts"],
    plugins: { "anti-slop": antiSlop },
    rules: Object.fromEntries(
      Object.keys(antiSlop.rules).map((name) => [`anti-slop/${name}`, "error"]),
    ),
  },
  {
    files: ["**/*.js"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
