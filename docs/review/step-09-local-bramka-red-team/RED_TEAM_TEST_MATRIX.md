# Step 09 — Red-Team Test Matrix

| # | Test | Injected violation | Expected guard | Actual result | Restored | Final status |
|---|---|---|---|---|---|---|
| 1 | Fake status | `BRAMKA_COMPLETE` + `FULL_DONE` in `client/src/App.tsx` | check-fake-done + rules:check | FAIL (exit 1) — 2 violations caught | YES | PASS |
| 2 | Legacy import (relative) | `import from "../../../features/legacy-example"` in `app-v2/__redteam__/` | check-no-legacy-imports | PASS (not caught) | YES | **BLOCKER** |
| 2b | Legacy import (caught by other guard) | same file | audit-domain-boundaries (via arch:check:v2) | FAIL (exit 1) — "features/" + "legacy" caught | YES | PARTIAL |
| 3 | Removed route | `/seller`, `/tasks`, `/fundraiser` in `app-v2/temp-route-test.ts` | check-removed-product-areas + rules:check | FAIL (exit 1) — 3 violations caught | YES | PASS |
| 4 | Cross-domain (relative) | `import from "../social/repository"` in `domains-v2/identity/` | audit-domain-boundaries + arch:check:v2 | PASS (not caught) | YES | **BLOCKER** |
| 4b | Cross-domain (absolute) | `import from "server/domains-v2/social/repository"` | audit-domain-boundaries | FAIL (exit 1) — caught | YES | PASS |
| 5 | Public DTO PII | `email`, `phone`, `dateOfBirth` in `domains-v2/identity/dto.ts` | check-public-dto-pii + arch:check:v2 | FAIL (exit 1) — 3 violations caught | YES | PASS |
| 6 | Media base64 | `readAsDataURL`, `dataUrl`, `base64` in `app-v2/temp-media-rt.ts` | check-media-base64 + rules:check | FAIL (exit 1) — 3 violations caught | YES | PASS |
| 7 | Env/secrets (placeholder) | `DATABASE_URL=postgresql://example` | check-env-safety | PASS (not caught — "example" skipped) | YES | **BLOCKER** |
| 7b | Env/secrets (real-looking) | `DATABASE_URL=postgresql://[REDACTED_CREDS]` | check-env-safety + rules:check | FAIL (exit 1) — 3 violations caught | YES | PASS |
| 8 | Test env | `dotenv.config({ path: ".env" })` in `test-setup.ts` | check-test-env-safety + rules:check | FAIL (exit 1) — 2 violations caught | YES | PASS |
| 9 | Pagination (db.select) | `db.select().from(users)` in `domains-v2/identity/` | check-pagination | PASS (not caught — no list keyword) | YES | **BLOCKER** |
| 9b | Pagination (findAll) | `db.findAll({})` in `domains-v2/identity/` | check-pagination + rules:check | FAIL (exit 1) — caught | YES | PASS |
| 10 | Bundle validator | `a\b.txt`, `.env`, `node_modules`, `dist`, `.git`, nested ZIP | validate-bundle classifyEntry | 7/7 patterns correctly classified | N/A | PASS |
| 11 | File complexity | 366-line React component in `app-v2/OverSizedComponent.tsx` | check-file-complexity + rules:check | FAIL (exit 1) — 366 > 350 caught | YES | PASS |
| 12 | No-op UI/alert/confirm | `onClick={() => {}}`, `window.alert`, `window.confirm` staged in `App.tsx` | check-diff-safety | FAIL (exit 1) — 3 violations caught | YES | PASS |
