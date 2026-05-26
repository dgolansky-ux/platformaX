# Step 37 — Command Logs

## Gate Results

### pnpm check
```
$ tsc --noEmit
Exit code: 0
```

### pnpm lint
```
$ eslint . --max-warnings=0
Exit code: 0
```

### pnpm test
```
$ vitest run
Test Files  76 passed (76)
     Tests  479 passed (479)
Exit code: 0
```

### pnpm build
```
$ vite build
✓ 177 modules transformed.
✓ built in 6.49s
Exit code: 0
```

### pnpm rules:check
```
$ node scripts/rules-check.mjs
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
  PASS  check-file-size-limits.mjs
  PASS  check-build-artifacts.mjs
  PASS  check-supabase-migrations-safety.mjs
  PASS  check-domain-registry.mjs
  PASS  check-domain-scaffold.mjs
  PASS  check-feature-registry.mjs
  PASS  check-secret-scan.mjs
  PASS  check-review-reports-index.mjs
  PASS  check-pre-commit-decision.mjs
  PASS  check-self-audit-evidence.mjs
  PASS  validate-bundle.mjs --smoke
  PASS  check-code-quality-structure.mjs
  PASS  check-scalability-patterns.mjs
  PASS  check-frontend-performance-patterns.mjs
  PASS  check-status-truth-consistency.mjs
  PASS  check-dependency-discipline.mjs
  PASS  check-logging-pii-security.mjs
  PASS  check-governance-registry.mjs
  PASS  check-guards-registry.mjs
  PASS  check-rules-to-guards-coverage.mjs
  PASS  check-domain-status-registry.mjs
  PASS  check-ai-agent-permissions.mjs
  PASS  check-architecture-import-graph.mjs
  PASS  check-runtime-readiness-status.mjs
  PASS  check-migration-safety.mjs
  PASS  check-dependency-change-policy.mjs
  PASS  check-exception-expiry.mjs
  PASS  check-adr-required.mjs
  PASS  check-observability-logging.mjs
  PASS  check-dto-privacy-classification.mjs
  PASS  check-scalability-hot-paths.mjs
  PASS  check-governance-drift.mjs

RULES_CHECK_PASS
L2_GUARD_SCRIPTS_READY
Exit code: 0
```

### pnpm arch:check:v2
```
$ node scripts/arch-check-v2.mjs
  PASS  audit-domain-boundaries.mjs
  PASS  check-no-legacy-imports.mjs
  PASS  check-removed-product-areas.mjs
  PASS  check-public-dto-pii.mjs
  PASS  check-media-base64.mjs
  PASS  check-pagination.mjs
  PASS  check-domain-registry.mjs
  PASS  check-domain-scaffold.mjs
  PASS  check-feature-registry.mjs

ARCH_CHECK_V2_PASS
Exit code: 0
```

## Summary

| Gate | Status | Exit code |
|---|---|---|
| pnpm check | PASS | 0 |
| pnpm lint | PASS | 0 |
| pnpm test | PASS | 0 |
| pnpm build | PASS | 0 |
| pnpm rules:check | PASS | 0 |
| pnpm arch:check:v2 | PASS | 0 |

All 43 guards green. All 6 gates green.
