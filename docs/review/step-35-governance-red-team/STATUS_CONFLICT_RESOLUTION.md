# Step 35 — Status Conflict Resolution

## Method

For each conflicting domain, I:
1. Listed all files in `server/domains-v2/<domain>/`
2. Checked for presence of `service.ts`, `repository.ts`, `mapper.ts` (runtime indicators)
3. Checked for `__tests__/` with test files beyond `domain-contract.test.ts`
4. Applied taxonomy:
   - **PLANNED** = no folder/scaffold exists
   - **SCAFFOLD_ONLY** = structure exists (README, public-api, dto, contracts, etc.) but no service/repository runtime
   - **PARTIAL** = real runtime (service, repository, mapper) + real tests exist

## Resolution Table

| Domain | domain-registry.ts (before) | domain-status.md (before) | Actual files | Resolution | domain-registry.ts change | domain-status.md change |
|---|---|---|---|---|---|---|
| identity | SCAFFOLD_ONLY | PARTIAL | service.ts, repository.ts, mapper.ts, internal/*, 5 tests | PARTIAL | → PARTIAL | — (already correct) |
| social | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index | SCAFFOLD_ONLY | — (already correct) | → SCAFFOLD_ONLY |
| content-v2 | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events + 7 subdomains | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| communities-v2 | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| channels | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| chat | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| events | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| modules | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| public-hub | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| notifications | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| search | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| moderation | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| audit | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |
| system | SCAFFOLD_ONLY | PLANNED | README, public-api, contracts, dto, policy, events, index, test | SCAFFOLD_ONLY | — | → SCAFFOLD_ONLY |

## Sources Updated

1. `server/domains-v2/domain-registry.ts` — identity status changed from SCAFFOLD_ONLY to PARTIAL
2. `docs/architecture/PlatformaX-V2-domain-status.md` — 13 domains changed from PLANNED to SCAFFOLD_ONLY
3. `docs/governance/DOMAIN_STATUS_REGISTRY.yml` — all 13 conflicts resolved, conflict set to false, evidence updated with full file lists
