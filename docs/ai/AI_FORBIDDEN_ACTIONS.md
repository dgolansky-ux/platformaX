# PlatformaX V2 — AI Forbidden Actions

Status: `ACTIVE`  
Owner: Governance

## 1. Purpose

This file lists actions an AI agent must not perform.

## 2. Hard forbidden

The agent must not:

- use `--no-verify` unless explicitly instructed by owner,
- commit when gates fail,
- mark work DONE without evidence,
- weaken a guard to pass its own task,
- delete tests because they fail,
- hide failures behind warnings,
- invent logs,
- invent screenshots,
- invent manual review,
- write fake status,
- import legacy runtime,
- add active removed routes,
- add active legacy backend routers,
- add service role or secrets to frontend,
- write real secrets to repo,
- make tests read real `.env`,
- use base64/dataUrl runtime upload,
- expose public PII,
- return raw DB rows from public API,
- bypass public-api/contracts/events through deep imports,
- add no-op buttons as final UI,
- use `window.alert` / `window.confirm` as product UI,
- create broad allowlists without tests,
- add `eslint-disable` or `as any` as a shortcut,
- run destructive DB changes without explicit approval,
- deploy production without explicit approval.

## 3. Audit and verification prohibitions

The agent must not:

- trust its own report without verifying the actual code matches the claims,
- mark PASS without a real gate log (exit code 0 from an actual command execution),
- modify any guard script without first writing a red-team test proving the guard still catches violations,
- skip the SELF-AUDIT / INDEPENDENT REVIEW PASS section in any Step 17+ report,
- push directly to `main` — all changes must go through a branch and PR,
- create a PR without an Architecture Impact Statement,
- claim "all gates pass" without actually running every gate and recording the output,
- weaken a guard's regex, allowlist, or threshold to make its own task pass,
- remove a test that was passing before its changes.

## 4. Forbidden report language without evidence

- DONE
- final
- complete
- clean
- production-ready
- visual done
- backend done
- full done
- all green

## 5. Required alternative

If the agent is blocked, it must write:

```txt
Status: BLOCKED
Reason:
Evidence:
What is needed:
```

If the agent partially completed work, it must write:

```txt
Status: IN_PROGRESS
Completed:
Remaining:
Failing gates:
```
