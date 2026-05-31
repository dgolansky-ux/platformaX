# Slice 25 — Tooling final decision register

## 1. Decision register (carries `SLICE_24_TOOLING_REVIEW_AND_DECISION_REGISTER.md` forward)

| Tool | Slice 24 classification | Slice 25 decision | Reason |
|---|---|---|---|
| `eslint-plugin-boundaries` v6 | ACTIVE_CI_ONLY (loaded but PARTIAL_NOT_ENFORCED — EXC-017) | UNCHANGED | Fix requires `eslint-import-resolver-typescript` dependency + re-encode + re-baseline. Compensating coverage in place. See `SLICE_25_BOUNDARIES_V6_FINAL_DECISION.md`. |
| `eslint-import-resolver-typescript` | DEFERRED_UNTIL_RUNTIME | UNCHANGED | Only useful with boundaries v6 fix. Add together. |
| `dependency-cruiser` | ACTIVE_REQUIRED | UNCHANGED | Core boundary enforcement; runs in `verify:deep`. |
| Custom guards (`scripts/check-*.mjs`) | ACTIVE_REQUIRED | UNCHANGED (+10 new in Slice 25) | Repo-specific rules. Defense-in-depth with depcruise + arch-tests. |
| `knip` | ACTIVE_INFORMATIONAL | UNCHANGED | Weekly informational lane. Carries pre-existing unused-export candidates; not a blocker for `verify:deep`. |
| `gitleaks` | ACTIVE_REQUIRED | UNCHANGED | `secrets:gitleaks` in `verify:deep`; `secrets:gitleaks:required` in CI. |
| CodeQL | DEFERRED_UNTIL_RUNTIME | UNCHANGED | Worth wiring once runtime ships and a real attack surface exists. |
| Playwright | ACTIVE_REQUIRED for visual evidence | UNCHANGED | Already used for Profile / AppShell visual evidence in Slices 22–23. |
| `@axe-core/playwright` | NOT_NEEDED_NOW | UNCHANGED | a11y guard belongs in a UI-quality slice with stable pages. Slice 26 candidate. |
| Semgrep | NOT_NEEDED_NOW | UNCHANGED | Custom guards cover current risks. Semgrep value rises once runtime + real user input land. |
| Bundle analyzer | ACTIVE_INFORMATIONAL | UNCHANGED | Only matters if bundle regresses; `validate-bundle.mjs --smoke` runs in `guards:all-local`. |
| Lighthouse CI | DEFERRED_UNTIL_STAGING | UNCHANGED | No staging environment yet. |
| API Extractor | NOT_NEEDED_NOW | UNCHANGED | Public API surface is not yet a package-like contract. |

## 2. No new dependencies in Slice 25

The brief forbids dependency additions without an explicit decision.
Slice 25 added **zero** new dependencies. Every new guard is a plain
ESM script with `node:fs` / `node:path` only.

`package.json` `dependencies` and `devDependencies` are byte-identical
between the Slice 24 commit (`c18184c`) and the Slice 25 commit (this
slice).

## 3. Tools considered and explicitly REJECTED for Slice 25

- **Adding any test framework.** Vitest covers everything.
- **Adding any new lint plugin.** Boundaries v6 stays the only
  outstanding plugin work; that decision lives in
  `SLICE_25_BOUNDARIES_V6_FINAL_DECISION.md`.
- **Adding API Extractor / Lighthouse / Semgrep / axe.** All wait
  until they have a real artifact to protect.

## 4. Trigger conditions for each deferred tool

| Tool | Trigger |
|---|---|
| `eslint-plugin-boundaries` v6 fix + `eslint-import-resolver-typescript` | Runtime transport ships, OR `2026-08-31` approaches, OR any other plugin needs the TS resolver. |
| CodeQL | Real attack surface (HTTP endpoints + persistence) lands. |
| Lighthouse CI | A staging environment exists. |
| `@axe-core/playwright` | UI Q1 quality slice (post-runtime). |
| Semgrep | Custom guards stop catching a class of regression that Semgrep would. |
| API Extractor | An internal package crystallises as a published contract. |

## 5. Active vs deferred summary

- **ACTIVE_REQUIRED:** tsc, eslint (with boundaries v6 PARTIAL_NOT_ENFORCED), vitest, vite build, depcruise, arch-tests, custom guards, gitleaks, tooling:redcase.
- **ACTIVE_INFORMATIONAL:** knip, bundle smoke.
- **DEFERRED:** boundaries v6 fix, CodeQL, Lighthouse CI, axe-playwright, Semgrep, API Extractor.
- **REJECTED for Slice 25:** any new dependency.

Status of this file: **DECISION_REGISTER_CURRENT**.
