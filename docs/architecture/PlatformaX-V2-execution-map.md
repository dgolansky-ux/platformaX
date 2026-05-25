# PlatformaX V2 — Execution Map

Status: `ACTIVE`  
Owner: Project Execution / Governance  
Purpose: sequence work so quality gates are installed before feature work

## 1. Purpose

This file defines the execution order for PlatformaX V2.

Agents must not skip forward. A later step starts only when the previous step has explicit acceptance evidence.

## 2. Execution rule

No feature work before governance and gates.

No runtime integration before env and migration safety.

No deployment confidence before CI and branch protection.

No DONE without evidence.

## 3. Step overview

| Step | Name | Main output | Exit status |
|---:|---|---|---|
| 01 | Governance Foundation | docs, policies, ADR templates, ownership matrix | `L1_GOVERNANCE_READY` |
| 02 | Clean Repository Skeleton | app/server/shared/scripts/docs skeleton | `CLEAN_REPO_SKELETON_READY` |
| 03 | Core Check Scripts | `scripts/check-*`, validators, `rules:check` | `L2_GUARDS_READY` |
| 04 | Architecture Boundary Gates | arch-check, dependency boundaries, public API tests | `ARCHITECTURE_GATES_READY` |
| 05 | Status Truth Gates | fake DONE/status checkers | `STATUS_TRUTH_GATES_READY` |
| 06 | Legacy Containment Gates | no legacy imports/routes/chunks | `LEGACY_CONTAINMENT_READY` |
| 07 | Security and Env Gates | env safety, test env, secret scanning | `SECURITY_ENV_GATES_READY` |
| 08 | Code Quality Gates | lint, strict TS, complexity, test policy | `CODE_QUALITY_GATES_READY` |
| 09 | Build/Bundle/Performance Gates | bundle validator, removed chunk gate, budgets | `BUILD_BUNDLE_GATES_READY` |
| 10 | Local Git Gates | Husky, lint-staged, commitlint | `LOCAL_GIT_GATES_READY` |
| 11 | GitHub CI | required CI workflows | `CI_GATES_READY` |
| 12 | Repo Protection | branch protection, CODEOWNERS, PR template | `REPO_PROTECTION_READY` |
| 13 | Generators and Templates | scaffold-domain, scaffold-ui-shell, reports | `SCAFFOLDING_SYSTEM_READY` |
| 14 | Infrastructure Safety | Supabase/Railway staging policies and migration gate | `INFRA_SAFETY_READY` |
| 15 | Observability, Accessibility, Release Safety | basic health/error/a11y/release checklists | `RELEASE_SAFETY_BASELINE_READY` |
| 16 | Independent Audit Cycle | ultra-review bundle and audit process | `AUDIT_CYCLE_READY` |
| 17 | BRAMKA Acceptance Audit | all required items verified | `BRAMKA_COMPLETE` |

## 4. Step 01 — Governance Foundation

Create:

```txt
docs/architecture/PlatformaX-V2-active-rules.md
docs/architecture/PlatformaX-V2-coding-standards.md
docs/architecture/PlatformaX-V2-architecture-enforcement.md
docs/architecture/PlatformaX-V2-domain-status.md
docs/architecture/PlatformaX-V2-legacy-containment.md
docs/architecture/PlatformaX-V2-execution-map.md
docs/architecture/DOMAIN_OWNERSHIP_MATRIX.md
docs/architecture/adr/ADR-000-template.md
docs/review/REVIEW_REPORTS_INDEX.md
docs/ai/AGENT_OPERATING_STANDARD.md
docs/ai/AI_ALLOWED_ACTIONS.md
docs/ai/AI_FORBIDDEN_ACTIONS.md
docs/ai/REFERENCE_PACK_POLICY.md
docs/templates/ARCHITECTURE_IMPACT_STATEMENT.md
docs/templates/PRE_COMMIT_DECISION.md
docs/templates/EVIDENCE_BUNDLE_TEMPLATE.md
docs/templates/DOMAIN_README_TEMPLATE.md
docs/templates/UI_SHELL_README_TEMPLATE.md
docs/templates/CHANGE_REPORT_TEMPLATE.md
docs/quality-gates/GATE_ACCEPTANCE_MATRIX.md
```

Exit criteria:

- governance docs are coherent,
- no feature-specific execution shortcut,
- no fake DONE status,
- AI operating rules exist,
- ownership matrix exists,
- review report index exists,
- Step 02 is clearly defined.

## 5. Step 02 — Clean Repository Skeleton

Create:

```txt
client/
server/
shared/
scripts/
docs/
package.json
pnpm-lock.yaml
tsconfig.json
eslint.config.*
vite.config.*
vitest.config.*
.env.example
.env.test.example
```

Exit criteria:

- no legacy source folders,
- no real secrets,
- package scripts exist,
- basic test/build/lint/check commands run,
- docs from Step 01 are copied.

## 6. Step 03 — Core Check Scripts

Create:

```txt
scripts/check-diff-safety.mjs
scripts/no-commit-if-dirty-gates.mjs
scripts/check-fake-done.mjs
scripts/check-domain-status.mjs
scripts/check-removed-product-areas.mjs
scripts/check-no-legacy-imports.mjs
scripts/audit-domain-boundaries.mjs
scripts/check-test-env-safety.mjs
scripts/check-env-safety.mjs
scripts/check-public-dto-pii.mjs
scripts/check-media-base64.mjs
scripts/check-pagination.mjs
scripts/check-file-complexity.mjs
scripts/check-build-artifacts.mjs
scripts/check-supabase-migrations-safety.mjs
scripts/validate-bundle.mjs
```

Exit criteria:

- `pnpm rules:check` runs all critical guards,
- failing guard fails `rules:check`,
- guard outputs are clear,
- scripts fail closed.

## 7. Step 04 — Architecture Boundary Gates

Implement:

- backend forbidden import scanner,
- frontend import matrix scanner,
- public API surface checker,
- dependency-cruiser or ESLint boundaries,
- contract test skeleton.

Exit criteria:

- forbidden domain imports fail CI,
- app composition is allowed,
- feature internals are protected.

## 8. Step 05 — Status Truth Gates

Implement:

- fake DONE checker,
- domain status checker,
- report status checker,
- visual/backend status evidence validator.

Exit criteria:

- no unsupported `VISUAL_DONE`,
- no `BACKEND_DONE` without runtime,
- no `IMPLEMENTED` for scaffold,
- no “clean/final” without gates.

## 9. Step 06 — Legacy Containment Gates

Implement:

- no legacy runtime imports,
- removed product route scanner,
- backend router scanner,
- build chunk scanner,
- reference pack validator.

Exit criteria:

- removed routes/nav/chunks fail,
- legacy runtime imports fail,
- reference packs cannot enter active graph.

## 10. Step 07 — Security and Env Gates

Implement:

- `.env` safety
- `.env.test.example`
- no real env loading in tests
- gitleaks or equivalent scanner
- secret masking in logs
- frontend env allowlist

Exit criteria:

- secrets fail commit/CI,
- tests use safe env,
- service role never reaches frontend.

## 11. Step 08 — Code Quality Gates

Implement:

- strict TypeScript,
- V2 lint,
- complexity gate,
- test policy,
- no `as any`/`eslint-disable` without exception block.

Exit criteria:

- max warnings 0 where configured,
- file limits enforced,
- exceptions visible and reviewed.

## 12. Step 09 — Build/Bundle/Performance Gates

Implement:

- bundle validator,
- raw ZIP path validation,
- nested ZIP rejection,
- manifest/log requirement,
- removed chunk gate,
- size budget,
- build warning gate.

Exit criteria:

- invalid ZIP fails,
- removed chunks fail,
- unknown warnings fail.

## 13. Step 10 — Local Git Gates

Implement:

- Husky pre-commit,
- Husky pre-push,
- lint-staged,
- commitlint,
- `prepare: husky`.

Exit criteria:

- failing pre-commit blocks commit,
- failing pre-push blocks push,
- commit message lies are blocked.

## 14. Step 11 — GitHub CI

Implement workflows:

- rules
- arch
- check/typecheck
- lint
- test
- build
- secret scan
- bundle validation
- migration safety

Exit criteria:

- PR cannot merge without green required checks.

## 15. Step 12 — Repo Protection

Configure:

- protected `main`,
- protected `staging`,
- no direct push,
- PR required,
- required status checks,
- CODEOWNERS review,
- PR template with Architecture Impact Statement.

Exit criteria:

- GitHub blocks bad merge even if local hooks are bypassed.

## 16. Step 13 — Generators and Templates

Create:

- domain scaffold generator,
- UI shell scaffold generator,
- route scaffold generator,
- domain README template,
- UI shell README template,
- report template,
- ADR template.

Exit criteria:

- new domains/components follow standard shape by default.

## 17. Step 14 — Infrastructure Safety

Create:

- Supabase access policy,
- Railway deploy policy,
- migration safety gate,
- env inventory template,
- backup/rollback checklist.

Exit criteria:

- DB and deploy actions require explicit gates and approval.

## 18. Step 15 — Observability, Accessibility, Release Safety

Create baseline:

- health endpoint expectation,
- structured logging policy,
- no PII logs,
- error boundary policy,
- accessibility checklist,
- release checklist.

Exit criteria:

- release cannot claim readiness without safety evidence.

## 19. Step 16 — Independent Audit Cycle

Create:

- ultra-review bundle template,
- audit report template,
- audit schedule rule,
- stale report index rule.

Exit criteria:

- reports are indexed as active/historical/superseded,
- independent audit can verify current truth.

## 20. Step 17 — BRAMKA Acceptance Audit

Final acceptance requires all items in `docs/quality-gates/GATE_ACCEPTANCE_MATRIX.md` to pass.

If any P0 item is missing:

```txt
BRAMKA_IMPLEMENTATION_IN_PROGRESS
```

Only if all required items pass:

```txt
BRAMKA_COMPLETE
```

## 21. Work control rule

Agents must not jump steps.

If asked to work on a later step, they must first verify prior step status. If prior status is missing, the correct response is `BLOCKED_PREVIOUS_STEP_NOT_ACCEPTED`.
