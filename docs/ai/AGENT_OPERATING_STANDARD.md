# PlatformaX V2 — AI Agent Operating Standard

Status: `ACTIVE`  
Owner: Governance  
Applies to: any AI coding/review agent  
Governance Index: `docs/governance/GOVERNANCE_INDEX.md`  
Permissions Policy: `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md`

> **Note:** `docs/governance/` is the central governance index and registry.
> This file remains the authoritative source of agent operating rules.
> See `docs/governance/README.md` for how governance files relate.

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

## 8. SELF-AUDIT / INDEPENDENT REVIEW PASS

After coding and before reporting results, the agent must perform a second pass as an independent reviewer. The agent must answer each question honestly and include the answers in the step report:

| # | Question | What to check |
|---|---|---|
| 1 | What I changed | List all files created, modified, or deleted |
| 2 | What I might have broken | Honest assessment — not "nothing" unless trivially true |
| 3 | Domain boundaries affected | Which V2 domains were touched or imported |
| 4 | Cross-domain imports check | Verified no illegal cross-domain imports exist |
| 5 | Legacy/runtime check | Verified no V1/legacy runtime was imported |
| 6 | Fake DONE/status truth check | No banned status strings introduced |
| 7 | PII/base64/secrets check | No PII in public DTOs, no base64 uploads, no secrets |
| 8 | Routes/nav/build graph check | No forbidden routes or nav/build graph changes |
| 9 | Guard weakening check | No guards removed, weakened, bypassed, or softened |
| 10 | Evidence reviewed | Which evidence files were verified (real paths, not invented) |
| 11 | Gates run | Full list of gates executed and their actual exit codes |
| 12 | Remaining risks | Known risks or items requiring human review |

The self-audit is not optional. Reports without this section are blocked by `check-self-audit-evidence.mjs`.

## 9. Acceptance

Agent output is acceptable only when it is verifiable from code and logs.

The agent must never:

- Trust its own prior output without re-checking the actual code.
- Report PASS without a real gate log or command output.
- Skip the self-audit section to save time.
- Mark work as complete when any gate is still failing.
