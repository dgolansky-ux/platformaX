# PRE-COMMIT DECISION

Status: `REQUIRED_BEFORE_COMMIT`

## Summary

- Branch:
- Commit before changes:
- Changed files:
- Domains touched:
- Scope respected: PASS/FAIL

## Checks

| Check | Status | Evidence |
|---|---|---|
| Cross-domain imports | PASS/FAIL | |
| Legacy runtime imports | PASS/FAIL | |
| Removed routes/nav/build chunks | PASS/FAIL | |
| Public DTO PII | PASS/FAIL/NA | |
| Media base64/dataUrl | PASS/FAIL/NA | |
| List pagination/limit/cursor | PASS/FAIL/NA | |
| Fake DONE/status truth | PASS/FAIL | |
| Env safety | PASS/FAIL | |
| TypeScript | PASS/FAIL | |
| V2 lint | PASS/FAIL | |
| Tests | PASS/FAIL | |
| Build | PASS/FAIL | |
| rules:check | PASS/FAIL | |

## Commit decision

Commit decision: `COMMIT_ALLOWED` / `COMMIT_BLOCKED`

## If blocked

- Blocking gates:
- Required next action:
- Final task status: `IN_PROGRESS` / `BLOCKED`
