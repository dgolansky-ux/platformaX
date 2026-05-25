# Step 11 — Guard Failure Evidence

## RT1: Fake status
```
FAKE_DONE_VIOLATION: "FULL_DONE" in client/src/App.tsx
FAKE_DONE_VIOLATION: "BRAMKA_COMPLETE" in client/src/App.tsx
check-fake-done: 2 violation(s) found — EXIT: 1
```

## RT2: Legacy import (relative)
```
LEGACY_IMPORT_VIOLATION: relative import contains legacy path "/features/" in
client/src/app-v2/__redteam__/LegacyImportRedTeam.ts
(import: "../../../features/legacy-example") — EXIT: 1
```

## RT3: Removed routes
```
REMOVED_PRODUCT_AREA: "seller" active in client/src/app-v2/temp-rt3.ts:2
REMOVED_PRODUCT_AREA: "tasks" active in client/src/app-v2/temp-rt3.ts:3
REMOVED_PRODUCT_AREA: "fundraiser" active in client/src/app-v2/temp-rt3.ts:4
check-removed-product-areas: 3 violation(s) — EXIT: 1
```

## RT4: Cross-domain (relative)
```
BOUNDARY_VIOLATION: cross-domain "repository" import from "social" in
server/domains-v2/identity/temp-rt4.ts
(import: "../social/repository", resolved: "server/domains-v2/social/repository") — EXIT: 1
```

## RT5: Public DTO PII
```
PUBLIC_DTO_PII: "email" in server/domains-v2/identity/dto.ts:3
PUBLIC_DTO_PII: "phone" in server/domains-v2/identity/dto.ts:4
PUBLIC_DTO_PII: "dateOfBirth" in server/domains-v2/identity/dto.ts:5
check-public-dto-pii: 3 violation(s) — EXIT: 1
```

## RT6: Media base64
```
MEDIA_BASE64_VIOLATION: "readAsDataURL" in client/src/app-v2/temp-rt6.ts
MEDIA_BASE64_VIOLATION: "dataUrl" in client/src/app-v2/temp-rt6.ts
MEDIA_BASE64_VIOLATION: "base64" in client/src/app-v2/temp-rt6.ts:1
check-media-base64: 3 violation(s) — EXIT: 1
```

## RT7: Env/secrets (with "example" — previously blocker)
```
ENV_SECRET_VIOLATION: "DATABASE_URL=" in server/temp-rt7.ts:1
ENV_SECRET_VIOLATION: "postgresql://" in server/temp-rt7.ts:1
ENV_SECRET_VIOLATION: "SUPABASE_SERVICE_ROLE_KEY=" in server/temp-rt7.ts:2
check-env-safety: 3 violation(s) — EXIT: 1
```

## RT8: Test env
```
TEST_ENV_VIOLATION: "dotenv.config({ path: ".env" })" in client/src/test-setup.ts
TEST_ENV_VIOLATION: "dotenv.config({ path: ".env"" in client/src/test-setup.ts
check-test-env-safety: 2 violation(s) — EXIT: 1
```

## RT9: Pagination (db.select — previously blocker)
```
PAGINATION_VIOLATION: unbounded query pattern without pagination in
server/domains-v2/identity/temp-rt9.ts
check-pagination: 2 violation(s) — EXIT: 1
```

## RT10: Bundle validator
```
RT10: 7/7 pass, 0 fail
```

## RT11: File complexity
```
COMPLEXITY_VIOLATION: client/src/app-v2/OverSized.tsx has 366 lines (component limit: 350)
check-file-complexity: 1 violation(s) — EXIT: 1
```

## RT12: No-op UI/alert/confirm
```
DIFF_SAFETY_VIOLATION: "onClick(() => {})" in client/src/App.tsx
DIFF_SAFETY_VIOLATION: "window.alert" in client/src/App.tsx
DIFF_SAFETY_VIOLATION: "window.confirm" in client/src/App.tsx
check-diff-safety: 3 violation(s) — EXIT: 1
```
