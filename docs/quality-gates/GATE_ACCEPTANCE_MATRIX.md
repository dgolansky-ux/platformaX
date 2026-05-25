# PlatformaX V2 — Gate Acceptance Matrix

Status: `ACTIVE`  
Owner: Governance / BRAMKA Acceptance

## 1. Purpose

This file is the acceptance checklist for BRAMKA completeness.

If any P0 item is missing, status is:

```txt
BRAMKA_IMPLEMENTATION_IN_PROGRESS
```

Only when every P0 item passes:

```txt
BRAMKA_COMPLETE
```

## 2. Acceptance matrix

| ID | Gate / artifact | Required | Status | Evidence |
|---|---|---:|---|---|
| G-001 | BRAMKA document exists and is current | P0 | TODO | |
| G-002 | active-rules.md exists | P0 | TODO | |
| G-003 | coding-standards.md exists | P0 | TODO | |
| G-004 | architecture-enforcement.md exists | P0 | TODO | |
| G-005 | domain-status.md exists | P0 | TODO | |
| G-006 | legacy-containment.md exists | P0 | TODO | |
| G-007 | execution-map.md exists | P0 | TODO | |
| G-008 | DOMAIN_OWNERSHIP_MATRIX.md exists | P0 | TODO | |
| G-009 | ADR folder and template exist | P0 | TODO | |
| G-010 | REVIEW_REPORTS_INDEX.md exists | P0 | TODO | |
| G-011 | AI operating standard exists | P0 | TODO | |
| G-012 | AI forbidden actions exist | P0 | TODO | |
| G-013 | rules:check is real umbrella gate | P0 | TODO | |
| G-014 | check-diff-safety exists | P0 | TODO | |
| G-015 | no-commit-if-dirty-gates exists | P0 | TODO | |
| G-016 | check-removed-product-areas scans routes/nav/build chunks | P0 | TODO | |
| G-017 | check-no-legacy-imports exists | P0 | TODO | |
| G-018 | audit-domain-boundaries exists | P0 | TODO | |
| G-019 | check-domain-status exists | P0 | TODO | |
| G-020 | check-fake-done/status truth exists | P0 | TODO | |
| G-021 | check-test-env-safety exists | P0 | TODO | |
| G-022 | check-env-safety exists | P0 | TODO | |
| G-023 | public DTO PII checker exists | P0 | TODO | |
| G-024 | media base64/dataUrl checker exists | P0 | TODO | |
| G-025 | pagination checker exists | P0 | TODO | |
| G-026 | file complexity checker exists | P1 | TODO | |
| G-027 | bundle validator catches raw backslash paths | P0 | TODO | |
| G-028 | bundle validator catches nested ZIP | P0 | TODO | |
| G-029 | bundle validator catches secrets | P0 | TODO | |
| G-030 | build artifact/removed chunk gate exists | P0 | TODO | |
| G-031 | Supabase migration safety gate exists | P0 before DB | TODO | |
| G-032 | Husky pre-commit exists | P0 | TODO | |
| G-033 | Husky pre-push exists | P0 | TODO | |
| G-034 | lint-staged configured | P1 | TODO | |
| G-035 | commitlint configured | P1 | TODO | |
| G-036 | secret scanner configured | P0 | TODO | |
| G-037 | GitHub CI runs rules/check/arch/lint/test/build | P0 | TODO | |
| G-038 | branch protection/rulesets configured | P0 | TODO | |
| G-039 | CODEOWNERS exists | P0 | TODO | |
| G-040 | PR template has Architecture Impact Statement | P0 | TODO | |
| G-041 | dependency boundary checker exists | P1 | TODO | |
| G-042 | contract tests pattern exists | P1 | TODO | |
| G-043 | generator/template system exists | P1 | TODO | |
| G-044 | observability/logging policy exists | P1 | TODO | |
| G-045 | accessibility baseline exists | P1 | TODO | |
| G-046 | release/backup/rollback checklist exists | P1 | TODO | |
| G-047 | evidence bundle template exists | P0 | TODO | |
| G-048 | independent audit cycle exists | P1 | TODO | |
| G-049 | commit blocked when gates fail | P0 | TODO | |
| G-050 | merge blocked when CI fails | P0 | TODO | |

## 3. Final decision

Current BRAMKA status:

```txt
BRAMKA_IMPLEMENTATION_IN_PROGRESS
```

Reason:

```txt
Step 01 provides governance artifacts only. Scripts, hooks, CI and repo protection are implemented in later steps.
```
