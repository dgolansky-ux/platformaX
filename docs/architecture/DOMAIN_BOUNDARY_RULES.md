# PlatformaX V2 — Domain Boundary Rules

> **Canonical governance entrypoint:** `docs/governance/README.md` · `docs/governance/GOVERNANCE_INDEX.md` · `docs/governance/RULES_REGISTRY.yml`  
> This document remains the authoritative source of its specific content. The enforceable rule registry is `docs/governance/RULES_REGISTRY.yml`.

## Cross-domain import rules

### BLOCKED cross-domain imports

No domain may import these modules from another domain:

- `repository`
- `repository.drizzle`
- `service`
- `policy`
- `router`
- `mapper`
- `db`
- `schema`
- `cache-keys`
- `internal`

### ALLOWED cross-domain imports

Domains may only import from other domains via:

- `public-api.ts`
- `contracts.ts`
- `events.ts`
- Explicitly public DTOs (documented in domain README)

### Application layer rules

- Application layers (publisher, app-shell, onboarding) may import domain public APIs
- Application layers must NOT own tables, repositories, or domain entities
- Application layers must NOT import domain internals

### Frontend rules

- `features-v2/<domain>` must NOT import internals from other feature domains
- `app-v2` may compose domains but must NOT import legacy or removed product areas
- `shared-ui` must NOT contain domain-specific business logic

### content-v2 submodule rules

- Submodules (posts, feeds, comments, reactions, topics, read-models) are internal to content-v2
- Other domains must use content-v2/public-api, not submodule internals
- publisher is orchestration, not a data domain

## Guard enforcement

| Rule | Guard | Scope |
|---|---|---|
| No cross-domain internals | audit-domain-boundaries.mjs | server/domains-v2, client/src/features-v2, client/src/app-v2 |
| No legacy imports | check-no-legacy-imports.mjs | V2 code areas |
| No removed areas | check-removed-product-areas.mjs | All V2 code |
| Domain in registry | check-domain-registry.mjs | server/domains-v2 |
| Domain has required files | check-domain-scaffold.mjs | server/domains-v2 |
| Feature in registry | check-feature-registry.mjs | client/src/features-v2 |
