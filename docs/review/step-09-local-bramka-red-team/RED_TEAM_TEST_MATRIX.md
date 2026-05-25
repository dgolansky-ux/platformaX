# Step 09 — Red-Team Test Matrix

| # | Test | Injected violation | Expected guard | Actual result | Restored | Final status |
|---|---|---|---|---|---|---|
| 1 | Fake status | `FULL_DONE` in `client/src/App.tsx` | check-fake-done | FAIL (exit 1) — caught `FULL_DONE` | YES | PASS |
| 2 | Legacy import | `from 'client/src/features/legacy-module'` in `client/src/app-v2/temp-red-team.ts` | check-no-legacy-imports | FAIL (exit 1) — caught legacy import | YES | PASS |
| 3 | Removed route | `/seller` comment in `client/src/App.tsx` | check-removed-product-areas | FAIL (exit 1) — caught `seller` | YES | PASS |
| 4 | Cross-domain import | `from 'server/domains-v2/social/repository'` in identity domain | audit-domain-boundaries | FAIL (exit 1) — caught cross-domain `repository` | YES | PASS |
| 5 | Public DTO PII | `email`, `phone` in `server/domains-v2/identity/dto.ts` | check-public-dto-pii | FAIL (exit 1) — caught 2 violations | YES | PASS |
| 6 | Media base64 | `readAsDataURL` in `client/src/app-v2/temp-media.ts` | check-media-base64 | FAIL (exit 1) — caught `readAsDataURL` | YES | PASS |
| 7 | Env/secrets | `DATABASE_URL=postgresql://admin:pass@host:5432/prod` in `server/config.ts` | check-env-safety | FAIL (exit 1) — caught 2 violations | YES | PASS |
| 8 | Test env | `dotenv.config({ path: ".env" })` in `client/src/test-setup.ts` | check-test-env-safety | FAIL (exit 1) — caught 2 violations | YES | PASS |
| 9 | Pagination | `findAll` without limit/cursor in `server/domains-v2/identity/list-users.ts` | check-pagination | FAIL (exit 1) — caught `findAll` without pagination | YES | PASS |
| 10 | Bundle validator | `a\b.txt`, `archive.zip`, `.env`, `node_modules/foo.js` via classifyEntry | validate-bundle (classifyEntry) | All 5 patterns detected | N/A (in-memory) | PASS |
| 11 | File complexity | 367-line React component in `client/src/app-v2/OverSizedComponent.tsx` | check-file-complexity | FAIL (exit 1) — 367 lines > 350 limit | YES | PASS |
| 12 | No-op UI | `onClick={() => {}}` staged in `client/src/App.tsx` | check-diff-safety | FAIL (exit 1) — caught `onClick={() => {}}` | YES | PASS |

## Summary

- **12/12 red-team tests PASSED** — all guards caught their respective violations
- **All violations restored** — working tree clean after all tests
- **Final gate run** — all gates PASS
