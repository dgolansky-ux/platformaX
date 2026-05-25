# Step 17 — Documentation Freshness Gate Report

Generated: 2026-05-25T10:02Z

## Summary

Added documentation freshness enforcement: REVIEW_REPORTS_INDEX.md tracks all review reports with status tracking, and two new guards enforce index consistency and PRE-COMMIT DECISION presence in reports from Step 17 onward.

## Changes

| File | Action |
|---|---|
| `docs/review/REVIEW_REPORTS_INDEX.md` | Created — master index of all review reports |
| `scripts/check-review-reports-index.mjs` | Created — index consistency guard |
| `scripts/check-pre-commit-decision.mjs` | Created — PRE-COMMIT DECISION enforcement |
| `scripts/__tests__/review-reports-index.test.ts` | Created — 10 tests |
| `scripts/__tests__/pre-commit-decision.test.ts` | Created — 8 tests |
| `package.json` | Added `guards:review`, updated `guards:all-local` |
| `scripts/rules-check.mjs` | Added both guards to umbrella |
| `.github/workflows/v2-gates.yml` | Added review reports CI step |

## Guards added

- `check-review-reports-index.mjs` — validates index exists, all step-* folders are indexed, statuses are from allowlist, ACTIVE_EVIDENCE has evidence path, SUPERSEDED has reference
- `check-pre-commit-decision.mjs` — enforces PRE-COMMIT DECISION section with 15 required fields in reports from Step 17+

## PRE-COMMIT DECISION

- Changed files: 8 files (2 guards, 2 tests, 1 index, package.json, rules-check, CI workflow)
- Domains touched: none (governance/docs only)
- Cross-domain imports: none
- Legacy runtime imports: none
- Removed routes/nav/build chunks: none
- Public DTO PII: none
- Media base64/dataUrl: none
- List pagination/limit/cursor: none
- Fake DONE/status truth: none — no banned statuses used
- Env safety: no .env changes
- TypeScript: PASS (tsc --noEmit)
- V2 lint: PASS (eslint --max-warnings=0)
- Tests: PASS (all tests including 18 new)
- Build: PASS (vite build)
- Commit decision: COMMIT_ALLOWED — all gates green, documentation-only change

## Final status

```
DOCUMENTATION_FRESHNESS_GATE_READY
```
