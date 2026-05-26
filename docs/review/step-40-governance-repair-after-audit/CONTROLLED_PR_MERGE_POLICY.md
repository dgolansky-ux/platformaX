# Controlled PR Merge Policy (PX-GOV-006)

## Rule ID

PX-GOV-006 — Controlled AI PR merge allowed only with owner instruction and green gates

## Requirements (all must be true)

1. Explicit owner instruction in the current task command
2. PR base branch = `main`
3. PR head branch != `main`
4. All GitHub CI / status checks green
5. No merge conflicts
6. PR is not a draft
7. Working tree is clean
8. No `--admin` flag
9. Merge uses `--merge` strategy (no `--squash`/`--rebase` without instruction)
10. Post-merge verification via `gh pr view`

## Enforcement

- **Policy guard:** `scripts/check-ai-pr-merge-policy.mjs` — validates policy docs and settings
- **Eligibility check:** `scripts/check-pr-merge-eligibility.mjs <PR_NUMBER>` — validates PR conditions via `gh CLI`
- **Manual gate:** Owner reviews AI merge request in PR context

## What is still forbidden

- Autonomous AI merge (without owner instruction)
- `gh pr merge --admin`
- Merge when CI is red
- Merge of draft PRs
- Direct push to main
- Force push

## Registries updated

- `docs/governance/RULES_REGISTRY.yml` — PX-GOV-006 entry
- `docs/governance/GOVERNANCE_INDEX.md` — AI PR Merge Policy section
- `docs/governance/RULES_TO_GUARDS_MATRIX.md` — PX-GOV-006 row
- `docs/governance/GUARDS_REGISTRY.yml` — GUARD-048, GUARD-049
- `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md` — Controlled AI PR Merge section
- `docs/ai/AI_FORBIDDEN_ACTIONS.md` — autonomous merge + `--admin` entries
