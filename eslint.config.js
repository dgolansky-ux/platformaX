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
  // === eslint-plugin-boundaries — INSTALLED but PARTIAL_NOT_ENFORCED ======
  //
  // Status: PARTIAL_NOT_ENFORCED. The plugin is installed and ESLint loads
  // it cleanly, but neither the legacy v5-style rules (`boundaries/element-types`
  // + `boundaries/entry-point`) nor a quick `boundaries/dependencies` rewrite
  // produce blocking errors on a planted `client/* -> @server/*` import on
  // this codebase:
  //
  //  - v5 syntax: v6 detects the selector schema as "legacy" and only emits
  //    deprecation warnings on the rule, never enforcement errors.
  //  - v6 `boundaries/dependencies`: the source element is now correctly
  //    typed (`from.type = "client-app-v2"`) but the target element comes
  //    back as `to.isUnknown: true` because boundaries can neither resolve
  //    the `@server/*` TypeScript path alias (no
  //    `eslint-import-resolver-typescript` wired in) nor classify the
  //    relative-path target without a matching `boundaries/elements` mode.
  //
  // Fixing this properly requires:
  //  - installing `eslint-import-resolver-typescript` and wiring it into the
  //    boundaries settings so `@server/*` resolves to its on-disk file,
  //  - re-modelling every `boundaries/elements` entry with the captures and
  //    `mode` flags that v6 expects,
  //  - re-running `pnpm tooling:redcase --strict` end-to-end to confirm
  //    every planted case BLOCKs through ESLint alone.
  //
  // That migration is tracked as the follow-up issue
  // `FIX_ESLINT_PLUGIN_BOUNDARIES_V6_ENFORCEMENT` and intentionally NOT
  // bundled into this spike — see the disclosure in
  // `docs/architecture/PlatformaX-V2-coding-standards.md §22a` and the
  // matching `Truth disclosures` row in
  // `docs/review/tooling-spike/TOOLING_VERIFICATION_REPORT.md`.
  //
  // Why the gate stays green anyway: every red case that ESLint cannot
  // currently block is still blocked by ALL of the following:
  //   - `pnpm depcruise:check` (`no-client-to-server`,
  //     `no-cross-domain-internal`, `no-circular`, `shared-no-runtime`,
  //     `no-legacy-runtime-import`),
  //   - `pnpm arch-tests` (Vitest specs, side-effect form covered),
  //   - `node scripts/audit-domain-boundaries.mjs` (custom guard, hardened
  //     2026-05-29 to catch `@server/*`, relative `../server/**` and
  //     side-effect imports from both `client/**` and `shared/**`).
  //
  // The plugin block below loads the plugin so the ESLint config validates
  // and reports nothing — explicit "do nothing" beats silently misclaiming
  // PASS.
  {
    plugins: { boundaries },
    rules: {
      "boundaries/no-unknown": "off",
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
