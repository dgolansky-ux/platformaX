# Step 13 — Domain Guards Matrix

| Guard | Scope | What it blocks | Tests | Result |
|---|---|---|---|---|
| check-domain-registry.mjs | server/domains-v2 | Unknown domain folders, missing registered domains | domain-registry.test.ts (4) | PASS |
| check-domain-scaffold.mjs | server/domains-v2 | Missing required files (README, public-api, contracts, events, dto, policy, index) | domain-scaffold.test.ts (17) | PASS |
| check-feature-registry.mjs | client/src/features-v2 | Unknown feature folders, missing registered features, domain logic in shared-ui | feature-registry.test.ts (19) | PASS |
| audit-domain-boundaries.mjs | domains-v2, features-v2, app-v2 | Cross-domain internal imports (repository, service, policy, etc.) | domain-boundaries.test.ts (5), domain-boundaries-all-domains.test.ts (8) | PASS |
| check-no-legacy-imports.mjs | V2 code areas | Imports from legacy paths | legacy-imports.test.ts (9) | PASS |
| check-removed-product-areas.mjs | All V2 code | Removed product routes/references | — | PASS |
| check-fake-done.mjs | docs, client, server, shared, scripts | Fake completion statuses | status-truth.test.ts (4) | PASS |
| check-domain-status.mjs | domain-status.md | Blocked statuses (DONE, FULL_DONE, etc.) | — | PASS |
| check-public-dto-pii.mjs | domains-v2 DTOs/public-api | PII in public DTOs | — | PASS |
| check-media-base64.mjs | V2 runtime code | Inline media encoding patterns | — | PASS |
| check-pagination.mjs | V2 runtime code | Lists/feeds without pagination | pagination.test.ts (7) | PASS |
| check-env-safety.mjs | All tracked files | Secrets/credentials in source | env-safety.test.ts (9) | PASS |
| check-test-env-safety.mjs | Test setup files | Real .env loading in tests | — | PASS |
| check-file-complexity.mjs | All source files | Files exceeding size limits | — | PASS |
| check-build-artifacts.mjs | dist/ | Removed product chunks in build | — | PASS |
| check-supabase-migrations-safety.mjs | migrations | Dangerous migration patterns | — | PASS |
| validate-bundle.mjs | ZIP bundles | Backslash paths, banned files, missing reports | validate-bundle.test.ts (14) | PASS |
