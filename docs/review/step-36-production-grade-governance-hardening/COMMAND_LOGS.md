# Step 36 — Command Logs

## Gate Results

### pnpm check
```
Exit code: 0
$ tsc --noEmit
```

### pnpm lint
```
Exit code: 0
$ eslint . --max-warnings=0
```

### pnpm test
```
Exit code: 0
Test Files  75 passed (75)
     Tests  475 passed (475)
Duration  25.68s
```

### pnpm build
```
Exit code: 0
$ vite build
✓ 177 modules transformed.
dist/index.html                   0.40 kB
dist/assets/index-Dff6Q3vv.css   63.00 kB
dist/assets/index-DAFstGRR.js   319.91 kB
✓ built in 1.43s
```

### pnpm rules:check (42/42 PASS)
```
Exit code: 0
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

RULES_CHECK_PASS
L2_GUARD_SCRIPTS_READY
```

### pnpm arch:check:v2
```
Exit code: 0
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
```

## Summary

| Gate | Result |
|---|---|
| pnpm check | PASS |
| pnpm lint | PASS |
| pnpm test | PASS (475/475) |
| pnpm build | PASS |
| pnpm rules:check | PASS (42/42) |
| pnpm arch:check:v2 | PASS (9/9) |

All gates GREEN.
