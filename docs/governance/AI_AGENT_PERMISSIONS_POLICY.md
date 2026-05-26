# PlatformaX V2 — AI Agent Permissions Policy

Status: `ACTIVE`
Owner: Governance

## Purpose

Defines what AI agents (Opus, Cursor, Claude) may and must not do in this repository.

---

## Always Allowed (no separate approval needed)

- Read project docs
- Inspect code
- Run local checks (`pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm rules:check`)
- Create or update files explicitly requested in task scope
- Add tests for touched code
- Add typed fixtures
- Improve docs related to touched scope
- Report blockers honestly
- Stop when gates fail
- Create evidence reports, manifests, and logs
- Create branches (`git checkout -b`)
- Stage files (`git add`)

## Allowed With Explicit Task Scope

- Add a new V2 domain scaffold
- Add a new UI shell scaffold
- Add a new route
- Add a new guard script
- Update CI workflows
- Update CODEOWNERS
- Update PR template
- Update ADR
- Update domain status
- Add Supabase migration (as code, not live push)
- Change package.json scripts
- Delete obsolete code within scope
- Commit changes (after green gates)
- Push to feature branches (after green gates)
- Create PRs via `gh pr create`

## Requires Separate Owner Decision

- Destructive DB migration (`supabase db push`)
- Production deployment (Railway, Supabase production)
- Production secrets rotation
- Branch protection / ruleset changes
- Changing accepted ADRs
- Adding broad allowlists to guards
- Moving reference material into active workspace
- `pnpm add` new dependencies (requires review justification)

## Forbidden (hard block)

- `--no-verify` (unless explicit owner approval + ADR)
- `git push --force`
- `git push origin main` (direct push to main)
- `git reset --hard` on shared branches
- `git merge main` into feature branch without review
- `gh pr merge` without CI + approval
- `rm -rf` on project directories
- `supabase db push` to production/staging
- `railway` deployment commands
- Commit when gates fail
- Mark DONE without evidence
- Weaken guards to pass own task
- Delete tests because they fail
- Import legacy runtime
- Use `--no-verify`
- Write real secrets to repo
- Expose public PII
- Use base64/dataUrl upload runtime

## Required Behavior

- Agent MUST use `BLOCKED` status when rules conflict
- Agent MUST self-audit before reporting DONE
- Agent MUST read governance docs before starting work
- Agent MUST run all gates before commit
- Agent MUST NOT trust its own prior output without verification

## Gate Requirements

| Action | Required gates |
|---|---|
| Commit | `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm rules:check` |
| Push | All commit gates + `pnpm arch:check:v2` |
| PR creation | All push gates + Architecture Impact Statement |
| Merge | CI green + CODEOWNERS approval + branch protection |
