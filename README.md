# PlatformaX V2 — Clean Repo

Status: `BRAMKA_LOCAL_IMPLEMENTATION_IN_PROGRESS`  
GitHub manual gates: `PENDING`  
Branch: `main`

## What is this

PlatformaX V2 is a modular-monolith platform rebuilt from scratch with full governance, architecture enforcement, and quality gates.

## Local BRAMKA gates

All local gates are implemented and passing:

- **Type check** — `pnpm check`
- **Lint** — `pnpm lint`
- **Tests** — `pnpm test`
- **Build** — `pnpm build`
- **Rules umbrella** — `pnpm rules:check` (14 sub-guards)
- **Arch umbrella** — `pnpm arch:check:v2` (6 sub-guards)
- **Commit decision** — `pnpm guards:commit`
- **Bundle validation** — `pnpm guards:bundle`
- **Secret scan** — `pnpm guards:secrets`
- **Script safety** — `pnpm guards:scripts`
- **All local** — `pnpm guards:all-local`

## Git hooks (Husky)

| Hook | Guards |
|---|---|
| `pre-commit` | diff-safety, fake-done, removed-areas, env-safety, test-env-safety, tsc, eslint, lint-staged |
| `pre-push` | rules:check, arch:check:v2, domain-boundaries, domain-status, removed-areas, test-env, lint, test, build |
| `commit-msg` | commitlint (type + scope enum) |

## GitHub CI

Workflow `.github/workflows/v2-gates.yml` runs full gate suite on push/PR to `main`.

## Pending manual GitHub steps

- Branch protection for `main`
- Required status checks (`gates` job)
- Require PR before merge
- CODEOWNERS review enforcement
- GitHub secret scanning / push protection
- Dependabot alerts
- Railway/Supabase deployment policies

See `docs/review/step-06-branch-protection/GITHUB_MANUAL_ACTIONS.md` for details.

## Project structure

```
client/          — React frontend (Vite)
server/          — Express backend
shared/          — Shared types/contracts
scripts/         — Guard scripts and generators
docs/            — Governance, architecture, ADRs, review reports
.github/         — CI workflow, CODEOWNERS, PR template
.husky/          — Git hooks
```

## Forbidden in current phase

- Product features (profiles, feeds, marketplace, etc.)
- Supabase/Railway runtime
- Legacy code imports
- Direct push to `main` (once branch protection is set)
