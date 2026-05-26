# PlatformaX V2 — Exceptions Register

Status: `ACTIVE`
Owner: Governance

## Purpose

Registry of active exceptions to governance rules. Every exception must be justified, time-bound, and reviewed.

## Format

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

No active exceptions.

## Expired / Revoked Exceptions

None.

## Rules

1. Exceptions must be approved by the project owner.
2. Exceptions must have an expiry date or condition.
3. Expired exceptions are automatically revoked.
4. Exceptions without evidence are invalid.
5. Broad exceptions (e.g. "all guards disabled") are forbidden.
6. Each exception applies to exactly one rule or a small named set.
