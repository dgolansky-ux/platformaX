# Step 11 — Full Red-Team Rerun Matrix

| # | Test | Injected violation | Expected guard | Actual result | Restored | Status |
|---|---|---|---|---|---|---|
| 1 | Fake status | `BRAMKA_COMPLETE` + `FULL_DONE` in App.tsx | check-fake-done | FAIL (exit 1) — 2 violations | YES | PASS |
| 2 | Legacy import (relative) | `from "../../../features/legacy-example"` in app-v2 | check-no-legacy-imports | FAIL (exit 1) — `/features/` caught | YES | PASS |
| 3 | Removed routes | `/seller`, `/tasks`, `/fundraiser` in app-v2 | check-removed-product-areas | FAIL (exit 1) — 3 violations | YES | PASS |
| 4 | Cross-domain (relative) | `from "../social/repository"` in domains-v2/identity | audit-domain-boundaries | FAIL (exit 1) — resolved + caught | YES | PASS |
| 5 | Public DTO PII | `email`, `phone`, `dateOfBirth` in dto.ts | check-public-dto-pii | FAIL (exit 1) — 3 violations | YES | PASS |
| 6 | Media base64 | `readAsDataURL`, `dataUrl`, `base64` in app-v2 | check-media-base64 | FAIL (exit 1) — 3 violations | YES | PASS |
| 7 | Env/secrets | `DATABASE_URL=postgresql://example` in server/ | check-env-safety | FAIL (exit 1) — 3 violations | YES | PASS |
| 8 | Test env | `dotenv.config({ path: ".env" })` in test-setup.ts | check-test-env-safety | FAIL (exit 1) — 2 violations | YES | PASS |
| 9 | Pagination | `db.select().from(users)` without limit in domains-v2 | check-pagination | FAIL (exit 1) — 2 violations | YES | PASS |
| 10 | Bundle validator | backslash, nested zip, .env, node_modules, dist, .git | validate-bundle classifyEntry | 7/7 patterns correct | N/A | PASS |
| 11 | File complexity | 366-line component (limit: 350) | check-file-complexity | FAIL (exit 1) | YES | PASS |
| 12 | No-op UI/alert/confirm | `onClick={() => {}}`, `window.alert`, `window.confirm` | check-diff-safety | FAIL (exit 1) — 3 violations | YES | PASS |

**12/12 red-team tests PASSED.** All previously-blocked tests (2, 4, 7, 9) now correctly detect violations after Step 10 fixes.
