import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Allow underscore-prefixed args/vars as the standard TS "intentionally
      // unused" marker (e.g. interface-required adapter methods whose body does
      // not consume every parameter). Without this, an interface implementation
      // is forced to either drop the parameter — breaking the contract — or use
      // a `void arg` no-op, which is noise.
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "docs/**",
      "scripts/**",
      "*.config.*",
    ],
  },
);
