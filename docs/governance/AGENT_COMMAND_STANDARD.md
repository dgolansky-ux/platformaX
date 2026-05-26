# PlatformaX V2 — Agent Command Standard

Status: `ACTIVE`
Owner: Governance

## Purpose

Every agent task must follow this standard structure.

---

## 1. Start Block

Every task must begin with:

```
TASK: <task name>
BRANCH: <branch name>
BASELINE:
  - pwd: <working directory>
  - git status: <clean/dirty>
  - git branch: <current branch>
  - git HEAD: <short hash>
SCOPE: <what this task covers>
FORBIDDEN:
  - <list of forbidden actions for this task>
EXPECTED FILES: <files expected to be created/modified>
DOCS READ:
  - <list of governance/architecture docs read>
```

## 2. Scope

- Clearly state what is in scope
- Clearly state what is NOT in scope
- If scope is unclear, mark as BLOCKED and ask

## 3. Forbidden Actions

Every task must list its forbidden actions. Minimum:

- No --no-verify
- No direct push to main
- No force push
- No fake DONE
- No guard weakening

Task-specific forbidden actions should be added.

## 4. Expected Files

List files expected to be created, modified, or deleted.

## 5. Gates

Before commit, run:

```
pnpm check
pnpm lint
pnpm test
pnpm build
pnpm rules:check
pnpm arch:check:v2
```

Record exit codes in report.

## 6. Self-Audit

Before reporting results, complete the 12-field self-audit:

1. What I changed
2. What I might have broken
3. Domain boundaries affected
4. Cross-domain imports check
5. Legacy/runtime check
6. Fake DONE/status truth check
7. PII/base64/secrets check
8. Routes/nav/build graph check
9. Guard weakening check
10. Evidence reviewed
11. Gates run
12. Remaining risks

## 7. Evidence

Provide real evidence:

- Command output with exit codes
- Changed file list
- Gate logs
- Status changes
- Blockers

Do not write PASS without a real log.

## 8. Final Status

End with one of:

```
STATUS: COMMIT_ALLOWED
STATUS: IN_PROGRESS
STATUS: BLOCKED
STATUS: REPAIR_DONE
```

If BLOCKED, provide:
- Reason
- What is needed
- Who needs to decide
