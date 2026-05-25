# PlatformaX V2 — Review Reports Index

Status: `ACTIVE`  
Owner: Governance / Evidence  
Purpose: prevent stale reports from being treated as current truth

## 1. Rule

A report is evidence only if it is current, indexed and tied to code state.

Old reports are allowed, but they must be marked historical, superseded or outdated.

## 2. Status values

| Status | Meaning |
|---|---|
| `ACTIVE_EVIDENCE` | Current evidence for the referenced commit/scope. |
| `HISTORICAL_REPORT` | Useful history, not current proof. |
| `OUTDATED_BY_NEW_AUDIT` | Superseded by a newer audit. |
| `SUPERSEDED` | Replaced by another report. |
| `BLOCKED` | Work stopped due to blocker. |
| `INVALID_EVIDENCE` | Report lacks logs, commit, scope or proof. |

## 3. Report index

| Report | Scope | Commit/Branch | Date | Current? | Status | Gates run | Notes |
|---|---|---|---|---|---|---|---|
| _none yet_ | _n/a_ | _n/a_ | _n/a_ | no | HISTORICAL_REPORT | none | initialize index |

## 4. Required report metadata

Every new report must include:

- title,
- date/time,
- branch,
- commit hash or explicit `NO_COMMIT`,
- scope,
- changed files,
- gates run,
- raw log paths,
- evidence files,
- final status,
- blockers,
- whether commit/merge is allowed.

## 5. Stale report rule

A report must not be used as current evidence if:

- it references old commit,
- code changed in relevant area,
- gates were not run,
- logs are missing,
- status is unsupported by code,
- new audit supersedes it.

## 6. Acceptance

This index is acceptable when every future report is added here and stale reports stop being treated as truth.
