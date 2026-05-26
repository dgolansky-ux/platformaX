# Step 35 — Red-Team Findings

## Critical Findings

### F1: `.claude/settings.local.json` had dangerous wildcard permissions

**Severity:** HIGH
**Status:** FIXED

The following wildcard entries in the allow list encompassed dangerous commands:

| Entry | Covers |
|---|---|
| `Bash(git push *)` | `git push --force`, `git push origin main` |
| `Bash(git commit *)` | `git commit --no-verify` |
| `Bash(git reset *)` | `git reset --hard` |
| `Bash(git merge *)` | `git merge main` |
| `Bash(gh pr *)` | `gh pr merge` |
| `Bash(pnpm add *)` | unrestricted dependency additions |

**Fix:** Replaced wildcards with specific safe variants. Added explicit `deny` list.

### F2: 13 domain status conflicts unresolved

**Severity:** HIGH
**Status:** FIXED

The DOMAIN_STATUS_REGISTRY.yml correctly flagged conflicts but left them as `conflict: true` with `requires_manual_resolution`. All 13 conflicts were resolvable with evidence:

- `domain-status.md` said PLANNED for 13 domains
- `domain-registry.ts` said SCAFFOLD_ONLY for those same 13 domains
- Actual folders contained scaffold files (README, public-api.ts, dto.ts, contracts.ts, events.ts, policy.ts, index.ts, domain-contract.test.ts)
- Correct status: SCAFFOLD_ONLY (scaffold exists, no runtime)

Additionally, `identity` in domain-registry.ts was SCAFFOLD_ONLY but has real runtime (service.ts, repository.ts, mapper.ts, tests). Fixed to PARTIAL.

### F3: `check-ai-agent-permissions.mjs` only warned on wildcards

**Severity:** MEDIUM
**Status:** FIXED

Dangerous wildcard permissions produced warnings but allowed the guard to PASS. Changed to hard violations (exit code 1).

### F4: `check-domain-status-registry.mjs` did not cross-validate domain-registry.ts

**Severity:** MEDIUM
**Status:** FIXED

The guard validated DOMAIN_STATUS_REGISTRY.yml internally but did not check whether statuses matched domain-registry.ts. Added cross-validation that fails if statuses diverge without `conflict: true` flag.

## Non-Findings (Verified OK)

| Area | Finding |
|---|---|
| RULES_REGISTRY.yml completeness | All P0/P1/P2 rules present, IDs stable, categories correct |
| GUARDS_REGISTRY.yml file existence | All 37 guard files verified to exist on disk |
| RULES_TO_GUARDS_MATRIX.md accuracy | Matrix matches RULES_REGISTRY.yml enforced_by fields |
| STATUS_TAXONOMY.md BRAMKA alignment | Taxonomy labels match BRAMKA and domain-status.md allowed statuses |
| REQUIRED_DOCS_BY_SCOPE.yml | All 11 scope mappings have sensible required_reading lists |
| P0 guard coverage | Every P0 active rule has ≥1 guard or manual_gate |
| GOVERNANCE_INDEX.md | All 25 rules indexed, categories match registry |
| EXCEPTIONS_REGISTER.md | Empty (correct — no active exceptions) |
