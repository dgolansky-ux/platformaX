# PlatformaX V2 — AI Agent Operating Standard

Status: `ACTIVE`  
Owner: Governance  
Applies to: any AI coding/review agent

## 1. Purpose

This document defines how an AI agent must work in this repo.

The agent is not allowed to optimize for “task completed” at the cost of architecture, evidence or truth.

## 2. Baseline before work

Before changing files, the agent must establish:

- current branch,
- git status,
- latest commit,
- requested scope,
- forbidden actions,
- relevant docs read,
- expected touched domains,
- current known blockers.

If the agent cannot inspect the repo, it must say so and avoid pretending.

## 3. Scope control

The agent may only do the requested task.

It must not:

- add unrelated features,
- opportunistically refactor unrelated domains,
- change gates to make its work pass,
- delete tests to get green output,
- silently change architecture,
- introduce legacy runtime,
- touch infrastructure without explicit task scope.

## 4. Required self-audit

Before final report, the agent must check:

- changed files,
- domains touched,
- cross-domain imports,
- legacy runtime imports,
- removed routes/nav/build chunks,
- public DTO PII,
- media base64/dataUrl,
- list pagination/limit/cursor,
- fake DONE/status truth,
- env safety,
- TypeScript,
- lint,
- tests,
- build,
- rules.

## 5. Evidence standard

The agent must provide real evidence:

- command output,
- logs,
- changed files,
- status changes,
- blockers,
- exact gates run.

It must not write `PASS` without a log or a reason why the check was not run.

## 6. Failure handling

If a gate fails, the agent must either:

- fix it within scope, or
- stop with `IN_PROGRESS` / `BLOCKED`.

It must not:

- mark DONE,
- hide the failure,
- weaken the gate,
- use `--no-verify`,
- invent evidence.

## 7. Final report structure

```md
# Final Report

Status: IN_PROGRESS | BLOCKED | REPAIR_DONE | UI_SHELL_ONLY | PARTIAL | IMPLEMENTED

## Baseline
- Branch:
- Commit:
- Initial status:

## Scope
- Requested:
- Not touched:

## Changed files
...

## Architecture impact
...

## Gates
| Gate | Status | Log |
|---|---|---|

## PRE-COMMIT DECISION
- Commit decision: COMMIT_ALLOWED / COMMIT_BLOCKED
- Reasons:

## Blockers
...

## Next step
...
```

## 8. Acceptance

Agent output is acceptable only when it is verifiable from code and logs.
