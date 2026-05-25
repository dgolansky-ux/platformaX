# Step 09 — Guard Failure Evidence

## RT1: Fake status (CAUGHT)

```
FAKE_DONE_VIOLATION: "FULL_DONE" in client/src/App.tsx
FAKE_DONE_VIOLATION: "BRAMKA_COMPLETE" in client/src/App.tsx
check-fake-done: 2 violation(s) found
EXIT: 1

rules-check: 1/14 guard(s) FAILED
EXIT: 1
```

## RT2: Legacy import — relative path (NOT CAUGHT by check-no-legacy-imports)

```
CHECK_NO_LEGACY_IMPORTS_PASS
EXIT: 0
```

Guard did not catch `import { something } from "../../../features/legacy-example"` because it only matches absolute-style paths like `from "client/src/features/"`.

## RT2b: Legacy import — caught by audit-domain-boundaries

```
BOUNDARY_VIOLATION: legacy import "features/" in client/src/app-v2/__redteam__/LegacyImportRedTeam.ts
BOUNDARY_VIOLATION: legacy import "legacy" in client/src/app-v2/__redteam__/LegacyImportRedTeam.ts
audit-domain-boundaries: 2 violation(s)
EXIT: 1

arch-check-v2: 1/6 guard(s) FAILED
EXIT: 1
```

## RT3: Removed routes (CAUGHT)

```
REMOVED_PRODUCT_AREA: "seller" active in client/src/app-v2/temp-route-test.ts:2
REMOVED_PRODUCT_AREA: "tasks" active in client/src/app-v2/temp-route-test.ts:3
REMOVED_PRODUCT_AREA: "fundraiser" active in client/src/app-v2/temp-route-test.ts:4
check-removed-product-areas: 3 violation(s)
EXIT: 1

rules-check: 1/14 guard(s) FAILED
EXIT: 1
```

## RT4: Cross-domain — relative path (NOT CAUGHT)

```
AUDIT_DOMAIN_BOUNDARIES_PASS
EXIT: 0

ARCH_CHECK_V2_PASS
EXIT: 0
```

Guard did not catch `import { something } from "../social/repository"`. Only matches `domains-v2/<other>/repository` in import strings.

## RT4b: Cross-domain — absolute path (CAUGHT)

```
BOUNDARY_VIOLATION: cross-domain "repository" import in server/domains-v2/identity/temp-cross-domain.ts
audit-domain-boundaries: 1 violation(s)
EXIT: 1
```

## RT5: Public DTO PII (CAUGHT)

```
PUBLIC_DTO_PII: "email" in server/domains-v2/identity/dto.ts:3
PUBLIC_DTO_PII: "phone" in server/domains-v2/identity/dto.ts:4
PUBLIC_DTO_PII: "dateOfBirth" in server/domains-v2/identity/dto.ts:5
check-public-dto-pii: 3 violation(s)
EXIT: 1

arch-check-v2: 1/6 guard(s) FAILED
EXIT: 1
```

## RT6: Media base64 (CAUGHT)

```
MEDIA_BASE64_VIOLATION: "readAsDataURL" in client/src/app-v2/temp-media-rt.ts
MEDIA_BASE64_VIOLATION: "dataUrl" in client/src/app-v2/temp-media-rt.ts
MEDIA_BASE64_VIOLATION: "base64" in client/src/app-v2/temp-media-rt.ts:1
check-media-base64: 3 violation(s)
EXIT: 1

rules-check: 1/14 guard(s) FAILED
EXIT: 1
```

## RT7: Env/secrets — placeholder with "example" (NOT CAUGHT)

```
CHECK_ENV_SAFETY_PASS
EXIT: 0
```

Guard skips lines containing "example" (line 66 of check-env-safety.mjs). Injection `DATABASE_URL=postgresql://example` was not flagged.

## RT7b: Env/secrets — real-looking value (CAUGHT)

```
ENV_SECRET_VIOLATION: "DATABASE_URL=" in server/temp-env-rt.ts:1
ENV_SECRET_VIOLATION: "postgresql://" in server/temp-env-rt.ts:1
ENV_SECRET_VIOLATION: "SUPABASE_SERVICE_ROLE_KEY=" in server/temp-env-rt.ts:2
check-env-safety: 3 violation(s)
EXIT: 1

rules-check: 1/14 guard(s) FAILED
EXIT: 1
```

## RT8: Test env (CAUGHT)

```
TEST_ENV_VIOLATION: "dotenv.config({ path: ".env" })" in client/src/test-setup.ts
TEST_ENV_VIOLATION: "dotenv.config({ path: ".env"" in client/src/test-setup.ts
check-test-env-safety: 2 violation(s)
EXIT: 1

rules-check: 1/14 guard(s) FAILED
EXIT: 1
```

## RT9: Pagination — db.select (NOT CAUGHT)

```
PAGINATION_CHECK_NO_RUNTIME_LISTS
EXIT: 0
```

Guard only detects specific keywords: `findAll`, `findMany`, `getList`, `fetchList`, `listAll`, `searchAll`, `getFeed`, `fetchFeed`, `queryAll`. Generic `db.select().from(users)` does not match.

## RT9b: Pagination — findAll (CAUGHT)

```
PAGINATION_VIOLATION: "findAll" without pagination in server/domains-v2/identity/temp-list-rt.ts
check-pagination: 1 violation(s)
EXIT: 1

rules-check: 1/14 guard(s) FAILED
EXIT: 1
```

## RT10: Bundle validator (CAUGHT — all patterns)

```
PASS: a\b.txt -> [backslash_path]
PASS: a/b.txt -> []
PASS: nested/archive.zip -> [nested_zip]
PASS: .env -> [env_file]
PASS: node_modules/foo.js -> [node_modules]
PASS: dist/bundle.js -> [dist]
PASS: .git/HEAD -> [dot_git]
RT10: 7 pass, 0 fail
```

## RT11: File complexity (CAUGHT)

```
COMPLEXITY_VIOLATION: client/src/app-v2/OverSizedComponent.tsx has 366 lines (component limit: 350)
check-file-complexity: 1 violation(s)
EXIT: 1

rules-check: 1/14 guard(s) FAILED
EXIT: 1
```

## RT12: No-op UI / alert / confirm (CAUGHT)

```
DIFF_SAFETY_VIOLATION: "onClick(() => {})" in client/src/App.tsx
DIFF_SAFETY_VIOLATION: "window.alert" in client/src/App.tsx
DIFF_SAFETY_VIOLATION: "window.confirm" in client/src/App.tsx
check-diff-safety: 3 violation(s)
EXIT: 1
```
