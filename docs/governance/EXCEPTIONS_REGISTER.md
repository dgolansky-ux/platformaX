# PlatformaX V2 — Exceptions Register

Status: `ACTIVE`
Owner: Governance

## Purpose

Registry of active exceptions to governance rules. Every exception must be justified, time-bound, and reviewed.

## Format

Canonical inline exception block:

```txt
PLATFORMAX_EXCEPTION:
Rule:
Scope:
Reason:
Risk:
Owner:
Expiry:
Removal plan:
Evidence:
```

All code-quality, file-size, structure, and lint exceptions use this format.
Deprecated markers (`ALLOW_FILE_SIZE_EXCEPTION`, `QUALITY_STRUCTURE_EXCEPTION`,
`COMPLEXITY_EXCEPTION`, `eslint-disable max-lines`) are aliases only and are
valid only when accompanied by this canonical block or a matching register row.

| Field | Description |
|---|---|
| Exception ID | Unique identifier (EXC-NNN) |
| Rule ID | Which rule is being excepted |
| Reason | Why the exception is needed |
| Expiry | When this exception expires or must be reviewed |
| Owner | Who approved the exception |
| Evidence | Link to ADR, report, or approval |
| Risk | What risk this exception introduces |
| Status | active / expired / revoked |

## Active Exceptions

| Exception ID | Rule ID | File / Scope | Reason | Expiry | Owner | Evidence | Risk | Status |
|---|---|---|---|---|---|---|---|---|
| EXC-001 | check-code-quality-structure (15-export soft cap; partial PX-CODE-001/002 family) | `shared/contracts/profile-view.ts` | Canonical wire-contract surface for the profile application boundary per ADR-010 / PX-APP-001. The 17 exports (value objects + composed views + inputs + error contract + port) are one cohesive contract; splitting them creates multiple import paths for one logical boundary. | Re-review when a second application boundary (e.g. communities, content) requires its own contract file — at that point, generalise the pattern or split. No later than 2026-11-30. | architecture | ADR-010, file docblock, governance reconciliation step-49 | If the file grows additional unrelated exports, the boundary gets noisy; mitigated by the file's narrow scope (profile only) and the broader code-quality function/component caps still applying via `check-file-complexity.mjs`. | active |

## Expired / Revoked Exceptions

None.

## Rules

1. Exceptions must be approved by the project owner.
2. Exceptions must have an expiry date or condition.
3. Expired exceptions are automatically revoked.
4. Exceptions without evidence are invalid.
5. Broad exceptions (e.g. "all guards disabled") are forbidden.
6. Each exception applies to exactly one rule or a small named set.
