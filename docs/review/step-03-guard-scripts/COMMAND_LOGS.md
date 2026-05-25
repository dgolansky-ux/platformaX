# Step 03 — Command Logs

Generated: 2026-05-25T02:34Z

## Baseline (before guard scripts)

```
$ pnpm check
tsc --noEmit
EXIT: 0

$ pnpm lint
eslint . --max-warnings=0
EXIT: 0

$ pnpm test
vitest run
✓ server/index.test.ts (1 test)
✓ client/src/App.test.tsx (1 test)
Test Files  2 passed (2)
Tests  2 passed (2)
EXIT: 0

$ pnpm build
vite build
✓ 28 modules transformed
✓ built in 804ms
EXIT: 0

$ pnpm rules:check
BRAMKA_IMPLEMENTATION_IN_PROGRESS
rules:check placeholder exists, real gate scripts will be implemented in Step 3.
EXIT: 0 (PLACEHOLDER)

$ pnpm arch:check:v2
ARCH_CHECK_IMPLEMENTATION_IN_PROGRESS
arch-check placeholder exists, real architecture checks will be implemented in Step 3.
EXIT: 0 (PLACEHOLDER)
```

## Final validation (after guard scripts)

```
$ pnpm check
tsc --noEmit
EXIT: 0

$ pnpm lint
eslint . --max-warnings=0
EXIT: 0

$ pnpm test
vitest run
✓ scripts/__tests__/legacy-imports.test.ts (5 tests)
✓ scripts/__tests__/env-safety.test.ts (6 tests)
✓ scripts/__tests__/status-truth.test.ts (4 tests)
✓ scripts/__tests__/validate-bundle.test.ts (3 tests)
✓ server/index.test.ts (1 test)
✓ client/src/App.test.tsx (1 test)
Test Files  6 passed (6)
Tests  20 passed (20)
EXIT: 0

$ pnpm build
vite build
✓ 28 modules transformed
✓ built in 715ms
EXIT: 0

$ pnpm rules:check
  PASS  check-fake-done.mjs
  PASS  check-domain-status.mjs
  PASS  check-no-legacy-imports.mjs
  PASS  check-removed-product-areas.mjs
  PASS  audit-domain-boundaries.mjs
  PASS  check-test-env-safety.mjs
  PASS  check-env-safety.mjs
  PASS  check-public-dto-pii.mjs
  PASS  check-media-base64.mjs
  PASS  check-pagination.mjs
  PASS  check-file-complexity.mjs
  PASS  check-build-artifacts.mjs
  PASS  check-supabase-migrations-safety.mjs
  PASS  validate-bundle.mjs --smoke
RULES_CHECK_PASS
L2_GUARD_SCRIPTS_READY
EXIT: 0

$ pnpm arch:check:v2
  PASS  audit-domain-boundaries.mjs
  PASS  check-no-legacy-imports.mjs
  PASS  check-removed-product-areas.mjs
  PASS  check-public-dto-pii.mjs
  PASS  check-media-base64.mjs
  PASS  check-pagination.mjs
ARCH_CHECK_V2_PASS
EXIT: 0

$ pnpm guards:bundle
validate-bundle self-test: 6 passed, 0 failed
VALIDATE_BUNDLE_SMOKE_PASS
EXIT: 0
```
