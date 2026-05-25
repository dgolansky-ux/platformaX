# Step 10 — Fixed Blockers

## Blocker 1: check-no-legacy-imports.mjs

**Problem:** Guard only matched absolute-style import paths like `from "client/src/features/"`. Relative imports like `from "../../../features/legacy-example"` passed undetected.

**Fix:**
- Added `extractImportPaths()` function using regex to extract all import paths (static, dynamic, require)
- Added `resolveRelativeImport()` using `posix.normalize()` to resolve relative paths against the file's location
- Added `BLOCKED_RELATIVE_KEYWORDS` array for keyword matching on resolved paths
- Now detects both absolute AND relative legacy imports

**Evidence:**
```
LEGACY_IMPORT_VIOLATION: relative import contains legacy path "/features/" in
client/src/app-v2/__redteam__/LegacyImportRedTeam.ts (import: "../../../features/legacy-example")
EXIT: 1
```

## Blocker 2: audit-domain-boundaries.mjs

**Problem:** Guard only matched `domains-v2/<other>/repository` regex patterns in raw import strings. Relative imports like `from "../social/repository"` passed undetected.

**Fix:**
- Added `extractImportPaths()`, `resolveRelativeImport()`, `getImportedDomainAndModule()` functions
- For relative imports: resolves the path, extracts target domain + module name, compares against current domain
- Blocks cross-domain access to `repository`, `service`, `policy`, `router`, `mapper`, `db`, `schema`, `cache-keys`, `internal`
- Still allows `public-api`, `contracts`, `events`, `dto`, `shared`

**Evidence:**
```
BOUNDARY_VIOLATION: cross-domain "repository" import from "social" in
server/domains-v2/identity/temp-cross-domain.ts
(import: "../social/repository", resolved: "server/domains-v2/social/repository")
EXIT: 1
```

## Blocker 3: check-env-safety.mjs

**Problem:** Guard skipped ALL lines containing "example" keyword, even in source code files where `DATABASE_URL=postgresql://example` is a real risk.

**Fix:**
- Created `isPlaceholderSafeFile()` function
- "example"/"placeholder" keywords are now only allowed in:
  - `.env.example`, `.env.test.example`
  - Files under `docs/security/`, `docs/templates/`
- Source code files (`server/`, `client/`, `shared/`, configs) are always checked regardless of "example" keyword

**Evidence:**
```
ENV_SECRET_VIOLATION: "DATABASE_URL=" in server/temp-env-rt.ts:1
ENV_SECRET_VIOLATION: "postgresql://" in server/temp-env-rt.ts:1
ENV_SECRET_VIOLATION: "SUPABASE_SERVICE_ROLE_KEY=" in server/temp-env-rt.ts:2
EXIT: 1
```

## Blocker 4: check-pagination.mjs

**Problem:** Guard only detected specific keyword-based list indicators (`findAll`, `findMany`, etc.). ORM query builder patterns like `db.select().from(users)` passed undetected.

**Fix:**
- Added `QUERY_PATTERNS` array with regexes for `.select().from(` and `db.select().from(`
- Added `getAll` to `LIST_INDICATORS`
- Added `SAFE_MARKERS` (`MOCK_LOCAL_ONLY`, `FIXED_CAP`, `UI_ONLY`, `TEST_FIXTURE`) — files containing these markers are skipped

**Evidence:**
```
PAGINATION_VIOLATION: unbounded query pattern without pagination in
server/domains-v2/identity/temp-list-rt.ts
EXIT: 1
```
