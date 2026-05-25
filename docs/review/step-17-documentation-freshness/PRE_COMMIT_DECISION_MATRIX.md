# Step 17 — PRE-COMMIT DECISION Matrix

## Enforcement rules

| Rule | Description |
|---|---|
| Enforcement starts at | Step 17 |
| Steps before 17 | Exempt (pre-enforcement) |
| Historical marker | `HISTORICAL_REPORT_NO_PRE_COMMIT_DECISION` bypasses check |
| Required section | `PRE-COMMIT DECISION` |

## Required fields (15)

| # | Field | Purpose |
|---|---|---|
| 1 | Changed files | What files were modified |
| 2 | Domains touched | Which V2 domains affected |
| 3 | Cross-domain imports | Any cross-boundary imports |
| 4 | Legacy runtime imports | Any V1/legacy imports |
| 5 | Removed routes/nav/build chunks | Deleted routes or nav |
| 6 | Public DTO PII | PII in public DTOs |
| 7 | Media base64/dataUrl | Base64/dataUrl usage |
| 8 | List pagination/limit/cursor | Pagination enforcement |
| 9 | Fake DONE/status truth | Banned status strings |
| 10 | Env safety | Environment file safety |
| 11 | TypeScript | Type check result |
| 12 | V2 lint | Lint result |
| 13 | Tests | Test result |
| 14 | Build | Build result |
| 15 | Commit decision | Final commit/block decision |

## Current report compliance

| Report | Step | Has section | Fields | Status |
|---|---|---|---|---|
| step-17 STEP_17_REPORT.md | 17 | YES | 15/15 | PASS |
| Steps 1-16 | <17 | Exempt | N/A | PASS (pre-enforcement) |
