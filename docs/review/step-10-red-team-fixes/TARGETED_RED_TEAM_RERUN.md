# Step 10 — Targeted Red-Team Rerun

All 4 previously-failing blockers retested with the same injection patterns from Step 09.

## Rerun 1: Relative legacy import

- **Injection:** `import { something } from "../../../features/legacy-example"` in `client/src/app-v2/__redteam__/LegacyImportRedTeam.ts`
- **check-no-legacy-imports:** FAIL (exit 1) — caught `/features/` in resolved path
- **arch:check:v2:** FAIL (exit 1) — 2/6 guards failed
- **Restored:** PASS (exit 0)

## Rerun 2: Relative cross-domain import

- **Injection:** `import { something } from "../social/repository"` in `server/domains-v2/identity/temp-cross-domain.ts`
- **audit-domain-boundaries:** FAIL (exit 1) — resolved to `server/domains-v2/social/repository`, cross-domain blocked
- **arch:check:v2:** FAIL (exit 1) — 1/6 guards failed
- **Restored:** PASS (exit 0)

## Rerun 3: Env/secrets with "example" keyword

- **Injection:** `DATABASE_URL=postgresql://example` + `SUPABASE_SERVICE_ROLE_KEY=example` in `server/temp-env-rt.ts`
- **check-env-safety:** FAIL (exit 1) — 3 violations (DATABASE_URL=, postgresql://, SUPABASE_SERVICE_ROLE_KEY=)
- **rules:check:** FAIL (exit 1) — 1/14 guards failed
- **Restored:** PASS (exit 0)

## Rerun 4: Pagination with db.select().from()

- **Injection:** `db.select().from(users)` without limit/cursor in `server/domains-v2/identity/temp-list-rt.ts`
- **check-pagination:** FAIL (exit 1) — unbounded query pattern detected
- **rules:check:** FAIL (exit 1) — 1/14 guards failed
- **Restored:** PASS (exit 0)

## Summary

**4/4 blockers now correctly detect violations.**
All injections reverted. All gates PASS after cleanup.
