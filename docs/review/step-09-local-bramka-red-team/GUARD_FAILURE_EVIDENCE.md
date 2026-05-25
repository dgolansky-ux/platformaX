# Step 09 — Guard Failure Evidence

Short logs from each controlled violation.

## RT1: Fake status (FULL_DONE)

```
FAKE_DONE_VIOLATION: "FULL_DONE" in client/src/App.tsx
check-fake-done: 1 violation(s) found
EXIT: 1
```

## RT2: Legacy import

```
LEGACY_IMPORT_VIOLATION: "client/src/features/" imported in client/src/app-v2/temp-red-team.ts
check-no-legacy-imports: 1 violation(s)
EXIT: 1
```

## RT3: Removed route (/seller)

```
REMOVED_PRODUCT_AREA: "seller" active in client/src/App.tsx:17
check-removed-product-areas: 1 violation(s)
EXIT: 1
```

## RT4: Cross-domain internal import

```
BOUNDARY_VIOLATION: cross-domain "repository" import in server/domains-v2/identity/temp-red-team.ts
audit-domain-boundaries: 1 violation(s)
EXIT: 1
```

## RT5: Public DTO PII

```
PUBLIC_DTO_PII: "email" in server/domains-v2/identity/dto.ts:3
PUBLIC_DTO_PII: "phone" in server/domains-v2/identity/dto.ts:4
check-public-dto-pii: 2 violation(s)
EXIT: 1
```

## RT6: Media base64

```
MEDIA_BASE64_VIOLATION: "readAsDataURL" in client/src/app-v2/temp-media.ts
check-media-base64: 1 violation(s)
EXIT: 1
```

## RT7: Env/secrets

```
ENV_SECRET_VIOLATION: "DATABASE_URL=" in server/config.ts:1
ENV_SECRET_VIOLATION: "postgresql://" in server/config.ts:1
check-env-safety: 2 violation(s)
EXIT: 1
```

## RT8: Test env

```
TEST_ENV_VIOLATION: "dotenv.config({ path: ".env" })" in client/src/test-setup.ts
TEST_ENV_VIOLATION: "dotenv.config({ path: ".env"" in client/src/test-setup.ts
check-test-env-safety: 2 violation(s)
EXIT: 1
```

## RT9: Pagination

```
PAGINATION_VIOLATION: "findAll" without pagination in server/domains-v2/identity/list-users.ts
check-pagination: 1 violation(s)
EXIT: 1
```

## RT10: Bundle validator

```
  PASS: a\b.txt -> [backslash_path]
  PASS: nested/archive.zip -> [nested_zip]
  PASS: .env -> [env_file]
  PASS: node_modules/foo.js -> [node_modules]
  PASS: clean/path.ts -> []
RT10 bundle: 5 pass, 0 fail
```

## RT11: File complexity

```
COMPLEXITY_VIOLATION: client/src/app-v2/OverSizedComponent.tsx has 367 lines (component limit: 350)
check-file-complexity: 1 violation(s)
EXIT: 1
```

## RT12: No-op UI (diff-safety)

```
DIFF_SAFETY_VIOLATION: "onClick={() => {})" in client/src/App.tsx
check-diff-safety: 1 violation(s)
EXIT: 1
```
