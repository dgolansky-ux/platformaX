# Step 16 — Red-Team Secret Tests

## Test methodology

Dummy secret-looking patterns were injected into `__redteam_secret_test.ts` and `.env`. The scanner was run after each injection. After verification, all test files were deleted and the scanner was confirmed to pass.

No real secrets were used.

## Test 1: Dummy secrets in source file

Injected `__redteam_secret_test.ts`:
- Line 1: `postgresql://admin:****@prod-db.internal:5432/platformax`
- Line 2: JWT literal `eyJhbGciOi****`
- Line 3: OpenAI-style key `sk-****`
- Line 4: Stripe test key `sk_test_****`

Result: **4 violations caught**

| # | Type | File | Line | Caught |
|---|---|---|---|---|
| 1 | PostgreSQL connection string | `__redteam_secret_test.ts` | 1 | YES |
| 2 | JWT token literal | `__redteam_secret_test.ts` | 2 | YES |
| 3 | OpenAI-style key (sk-) | `__redteam_secret_test.ts` | 3 | YES |
| 4 | Stripe test key (sk_test) | `__redteam_secret_test.ts` | 4 | YES |

All values masked in output (showed only first 4 chars + `****`).

## Test 2: Tracked .env file

Created `.env` with dummy content.

Result: **1 additional violation caught** (TRACKED_ENV_FILE)

| # | Type | File | Caught |
|---|---|---|---|
| 5 | TRACKED_ENV_FILE | `.env` | YES |

## Test 3: Restore verification

- Deleted `__redteam_secret_test.ts`
- Deleted `.env`
- Re-ran scanner: `CHECK_SECRET_SCAN_PASS`

## Summary

| Test | Expected | Actual | Status |
|---|---|---|---|
| PostgreSQL in source | FAIL | FAIL (caught) | PASS |
| JWT literal in source | FAIL | FAIL (caught) | PASS |
| OpenAI key in source | FAIL | FAIL (caught) | PASS |
| Stripe test key in source | FAIL | FAIL (caught) | PASS |
| Tracked .env | FAIL | FAIL (caught) | PASS |
| Values masked in output | YES | YES | PASS |
| Clean after restore | PASS | PASS | PASS |
