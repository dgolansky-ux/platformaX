# Step 36 — New Production Gates

## Gates Added

### 1. Architecture Import Graph Gate (GUARD-038)
- **Script:** `scripts/check-architecture-import-graph.mjs`
- **Checks:**
  - No circular dependencies between server/domains-v2/*
  - Cross-domain import only via public-api.ts, contracts.ts, events.ts
  - Forbidden imports: repository, service, policy, router, mapper, internal/*, cache-keys
  - features-v2 isolation: no cross-feature internals
  - shared-ui cannot import product domains

### 2. Runtime Readiness Status Gate (GUARD-039)
- **Script:** `scripts/check-runtime-readiness-status.mjs`
- **Checks:**
  - SCAFFOLD_ONLY cannot have real runtime service/router
  - PARTIAL requires service.ts, tests, public-api.ts
  - IMPLEMENTED requires service, repository, policy, dto, public-api, tests

### 3. Migration Safety Gate (GUARD-040)
- **Script:** `scripts/check-migration-safety.mjs`
- **Checks:**
  - Blocks DROP TABLE, DROP COLUMN, TRUNCATE, DELETE FROM without WHERE, ALTER COLUMN TYPE, disable RLS
  - Requires MIGRATION_APPROVED marker for destructive operations
  - Blocks live db push references

### 4. Dependency Change Policy Gate (GUARD-041)
- **Script:** `scripts/check-dependency-change-policy.mjs`
- **Checks:**
  - package.json/pnpm-lock.yaml changes require DEPENDENCY_DECISION in review report
  - Blocks undocumented dependency additions

### 5. Exception Expiry Gate (GUARD-042)
- **Script:** `scripts/check-exception-expiry.mjs`
- **Checks:**
  - Every exception must have id, rule_id, owner, reason, expiry, risk, evidence
  - Expired active exceptions = FAIL
  - Missing expiry = FAIL

### 6. ADR Required Gate (GUARD-043)
- **Script:** `scripts/check-adr-required.mjs`
- **Checks:**
  - Architecture-impacting files (RULES_REGISTRY, DOMAIN_STATUS_REGISTRY, public-api.ts, domain-registry.ts, migrations, workflows, check-* scripts, architecture docs) require ADR IMPACT DECISION

### 7. Observability / Logging Safety Gate (GUARD-044)
- **Script:** `scripts/check-observability-logging.mjs`
- **Checks:**
  - No console.log/console.debug in runtime code (tests/scripts excluded)
  - No PII (email, phone, dateOfBirth, token, session, service_role, DATABASE_URL) in log output

### 8. DTO Privacy Classification Gate (GUARD-045)
- **Script:** `scripts/check-dto-privacy-classification.mjs`
- **Checks:**
  - Non-scaffold DTO files require privacy classification marker
  - Public DTOs cannot contain PII fields

### 9. Scalability Hot Paths Gate (GUARD-046)
- **Script:** `scripts/check-scalability-hot-paths.mjs`
- **Checks:**
  - No sync fanout loops over recipients/users/members in service/router/public-api
  - No unbounded hot-path loops without cap/batch
  - No full scans (getAll, findAll, fetchAll) without limit/cursor
  - List/feed functions require stable order
