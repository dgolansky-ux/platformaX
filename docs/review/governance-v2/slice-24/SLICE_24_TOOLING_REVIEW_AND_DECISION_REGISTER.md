# Slice 24 — Tooling Review and Decision Register

> Reviews the existing tooling surface and decides what (if anything)
> Slice 24 should add. Decisions are conservative: a tool is added
> only when it materially improves coverage and can be wired into a
> stable command + deep gate.

## 1. Existing tooling (kept)

| Tool | Command | In `verify:deep`? | In CI? | Risk it prevents | Slice 24 decision |
|---|---|---|---|---|---|
| TypeScript `tsc --noEmit` | `pnpm check` | YES | YES | type errors at boundary. | KEEP. |
| ESLint (incl. typescript-eslint) | `pnpm lint` | YES | YES | unused vars, lint rules. | KEEP. |
| Vitest | `pnpm test` | YES | YES | behavior regressions. | KEEP. |
| Vite build | `pnpm build` | YES | YES | dead exports surface, runtime build. | KEEP. |
| Custom rules umbrella | `pnpm rules:check` | YES | YES | 55 fail-closed guards (Slice 24: +12). | KEEP and EXTEND. |
| Architecture custom umbrella | `pnpm arch:check:v2` | YES | YES | 17 architecture-class guards. | KEEP and EXTEND. |
| All-local guards | `pnpm guards:all-local` | YES | YES | umbrella for the inner ring of governance guards. | KEEP. |
| Dependency-cruiser | `pnpm depcruise:check` | YES | YES (DEEP lane) | client→server, cross-domain internal, cycles, shared-no-runtime, legacy. | KEEP, primary boundaries coverage given EXC-017. |
| Architecture tests (Vitest) | `pnpm arch-tests` | YES | YES (DEEP lane) | side-effect imports, ESM import graph rules. | KEEP. |
| Gitleaks | `pnpm secrets:gitleaks` (helper) / `pnpm secrets:gitleaks:required` | YES | YES | committed secrets. | KEEP. CI uses official action + required wrapper. |
| Knip | `pnpm knip:check` | YES | YES (informational + weekly) | unused files/exports/deps. | KEEP. Slice 24 makes it part of `verify:deep` non-blocking-but-logged. |
| Tooling red-case verifier | `pnpm tooling:redcase` (`--strict`) | YES | YES | guard regressions (plants violations and asserts non-zero exit). | KEEP. Strict mode stays informational until boundaries v6 ships. |
| Custom audit ZIP | `pnpm auditzip` | NO (slice-specific) | weekly | full-source bundle. | KEEP. Slice 24 adds dedicated `create-slice-24-...-zip.mjs`. |
| Playwright screenshots | `pnpm screenshots:v2` | NO (UI-only) | weekly | visual evidence. | KEEP. Out of scope for governance slice. |

## 2. Tools evaluated and DEFERRED (not added in Slice 24)

| Candidate | Purpose | Decision | Why |
|---|---|---|---|
| `eslint-import-resolver-typescript` | Re-enable `eslint-plugin-boundaries` v6 enforcement. | `DEFERRED_TO_SLICE_25` | New dev dependency requires the AI-agent dependency-decision workflow + a non-trivial ESLint config migration. Compensating coverage already in place via depcruise + arch-tests + custom guard. Tracked as EXC-017 with expiry 2026-08-31. |
| `@axe-core/playwright` | Accessibility checks during the existing Playwright route runs. | `DEFERRED_UNTIL_RUNTIME` | Runtime is mock/local; flakiness would dilute the deep gate signal. Will re-evaluate when at least one route hits a real backend. |
| Semgrep | Custom security/architecture rules (no secrets, no unsafe HTML, no localStorage-as-backend, no PII logging). | `SEMGREP_DEFERRED` | The current custom-guard surface (`check-no-any-types`, `check-public-dto-pii`, `check-logging-pii-security`, `check-secret-scan`, `check-frontend-performance-patterns`) covers the same risks for the current codebase. Adding Semgrep now would require maintaining two rule sets without a clear false-positive policy. Re-evaluate when the codebase hits 10+ domains in real runtime. |
| `rollup-plugin-visualizer` / Vite bundle analyzer | Bundle size report. | `DEFERRED_UNTIL_RUNTIME` | Pre-runtime; bundle is dominated by shells + mock adapters and isn't a meaningful signal yet. Will re-evaluate when there's a measurable build artifact. |
| Lighthouse CI | Performance + a11y CI gate. | `DEFERRED_UNTIL_STAGING` | Requires a deployed environment. Mock/local runs would produce noise. |
| API Extractor / `ts-api-utils` | Public-API surface diffing. | `NOT_NEEDED_NOW_CUSTOM_GUARDS_ENOUGH` | `check-public-dto-contract-tests.mjs` enforces a sibling test file. `check-public-dto-pii.mjs` + `check-dto-privacy-classification.mjs` enforce zero PII at the public boundary. Slice 25 may revisit if domains start exporting > 30 symbols each. |

## 3. Tools hardened in Slice 24

- `tooling:redcase` documentation refreshed (no script change). The
  red-case verifier was already strong; Slice 24 confirms it stays
  required in CI.
- `check-fake-done.mjs` is now defended in depth by
  `check-no-agent-bypass-language.mjs` which polices the
  `ALLOW_STATUS_TERM_IN_POLICY_DOC` marker and other bypass phrases
  the existing guard could not see.

## 4. Tools rejected

None outright. Every candidate in §2 has a documented reason and a
named slice where it will be re-evaluated.

## 5. Final tooling status after Slice 24

| Status | Count |
|---|---|
| Kept (active in `verify:deep`) | 12 |
| Hardened | 2 |
| Added | 1 (Knip wired into `verify:deep`; previously informational-only) |
| Deferred | 6 |
| Rejected | 0 |

No tool is described as "active" if it is not wired into
`package.json` scripts AND CI / deep gate. No tool is described as
"blocking" if it only runs manually.

Status: **TOOLING_REVIEW_DONE**.
