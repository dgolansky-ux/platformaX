# Step 52 — Governance map full enforcement cleanup

Status: `ACTIVE_EVIDENCE`
Visual profile status: `MANUAL_OWNER_REVIEW` (no screenshots required by this task)
Date: 2026-05-28

## Baseline

- Branch: `chore/runtime-invariants-code-alignment`
- Baseline SHA: `0e88d5a` (chore(governance): wire runtime invariant guards into required gates + mandatory task finalization)
- Follow-up commit added on top of the same branch (PR still open).

## What was fixed

### Phase 2 — `.claude` permissions: tracked example + hard guard

- `.gitignore` updated: `.claude/*` ignored, `.claude/settings.example.json` tracked.
- New tracked file: `.claude/settings.example.json` with only safe permissions
  (no `git push *`, no `gh api *`, no `node *`, no `--no-verify`).
- `scripts/check-ai-agent-permissions.mjs` rewritten:
  scans both `settings.example.json` and `settings.local.json`; fails on broad
  wildcards (`git push *`, `git push -u origin *`, `git push origin *`,
  `git push --force`, `git push origin main`, `--no-verify`,
  `git reset --hard`, `git clean *`, `git checkout *`, `git pull *` without
  `--ff-only`, `gh api *`, `gh pr merge`, `node *` outside `scripts/`,
  `railway`, `supabase db push`, `rm -rf`).
- Tests rewritten: `scripts/__tests__/ai-agent-permissions.test.ts` — covers
  every banned pattern + every allowlisted `HEAD` push.
- `docs/governance/AI_AGENT_PERMISSIONS_POLICY.md` updated with the
  tracked-example-vs-local-override policy.
- `.claude/settings.local.json` cleaned up locally to match the safe pattern.

### Phase 3 — public-api zero internal exports

- New stable files:
  - `server/domains-v2/identity/private-dto.ts` (was `internal/private-profile-dto.ts`)
  - `server/domains-v2/identity/validation-limits.ts` (was inside `internal/validation.ts`)
  - `server/domains-v2/media/validation-limits.ts` (was inside `internal/validation.ts`)
- `internal/private-profile-dto.ts` becomes a thin internal re-export of the
  new stable type so internal consumers (mapper/onboarding) still compile.
- `internal/validation.ts` (identity + media) imports limits from the stable
  files and re-exports them for internal consumers.
- `public-api.ts` (identity + media) no longer re-exports from `./internal/*`.
- New guard: `scripts/check-public-api-surface.mjs` (multiline-aware) with
  explicit allowlist for service/repository/dto/private-dto/contracts/events/
  policy/validation-limits.
- New tests: `scripts/__tests__/public-api-surface.test.ts` (14 cases).

### Phase 4 — owner / edit controls in profile (no UI polish)

- `ProfileHeader` now takes `canEditProfile: boolean`. Anonymous/loading must
  pass `false` even when the fixture sets `isOwner: true` — the fixture flag
  only drives the visual shell, never privilege.
- Renamed prop in section components: `isOwner` → `canEdit` on
  `ProfileAvatar`, `ProfileBio`, `ProfileCivilCard`, `ProfileStatusRow`,
  `ProfileBanner` and the back-compat `ProfileStatusBar` shim.
- `ProfilePage` passes `canEditProfile` to header + personal sections +
  professional layer so no owner-only control activates in anonymous mode.
- Tests updated: existing owner-control tests now use `readyOwnerDataDeps`;
  new tests assert anonymous never renders "Podgląd profilu", "Ustaw stan
  cywilny", "Zmień zdjęcie profilowe", "Zmień baner" or the bio empty-state
  owner prompt. All 28 ProfilePage tests pass.

### Phase 5 — new structural guards (PARTIAL → PARTIAL+guard)

Added 9 new guards. Each fails on regression of the structural skeleton;
deeper proofs remain `manual_gate`.

| Guard | Rule(s) | What it blocks |
|---|---|---|
| `check-public-api-surface.mjs` | PX-ARCH-003, PX-ARCH-004 | public-api re-export from `./internal/*`, `./mapper`, `./router`, `./schema`, `./db`, `./cache-keys`; non-allowlisted relative sources |
| `check-application-use-cases-boundary.mjs` | PX-APP-001 | client/src importing `@server`; files outside `server/application-v2` importing public-api of 2+ domains |
| `check-public-dto-contract-tests.mjs` | PX-CONTRACT-001 | PARTIAL/IMPLEMENTED domain missing any of `domain-contract` / `public-mapper-no-pii` / `public-mapper-no-leak` / `public-api` / `contract` test |
| `check-branded-id-types.mjs` | PX-ID-001 | `shared/contracts/ids.ts` missing `Brand<>`; domain contracts redeclaring `*Id = string` |
| `check-correlation-id-boundary.mjs` | PX-OBS-003 | missing `shared/contracts/correlation.ts` skeleton; `RequestContext` without `correlationId`/`actorId`; `Math.random` in correlation; matrix dishonestly claiming "fully automated" |
| `check-backend-ownership-invariants.mjs` | PX-OWN-001 | PARTIAL/IMPLEMENTED owner domain without record owner fields (identity: `userId`; media: `ownerUserId` OR `ownerType+ownerId`) or without `policy.ts` canX functions |
| `check-read-model-single-owner.mjs` | PX-READMODEL-001 | rule not documented in `DOMAIN_OWNERSHIP_MATRIX.md` / `BACKEND_ARCHITECTURE_INVARIANTS.md`; co-ownership anti-pattern (`content-v2 + social`) in docs |
| `check-idempotency-flows.mjs` | PX-IDEMPOTENCY-001 / PX-IDEMP-001 | missing shared contract / runtime adapter / migration / branded key / `Math.random` |
| `check-no-unsafe-randomness.mjs` | PX-SEED-001, PX-OBS-003, PX-ID-001 | `Math.random()` in `shared/contracts/`, `server/**`, `client/src/**` outside tests/fixtures/seeds/scripts (opt-out per line with `// allow: Math.random — <reason>`) |

All 9 guards wired into:
- `scripts/rules-check.mjs`
- `pnpm guards:runtime-invariants` (`package.json`)
- `docs/governance/GUARDS_REGISTRY.yml` (GUARD-056..GUARD-064)
- `docs/governance/RULES_REGISTRY.yml` (`enforced_by` field updated)
- `docs/governance/RULES_TO_GUARDS_MATRIX.md`

### Phase 6 — UUID / randomness hardening

- `shared/contracts/uuid.ts` rewritten: strictly WebCrypto.
  1. `globalThis.crypto.randomUUID()` if available.
  2. Fallback to `crypto.getRandomValues()` to construct a v4 UUID
     (RFC 4122 §4.4).
  3. Otherwise throw the controlled `UuidGeneratorUnavailableError`.
  - No `Math.random` fallback. No `node:crypto` import (browser/Vite-safe).
- `shared/contracts/correlation.ts` — `createCorrelationId` now defers to
  `createUuid()` (no `Math.random`).
- `shared/contracts/idempotency.ts` — `createIdempotencyKey` defers to
  `createUuid()` (no `Math.random`).
- `shared/contracts/__tests__/uuid.test.ts` — added cases for
  `getRandomValues` fallback, `UuidGeneratorUnavailableError`, and a spy
  assertion that `Math.random` is never called by `createUuid`.

### Phase 7 — audit ZIP paths

- `scripts/create-evidence-zip.mjs` already produced forward-slash entries
  (`.replace(/\\/g, "/")`) and excluded `node_modules/dist/build/coverage/.git`
  and real `.env*`; tightened to also exclude `.claude/settings.local.json`
  while keeping `.env*.example` and the tracked `settings.example.json`.
- `docs/governance/AGENT_COMMAND_STANDARD.md` gained an "Audit ZIP exports"
  section codifying the same rules for operator-driven ZIPs.

### Phase 8 — governance docs alignment

- `RULES_REGISTRY.yml`: `enforced_by` updated for PX-ARCH-003, PX-ARCH-004,
  PX-APP-001, PX-CONTRACT-001, PX-ID-001, PX-OBS-003, PX-OWN-001,
  PX-READMODEL-001, PX-IDEMPOTENCY-001, PX-SEED-001. Notes spell out which
  portion is automated vs `manual_gate`.
- `GUARDS_REGISTRY.yml`: GUARD-056..064 added.
- `RULES_TO_GUARDS_MATRIX.md`: rows updated, summary recalculated, "TODO_GUARD"
  list closed for the items listed at step-50.
- `BACKEND_ARCHITECTURE_INVARIANTS.md`: new §9.1 "Single read-model owner".

## Deep code quality / architecture / domain compliance audit

| Area | Result | Notes |
|---|---|---|
| Code quality | PASS | No new `as any`, `@ts-ignore`, broad `eslint-disable`. The fixture flag→canEdit rename narrowed several boolean prop signatures. |
| TypeScript / lint | PASS | `pnpm check` + `pnpm lint` green (see Phase 10). |
| Tests quality | PASS | Owner-control test seam uses `readyOwnerDataDeps`; new anonymous-gating tests assert real owner-only labels are absent for non-owner. No `expect(true).toBe(true)` introduced. |
| Domain boundaries | PASS | `audit-domain-boundaries.mjs` + `check-public-api-surface.mjs` both green. Identity/media `public-api` no longer touch `./internal/*`. |
| public-api surface | PASS | New dedicated guard + tests; multiline exports covered; allowlist documented in the guard and tests. |
| application / use-cases | PARTIAL+GUARD | `check-application-use-cases-boundary.mjs` blocks client→server imports and 2+-domain orchestration outside `server/application-v2`. Deeper "is this the right use-case" audit stays `manual_gate`. |
| DTO / privacy / PII | PASS | `check-public-dto-pii.mjs` + `check-dto-privacy-classification.mjs` unchanged; private DTO moved out of `/internal/` but still kept out of public-mapped responses (covered by existing PII guards + new contract-tests guard). |
| EventEnvelope / outbox | PARTIAL | `check-event-envelope-contract.mjs` unchanged; transactional outbox stays `manual_gate` per PX-EVENT-002. |
| Read models | PARTIAL+GUARD | New `check-read-model-single-owner.mjs` blocks doc-level co-ownership anti-pattern. Per-projection rebuild/freshness plan stays `manual_gate`. |
| Idempotency | PARTIAL+GUARD | `check-idempotency-flows.mjs` blocks skeleton regression. Live wiring into create/publish/upload stays `manual_gate`. |
| Pagination / scale | PASS | `check-pagination.mjs`, `check-scalability-patterns.mjs`, `check-scalability-hot-paths.mjs` unchanged and green. |
| Frontend boundaries | PASS | `check-client-server-boundary.mjs` and `check-presentational-container-boundary.mjs` unchanged; new owner-gating did not add data-layer imports to presentational sections. |
| Design tokens | PASS | `check-design-tokens.mjs` unchanged; no CSS changes in this step. Visual parity = `MANUAL_OWNER_REVIEW`. |
| Migrations | PASS | No new migrations. Existing `check-migration-safety.mjs` / `check-media-purpose-migration.mjs` unchanged and green. No `supabase db push`. |
| Legacy containment | PASS | `check-no-legacy-imports.mjs` + `check-removed-product-areas.mjs` unchanged; no legacy runtime added. |
| Main document compliance | PASS | Coding standards + architecture enforcement docs respected: file sizes unchanged, no `transition: all`, no broad `as any`, owner-gating uses canEdit boolean prop instead of relying on fixture isOwner. |
| MAPA zasad compliance | PASS+PARTIAL_GATES | All P0 rules have a guard or explicit `manual_gate`. Step-50 TODO_GUARD list is closed (9 new guards). Remaining PARTIAL items each carry a structural guard + named `manual_gate` evidence. |

### Remaining manual gates (explicit, by rule)

- PX-OWN-002, PX-VIS-001, PX-CTX-001 — full owner/viewer matrix proof.
- PX-EVENT-002 — outbox writes within same DB transaction as source write.
- PX-MEDIA-004 attach-path verification — beyond record + purpose drift.
- PX-LC-001 / PX-LIFECYCLE-001 — explicit lifecycle status enum per entity.
- PX-IDEMPOTENCY-001 / PX-IDEMP-001 — live wiring into create/publish/upload/finalize.
- PX-AIS-002 — Architecture Impact Statement requirement (per task).
- PX-PROFILE-001 / PX-PROFILE-002 — visual parity + identity layering.
- PX-AI-001 / PX-AI-003 — agent-self behaviour.
- PX-OBS-003 — end-to-end correlation id wiring through middleware/use-case/log.
- PX-READMODEL-001 — per-projection ownership proof.

## Why no screenshots / no visual changes

Per task instructions: profile visual status = `MANUAL_OWNER_REVIEW`. No UI
polish, no fixture re-design, no theming changes. Owner-gating refactor only
narrowed activation of existing controls — visual rendering for the ready
owner state is unchanged (avatar/banner edit buttons render exactly as before).

## Not performed

- No direct push to `main`.
- No `git push --force`.
- No `--no-verify`.
- No `supabase db push`.
- No Railway commands.
- No new dependencies.
- No legacy runtime imports.
- No screenshots (visual profile = MANUAL_OWNER_REVIEW).
- No secrets / env files / build artefacts / ZIPs / node_modules / dist /
  coverage committed.

## Gate results

See the FINALIZATION block in the closing agent response.
