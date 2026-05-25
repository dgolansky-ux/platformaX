# Step 05 — GitHub CI & Governance Report

Generated: 2026-05-25T02:47Z

## Objective

Add GitHub Actions CI workflow, CODEOWNERS, and PR template so every push/PR is validated by the full gate suite.

## Created files

| File | Purpose |
|---|---|
| `.github/workflows/v2-gates.yml` | CI workflow: check, lint, test, build, rules:check, arch:check:v2, guards:bundle |
| `.github/CODEOWNERS` | Code ownership for domains, scripts, architecture docs, workflows, package.json |
| `.github/pull_request_template.md` | PR template with Architecture Impact Statement |

## Report files

| File | Purpose |
|---|---|
| `docs/review/step-05-github-ci/STEP_05_REPORT.md` | This report |
| `docs/review/step-05-github-ci/COMMAND_LOGS.md` | Validation command outputs |
| `docs/review/step-05-github-ci/CI_MATRIX.md` | CI steps matrix |
| `docs/review/step-05-github-ci/BLOCKED_ITEMS.md` | Blocked items |
| `docs/review/step-05-github-ci/GITHUB_MANUAL_ACTIONS.md` | Manual GitHub settings required |

## CI Workflow

Triggers: `push` to `main`, `pull_request` to `main`

Steps:
1. Checkout
2. Setup Node 22
3. Setup pnpm 9
4. `pnpm install --frozen-lockfile`
5. `pnpm check`
6. `pnpm lint`
7. `pnpm test`
8. `pnpm build`
9. `pnpm rules:check`
10. `pnpm arch:check:v2`
11. `pnpm guards:bundle`

## CODEOWNERS

Paths covered: `/server/domains-v2/**`, `/client/src/app-v2/**`, `/client/src/features-v2/**`, `/client/src/App.tsx`, `/scripts/check-*`, `/scripts/validate-*`, `/scripts/*.mjs`, `/docs/architecture/**`, `/.github/workflows/**`, `/package.json`

Owner placeholder: `@REPLACE_WITH_OWNER` (requires manual replacement with actual GitHub username)

## PR Template

Includes Architecture Impact Statement with fields for: domains touched, public-api changes, cross-domain imports, routing changes, PII, media, pagination, legacy areas, evidence, gates run, final status.

## Constraints respected

- No product features added
- No Supabase/Railway runtime
- No guards weakened
- No tests removed
- No `--no-verify`

## Final status

```
L4_GITHUB_CI_READY
BRAMKA_IMPLEMENTATION_IN_PROGRESS
```
