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

## Backend / runtime DONE evidence (agents)

An AI agent must **not** mark backend or runtime work DONE (or `IMPLEMENTED` / `BACKEND_DONE`) when any of the following are missing:

| Missing evidence | Rule |
|---|---|
| Owner/viewer/resource model on new resources | PX-OWN-001, PX-OWN-002 |
| Public DTO privacy (gate log or tests) | PX-DTO-002, PX-SEC-001 |
| limit/cursor/stable order on new lists/feeds/search | PX-LIST-004, PX-CURSOR-001 |
| Media ownership validation on attach paths | PX-MEDIA-004 |
| Architecture Impact Statement on larger tasks | PX-AIS-002, PX-ADR-001 |
| Status aligned with files/tests/gates | PX-STATUS-001, PX-RUNTIME-001, PX-RUNTIME-002 |

Use `IN_PROGRESS` or `BLOCKED` with concrete blockers. See `docs/governance/BACKEND_ARCHITECTURE_INVARIANTS.md`.

## Gate Requirements

| Action | Required gates |
|---|---|
| Commit | `pnpm check`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm rules:check` |
| Push | All commit gates + `pnpm arch:check:v2` |
| PR creation | All push gates + Architecture Impact Statement |
| Merge | CI green + CODEOWNERS approval + branch protection |

## Mandatory Task Finalization (PX-GOV-FINALIZE-001)

- The agent **must** commit, push, and open or update a PR after every
  successful task (gates green, scope satisfied).
- The agent **must not** end a successful task with uncommitted local edits.
- The agent **must not** push directly to `main`. Use a working branch.
- The agent **must not** use `git push --force`, `--no-verify`, or any bypass.
- The agent **must not** commit secrets, ZIPs, logs, build artefacts,
  `node_modules`, `dist`, or `coverage`.
- The agent **must not** commit when gates fail. Fix in scope or report
  `BLOCKED`.
- The agent **must not** merge the PR unless a separate controlled
  auto-merge policy is in place and its eligibility check passes.
- Exemptions: `READ_ONLY_EXPORT_ONLY`, `AUDIT_ONLY`, or `BLOCKED` tasks.

See `AGENT_COMMAND_STANDARD.md` §11 for the mandatory `FINALIZATION:` block
that every closing agent response must contain.

## `.claude/` settings — tracked example vs local override

`.claude/settings.example.json` is the **audit-tracked reference** for the AI
agent allow-list. It is checked into git, reviewed in PRs, and enforced by
`scripts/check-ai-agent-permissions.mjs` (GUARD-037).

`.claude/settings.local.json` is the **local-only** override and stays
gitignored (`.gitignore` excludes `.claude/*` except `settings.example.json`).
When present locally it is also scanned by the guard with the same rule set,
so a developer cannot widen permissions only on their machine.

Forbidden in either file:

- `git push *`, `git push origin *`, `git push -u origin *`, `git push origin HEAD*`
  (broad wildcards that could push to `main` or any branch). Only
  `git push origin HEAD` and `git push -u origin HEAD` are allowed.
- `git push --force`, `git push -f`, `git push origin main`.
- `--no-verify` anywhere.
- `git reset --hard`, `git clean *`, `git checkout -- *`, `git checkout *`.
- `git pull *` without `--ff-only`.
- `gh api *` (broad mutable bypass), `gh pr merge`.
- `node *` (broad arbitrary execution); only `node scripts/<file>` is allowed.
- `railway`, `supabase db push`, `rm -rf *`.

Every guard scope expansion or new permission entry MUST go through the
tracked example so it is reviewable.
