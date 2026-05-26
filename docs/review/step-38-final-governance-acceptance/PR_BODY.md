## Summary

Centralize PlatformaX V2 governance into a single, machine-readable registry and harden all architecture gates. This PR prevents rule drift, spaghetti code, and untracked policy changes through automated enforcement.

## Scope

**Governance-only.** No product, UI, runtime, migration, Railway, or dependency changes.

## Stages (5 commits)

| Commit | Stage | What it does |
|---|---|---|
| `b0c1e81` | Foundation Pack | Creates `docs/governance/` as canonical center: RULES_REGISTRY.yml (25 rules), GUARDS_REGISTRY.yml (37 guards), RULES_TO_GUARDS_MATRIX.md, STATUS_TAXONOMY.md, DOMAIN_STATUS_REGISTRY.yml, AI_AGENT_PERMISSIONS_POLICY.md, AGENT_COMMAND_STANDARD.md |
| `d6e2f3a` | Red Team | Hardens agent permissions, resolves status conflicts, adds meta-guards (check-governance-registry, check-guards-registry, check-rules-to-guards-coverage, check-domain-status-registry, check-ai-agent-permissions) |
| `d03ea91` | Production Hardening | Adds 9 new gates and 17 new rules: architecture import graph, runtime readiness, migration safety, dependency change policy, exception expiry, ADR required, observability/logging, DTO privacy, scalability hot paths |
| `5cdf313` | Deduplication | Scans 44+ docs for hidden rules, creates HIDDEN_RULES_INVENTORY.md, adds anti-drift guard, standardizes 15 domain READMEs, adds canonical governance headers to 21 authority docs |
| (this PR) | Acceptance Audit | Final 20-point acceptance matrix, all gate results, PR readiness |

## New governance files

- `docs/governance/RULES_REGISTRY.yml` — 43 rules with IDs, severity, enforcement
- `docs/governance/GUARDS_REGISTRY.yml` — 47 guards with scripts, rules enforced
- `docs/governance/RULES_TO_GUARDS_MATRIX.md` — full coverage analysis
- `docs/governance/STATUS_TAXONOMY.md` — allowed statuses and evidence requirements
- `docs/governance/DOMAIN_STATUS_REGISTRY.yml` — machine-readable domain status
- `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md` — AI agent safety policy
- `docs/governance/AGENT_COMMAND_STANDARD.md` — task structure standard
- `docs/governance/HIDDEN_RULES_INVENTORY.md` — hidden rules audit results
- `docs/governance/REQUIRED_DOCS_BY_SCOPE.yml` — required reading per task type

## New guard scripts (15 new guards)

| Guard | Rules enforced |
|---|---|
| check-governance-registry.mjs | PX-GOV-001, PX-GOV-002 |
| check-guards-registry.mjs | PX-GOV-002 |
| check-rules-to-guards-coverage.mjs | PX-GOV-001, PX-GOV-002 |
| check-domain-status-registry.mjs | PX-STATUS-001 |
| check-ai-agent-permissions.mjs | PX-GOV-003/004, PX-INFRA-001/002 |
| check-architecture-import-graph.mjs | PX-ARCH-008/009 |
| check-runtime-readiness-status.mjs | PX-RUNTIME-001/002 |
| check-migration-safety.mjs | PX-DB-001/002/003 |
| check-dependency-change-policy.mjs | PX-DEPS-001 |
| check-exception-expiry.mjs | PX-EXC-001/002 |
| check-adr-required.mjs | PX-ADR-001 |
| check-observability-logging.mjs | PX-OBS-001/002 |
| check-dto-privacy-classification.mjs | PX-DTO-001 |
| check-scalability-hot-paths.mjs | PX-SCALE-001/002/003 |
| check-governance-drift.mjs | PX-GOV-005 |

## Test coverage

- 76 test files, 479 tests, all passing
- Guard tests include happy path + failure path scenarios
- Migration safety test: validates FAIL on DROP TABLE, PASS with approval marker
- No `.env` or external service dependencies

## Gate results

| Gate | Status |
|---|---|
| `pnpm check` (TypeScript) | PASS |
| `pnpm lint` (ESLint, 0 warnings) | PASS |
| `pnpm test` (Vitest, 479 tests) | PASS |
| `pnpm build` (Vite production) | PASS |
| `pnpm rules:check` (43 guards) | PASS |
| `pnpm arch:check:v2` (9 checks) | PASS |

## Risks

- **Low risk**: All changes are governance docs and guard scripts — no product code modified
- **CI duration**: 43 guards add ~8 seconds to `rules:check` — acceptable
- **False positives**: Guards use conservative patterns; existing codebase passes all checks

## What was NOT changed

- No product features, UI components, or routes
- No backend runtime code
- No database migrations applied
- No Railway configuration
- No dependencies added or removed
- No existing guard removed or weakened
- No existing test removed

## Merge readiness checklist

- [x] 6/6 gates green
- [x] 43/43 guards PASS
- [x] 20/20 acceptance checks PASS
- [x] CODEOWNERS complete
- [x] CI workflow covers all gates
- [x] Self-audit and step reports included
- [x] No blocked items
