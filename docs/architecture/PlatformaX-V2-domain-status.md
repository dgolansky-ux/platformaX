# PlatformaX V2 — Domain Status

Status: `ACTIVE`  
Owner: Architecture / Status Truth  
Purpose: single source of truth for domain maturity  
Governance Index: `docs/governance/GOVERNANCE_INDEX.md`  
Domain Status Registry: `docs/governance/DOMAIN_STATUS_REGISTRY.yml`

> **Note:** `docs/governance/` is the central governance index and registry.
> `DOMAIN_STATUS_REGISTRY.yml` is the machine-readable status source.
> This file remains the authoritative source of status taxonomy and rules.

## 1. Purpose

Domain status is a contract. It is not a mood, not a promise and not a progress slogan.

A status may only be upgraded when the required evidence exists in code, tests, logs and reports.

## 2. Allowed status taxonomy

| Status | Meaning | Required evidence |
|---|---|---|
| `NOT_STARTED` | No usable implementation exists. | Entry in status table. |
| `PLANNED` | Accepted direction but no implementation. | ADR or execution-map reference. |
| `SCAFFOLD_ONLY` | Folder/stubs/README exist. | README, no claimed runtime. |
| `UI_SHELL_ONLY` | Frontend shell exists without real runtime. | Clickable UI/local state/tests/report. |
| `MOCK_LOCAL_ONLY` | Uses typed fixtures/local state intentionally. | Fixture files and explicit status. |
| `BACKEND_NOT_STARTED` | Backend not implemented. | No backend done claims. |
| `PARTIAL` | Some real contracts/use-cases/tests exist. | public-api/contracts/tests, but missing full runtime. |
| `IMPLEMENTED` | Runtime is real. | router/service/repository or adapter, tests, README, gates. |
| `BLOCKED` | Cannot continue without external decision/input. | Blocker reason and owner decision needed. |
| `MANUAL_REVIEW_REQUIRED` | Cannot be accepted automatically. | Review target and reason. |
| `DEPRECATED` | Intentionally phased out. | ADR or report. |
| `SUPERSEDED` | Replaced by a newer implementation/report. | Link to replacement. |

## 3. Restricted status labels

| Label | Allowed only when |
|---|---|
| `VISUAL_DONE` | screenshots or explicit manual visual evidence exist |
| `BACKEND_DONE` | real runtime, tests and integration evidence exist |
| `FULL_DONE` | visual, runtime, tests, architecture, evidence and staging are all proven |
| `CLEAN` | all relevant gates pass |
| `READY_FOR_PROD` | staging, security, rollback, monitoring and evidence are complete |

If evidence is missing, use a lower status.

## 4. Forbidden status patterns

Forbidden in reports, commits and status docs without evidence:

- “done”
- “final”
- “clean”
- “complete”
- “fully migrated”
- “all green”
- “production ready”
- “visual done” without evidence
- “backend done” without runtime
- “implemented” for a scaffold
- “current scope clean” while blockers exist

## 5. Initial domain status table

This table must be updated by code changes. Empty or planned domains must not be upgraded automatically.

| Domain / Area | Owner type | Initial status | Notes |
|---|---|---|---|
| `identity` | owner domain | `PARTIAL` | profile persistence runtime (in-memory adapter), public/private DTOs, policy, mapper, validation, events; Supabase repository pending (STEP_27) |
| `social` | owner domain | `PLANNED` | relationship graph/contact access |
| `communities-v2` | owner domain | `PLANNED` | communities, members, roles, settings |
| `content-v2` | owner domain | `PLANNED` | posts, feeds, comments, reactions, topics |
| `channels` | owner domain | `PLANNED` | channels, follows, discovery |
| `chat` | owner domain | `PLANNED` | conversations/messages/broadcast inbox |
| `events` | owner domain | `PLANNED` | events, registration, participants |
| `modules` | owner domain | `PLANNED` | module definitions/enablement |
| `public-hub` | composition domain | `PLANNED` | composition/read view, not source of truth |
| `media` | owner domain | `PARTIAL` | avatar/banner upload-intent runtime (in-memory repo, env-required storage), DTOs/policy/mapper/validation, migration as code; live storage + presigned upload pending (STEP_32) |
| `notifications` | operational domain | `PLANNED` | outbox/fanout/badges |
| `search` | operational domain | `PLANNED` | projections/search contracts |
| `moderation` | operational domain | `PLANNED` | report/block/mute moderation states |
| `audit` | operational domain | `PLANNED` | append-only restricted audit |
| `system` | operational domain | `PLANNED` | health/env/feature flags/gates |
| frontend `app-v2` | composition layer | `PARTIAL` | routing/shell/composition; `/profile` composes identity + media public adapters into the personal view (step-33) |
| frontend `features-v2` | UI features | `PARTIAL` | identity (auth + profile adapter, profile `updateMyProfile` wired in step-33) and media (avatar/banner upload-intent) adapters PARTIAL; other features PLANNED |
| governance docs | governance | `ACTIVE` | Step 01 output after acceptance |

## 6. Upgrade rules

### To `SCAFFOLD_ONLY`

Required:

- folder exists,
- README exists,
- intended owner and boundaries described,
- no runtime claim.

### To `UI_SHELL_ONLY`

Required:

- UI files exist,
- typed fixtures/local state,
- no hidden backend claim,
- local UI tests where feasible,
- report lists known missing runtime.

### To `PARTIAL`

Required:

- stable contracts or DTOs,
- public-api exists if consumed by other domains,
- policy/service or equivalent core logic exists,
- tests cover core behavior,
- missing parts listed.

### To `IMPLEMENTED`

Required:

- router or runtime adapter,
- service,
- repository or storage adapter,
- policy,
- mapper,
- DTO tests,
- integration or domain tests,
- pagination/security checks where relevant,
- README updated,
- gates green.

## 7. Downgrade rules

Status must be downgraded if:

- implementation is removed,
- tests are deleted,
- runtime is replaced with mocks,
- screenshots/evidence disappear,
- guard detects fake DONE,
- API no longer matches contract,
- public DTO starts leaking PII,
- legacy runtime becomes active.

Downgrades are not failure. Fake upgrades are failure.

## 8. Status report format

Every major task touching a domain must update a report section:

```md
## Domain Status Impact

| Domain | Previous status | New status | Evidence | Notes |
|---|---|---|---|---|
| identity | PLANNED | SCAFFOLD_ONLY | path/to/files + gates | no runtime |
```

## 9. Required gate

`node scripts/check-domain-status.mjs` must verify:

- no forbidden labels without evidence,
- every active domain has a status entry,
- status docs do not claim runtime where code is scaffold,
- report names do not claim DONE without proof,
- `VISUAL_DONE`, `BACKEND_DONE`, `IMPLEMENTED` and `FULL_DONE` are evidence-backed.

## 10. Acceptance

This file is accepted when:

- all domains have explicit initial status,
- status taxonomy is used consistently,
- status upgrades require evidence,
- later gates enforce status truth.
