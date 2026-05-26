# Step 36 — Production-Grade Governance Hardening

Status: `PRODUCTION_GOVERNANCE_HARDENING_READY`
Branch: `chore/governance-foundation-pack`
Base commit: `d6e2f3a`
Date: 2026-05-26

## ADR IMPACT DECISION

This step adds 17 new governance rules and 9 new automated guard scripts.
These are additive governance mechanisms — no existing rules or guards are weakened or removed.
NO_ADR_REQUIRED: Governance hardening is the natural continuation of the governance foundation pack (steps 34-35). No new architectural decisions are introduced — only enforcement of existing architecture and coding standards.

## Summary

This step implements **production-grade governance hardening** for PlatformaX V2, adding 9 new automated guard gates that enforce architecture, runtime readiness, migration safety, dependency policy, exception management, ADR requirements, observability, DTO privacy, and scalability hot paths.

## Scope

### In scope
- 17 new rules in RULES_REGISTRY.yml
- 9 new guard scripts
- 9 new test files
- Guard registry, matrix, and rules-check integration
- Step report with evidence

### Not in scope
- Profile work
- Backend runtime
- UI changes
- Live migrations
- Railway deployment
- Dependency additions

## New Rules (17)

| ID | Title | Severity | Guard |
|---|---|---|---|
| PX-ARCH-008 | No circular domain dependencies | P0 | check-architecture-import-graph |
| PX-ARCH-009 | Import graph matches domain ownership | P0 | check-architecture-import-graph |
| PX-RUNTIME-001 | PARTIAL requires runtime evidence | P0 | check-runtime-readiness-status |
| PX-RUNTIME-002 | IMPLEMENTED requires full evidence | P0 | check-runtime-readiness-status |
| PX-DB-001 | No live db push without decision | P0 | check-migration-safety + manual_gate |
| PX-DB-002 | Migrations require safety review | P0 | check-migration-safety |
| PX-DB-003 | No destructive migration without approval | P0 | check-migration-safety |
| PX-DEPS-001 | No dependency changes without decision | P1 | check-dependency-change-policy |
| PX-ADR-001 | Architecture changes require ADR decision | P1 | check-adr-required |
| PX-OBS-001 | No unsafe console logging in runtime | P1 | check-observability-logging |
| PX-OBS-002 | No PII in logs/errors/audit | P0 | check-observability-logging |
| PX-EXC-001 | Exceptions require full metadata | P1 | check-exception-expiry |
| PX-EXC-002 | Expired exceptions fail gates | P0 | check-exception-expiry |
| PX-DTO-001 | Public DTO privacy classification | P1 | check-dto-privacy-classification |
| PX-SCALE-001 | No sync fanout in request path | P0 | check-scalability-hot-paths |
| PX-SCALE-002 | No unbounded hot-path loops | P0 | check-scalability-hot-paths |
| PX-SCALE-003 | No full scans for runtime lists | P0 | check-scalability-hot-paths |

## New Guards (9)

| Guard | Script | Rules Enforced | Registry ID |
|---|---|---|---|
| Architecture Import Graph | check-architecture-import-graph.mjs | PX-ARCH-008, PX-ARCH-009 | GUARD-038 |
| Runtime Readiness Status | check-runtime-readiness-status.mjs | PX-RUNTIME-001, PX-RUNTIME-002 | GUARD-039 |
| Migration Safety | check-migration-safety.mjs | PX-DB-001, PX-DB-002, PX-DB-003 | GUARD-040 |
| Dependency Change Policy | check-dependency-change-policy.mjs | PX-DEPS-001 | GUARD-041 |
| Exception Expiry | check-exception-expiry.mjs | PX-EXC-001, PX-EXC-002 | GUARD-042 |
| ADR Required | check-adr-required.mjs | PX-ADR-001 | GUARD-043 |
| Observability Logging | check-observability-logging.mjs | PX-OBS-001, PX-OBS-002 | GUARD-044 |
| DTO Privacy Classification | check-dto-privacy-classification.mjs | PX-DTO-001 | GUARD-045 |
| Scalability Hot Paths | check-scalability-hot-paths.mjs | PX-SCALE-001, PX-SCALE-002, PX-SCALE-003 | GUARD-046 |

## P0 Rules Now Enforced

All new P0 rules have automated guard enforcement:
- PX-ARCH-008: automated
- PX-ARCH-009: automated
- PX-RUNTIME-001: automated
- PX-RUNTIME-002: automated
- PX-DB-001: automated + manual_gate
- PX-DB-002: automated
- PX-DB-003: automated
- PX-OBS-002: automated
- PX-EXC-002: automated
- PX-SCALE-001: automated
- PX-SCALE-002: automated
- PX-SCALE-003: automated

## Manual Gates

- PX-DB-001: Requires separate owner decision for live db push
- PX-DB-003: Requires explicit manual approval for destructive migrations

## Evidence

### Runtime statuses are better protected
- SCAFFOLD_ONLY domains cannot have real runtime service/router
- PARTIAL domains must have service.ts, tests, public-api.ts
- IMPLEMENTED domains must have full runtime evidence

### Migration safety is protected
- Destructive patterns (DROP TABLE, DROP COLUMN, TRUNCATE, etc.) blocked without approval
- Live db push references blocked

### Dependency chaos is protected
- New dependency additions require DEPENDENCY_DECISION in review report

### ADR impact is protected
- Architecture-impacting file changes require ADR IMPACT DECISION in review

### Observability/logging/PII is protected
- console.log/debug in runtime code blocked (except tests/scripts)
- PII fields in log output blocked

### Scalability hot paths are protected
- Sync fanout loops blocked
- Unbounded hot-path loops blocked
- Full scans without limit/cursor blocked

## DEPENDENCY_DECISION

No new dependencies added in this step. All guards use Node.js built-in modules (fs, path, child_process).

## PRE-COMMIT DECISION

COMMIT_ALLOWED

Changed files: 9 guard scripts, 9 test files, 8 report files, 5 governance docs (RULES_REGISTRY, GUARDS_REGISTRY, RULES_TO_GUARDS_MATRIX, GOVERNANCE_INDEX, REVIEW_REPORTS_INDEX), 1 rules-check.mjs
Domains touched: none (governance/scripts only)
Cross-domain imports: none introduced
Legacy runtime imports: none
Removed routes/nav/build chunks: none
Public DTO PII: none introduced
Media base64/dataUrl: none
List pagination/limit/cursor: not applicable (no runtime changes)
Fake DONE/status truth: no fake DONE — status is PRODUCTION_GOVERNANCE_HARDENING_READY
Env safety: no .env changes
TypeScript: PASS (pnpm check)
V2 lint: PASS (pnpm lint)
Tests: PASS (475/475, pnpm test)
Build: PASS (pnpm build)
Commit decision: COMMIT_ALLOWED

## SELF-AUDIT / INDEPENDENT REVIEW PASS

1. **What I changed:** Added 17 governance rules, 9 guard scripts, 9 test files, updated registries/matrix/rules-check, created step-36 report
2. **What I might have broken:** Nothing — all changes are additive governance enforcement. No runtime code was touched.
3. **Domain boundaries affected:** None — guards are in scripts/, docs are in docs/
4. **Cross-domain imports check:** No cross-domain imports introduced. Guards scan for violations but don't import domain code.
5. **Legacy/runtime check:** No legacy runtime imported. No V2 runtime touched.
6. **Fake DONE/status truth check:** Status is PRODUCTION_GOVERNANCE_HARDENING_READY, not DONE. Evidence is gate logs.
7. **PII/base64/secrets check:** No PII, base64, or secrets introduced. Guards check for these patterns in existing code.
8. **Routes/nav/build graph check:** No routes, navigation, or build graph changes.
9. **Guard weakening check:** No guards weakened. All 37 existing guards unchanged. 9 new guards added.
10. **Evidence reviewed:** Gate logs from pnpm check/lint/test/build/rules:check
11. **Gates run:** pnpm check PASS, pnpm lint PASS, pnpm test PASS (475/475), pnpm build PASS, pnpm rules:check PASS
12. **Remaining risks:** None identified. All new gates are additive.
