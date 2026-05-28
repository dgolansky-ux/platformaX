import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import boundaries from "eslint-plugin-boundaries";

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
      // unused" marker.
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
  // === eslint-plugin-boundaries (v5-style API, still supported in v6) ======
  // Lint-time enforcement of V2 architecture boundaries. Runs PARALLEL_WITH_TOOLING
  // with the existing custom regex guards (audit-domain-boundaries.mjs,
  // check-architecture-import-graph.mjs, check-no-legacy-imports.mjs). The
  // custom guards stay until the new tool catches equivalent red cases — see
  // `tests/architecture/fixtures/` for the documented safe fixtures.
  //
  // v6 introduced a unified `boundaries/dependencies` rule with a different
  // selector schema; migration is tracked as PARTIAL_NOT_ENFORCED (deprecation
  // warnings are informational, not lint failures).
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "client-app-v2", pattern: "client/src/app-v2/*" },
        { type: "client-shared-ui", pattern: "client/src/features-v2/shared-ui/*" },
        { type: "client-feature", pattern: "client/src/features-v2/*", capture: ["feature"] },
        { type: "server-application", pattern: "server/application-v2/*" },
        { type: "server-domain", pattern: "server/domains-v2/*", capture: ["domain"] },
        { type: "shared", pattern: "shared/*" },
        { type: "server-root", pattern: "server/*" },
      ],
      "boundaries/include": [
        "client/src/**/*.{ts,tsx}",
        "server/**/*.{ts,tsx}",
        "shared/**/*.{ts,tsx}",
      ],
      "boundaries/ignore": [
        "**/*.test.{ts,tsx}",
        "**/__tests__/**",
        "**/fixtures/**",
        "**/dist/**",
        "**/node_modules/**",
      ],
    },
    rules: {
      "boundaries/no-unknown": "off",
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            // app-v2: composes features + shared UI + shared contracts; no
            // server runtime allowed.
            { from: ["client-app-v2"], allow: ["client-app-v2", "client-feature", "client-shared-ui", "shared"] },
            // features-v2/<feature>: own internals + shared UI + shared
            // contracts. Cross-feature deep imports are blocked by no-private.
            { from: ["client-feature"], allow: ["client-feature", "client-shared-ui", "shared"] },
            // Shared UI: leaf — depends only on more shared UI + shared contracts.
            { from: ["client-shared-ui"], allow: ["client-shared-ui", "shared"] },
            // server-domain: own internals + the public surface of other domains
            // + shared contracts. entry-point below restricts which files of
            // "another domain" are actually importable.
            { from: ["server-domain"], allow: ["server-domain", "shared"] },
            // application-v2 use-cases: orchestrate domains via public-api +
            // shared contracts. No frontend imports.
            { from: ["server-application"], allow: ["server-application", "server-domain", "shared"] },
            // shared: contracts only — must not pull runtime in either half.
            { from: ["shared"], allow: ["shared"] },
            // server bootstrap: may compose everything server-side.
            { from: ["server-root"], allow: ["server-root", "server-domain", "server-application", "shared"] },
          ],
        },
      ],
      "boundaries/entry-point": [
        "error",
        {
          default: "disallow",
          rules: [
            { target: ["server-domain"], allow: "public-api.ts" },
            { target: ["server-domain"], allow: "contracts.ts" },
            { target: ["server-domain"], allow: "events.ts" },
            { target: ["server-domain"], allow: "dto.ts" },
            // Composition (server-root, tests, application) may reach the
            // implementation factory from ./repository directly — this matches
            // the documented public-surface README for identity/media.
            { target: ["server-domain"], allow: "repository.ts" },
            { target: ["server-application"], allow: "public-api.ts" },
            { target: ["client-feature"], allow: "index.ts" },
            { target: ["client-feature"], allow: "public-api.ts" },
            { target: ["client-shared-ui"], allow: "**" },
            { target: ["client-app-v2"], allow: "**" },
            { target: ["shared"], allow: "**" },
            { target: ["server-root"], allow: "**" },
          ],
        },
      ],
    },
  },
  {
    files: ["**/__tests__/**/*.{ts,tsx}", "**/*.test.{ts,tsx}"],
    rules: {
      "boundaries/element-types": "off",
      "boundaries/entry-point": "off",
    },
  },
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "docs/**",
      "scripts/**",
      "tests/architecture/fixtures/**",
      "*.config.*",
    ],
  },
);
