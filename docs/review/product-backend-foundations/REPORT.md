# Product Backend Foundations — Review Report

Branch: `feat/contacts-v2-clean-room-slice` · Date: 2026-05-29

Clean-room backend foundations for the product surface: communities, modules,
channels, content/friend-feed, public-hub, plus the application-v2 use-cases that
orchestrate flows touching 2+ domains. All runtime is in-memory behind ports; no
transport/persistence adapter is wired yet.

## Scope delivered

### Domains (all `BACKEND_PARTIAL`)

| Domain | Type | What it owns now |
|---|---|---|
| communities-v2 | OWNER | community + members + roles + join requests; founder created atomically and non-removable; slug validation; cursor list; `CommunityAuthorityResolver` contract |
| modules | OWNER | `ModuleDefinition` registry (5 whitelisted), enable/disable, owner-type validation; no module business data |
| channels | OWNER | channel owned by community; follow ≠ membership; authority delegated to the app layer |
| content-v2 | OWNER | posts (`EMPTY_BODY` guard) + friend-feed read model; `canSeePost` visibility (private/friends/public); scoped to explicit author set — no global feed; `READ_MODEL_SKELETON` |
| public-hub | COMPOSITION | `getProfileHubView` / `getCommunityHubView` assembled from resolver ports; owns no data |

### Application-v2 use-cases (all `PARTIAL`)

- `communities/createCommunityWithDefaults` — communities + modules.
- `channels/createChannelForCommunity` — authority probe (communities) → channels.
- `public-hub/{getProfileHubView,getCommunityHubView}` — wires identity /
  communities-v2 / modules public-api into the public-hub resolver contracts.
- `feed/getFriendFeedFoundation` — social friend ids → content-v2 scoped feed.

Every use-case imports only domain `public-api.ts` / `contracts.ts`, owns no data.

## Tests

- communities-v2, modules, channels, content-v2, public-hub: per-domain service
  + domain-contract suites (DTO has no PII, policy invariants, cursor pagination).
- use-cases: feed (friends-only / empty), communities (defaults / error
  propagation / unknown-key skip), channels (manager allowed / stranger
  FORBIDDEN), public-hub (community view + sections / NOT_FOUND / profile view).

## Gates (all green)

`tsc --noEmit` · targeted `vitest run` · `rules:check` · `arch:check:v2` ·
`guards:all-local` · `audit-domain-boundaries` · `check-code-quality-structure` ·
`check-public-dto-pii` · `check-dto-privacy-classification` ·
`check-scalability-hot-paths` · `check-scalability-patterns` ·
`check-domain-status-registry` · `depcruise:check` (0 errors; pre-existing
no-orphans warnings on scaffold index files).

Status truth updated in all four sources for the graduated domains:
`domain-registry.ts`, `DOMAIN_STATUS_REGISTRY.yml`, `DOMAIN_OWNERSHIP_MATRIX.md`,
`DOMAIN_REGISTRY.md`.

## Explicitly NOT done (out of scope / intentional)

- Comments / reactions / topics runtime; global or ranked feed; write fanout.
- Persistence / HTTP transport adapters (everything is in-memory behind ports).
- Composed-view caching in public-hub (recomputed per call).
- **Frontend communities shell** — deferred to the handoff per owner instruction
  (`docs/handoff/HAND007.md`).

## Risk register

- **P0** — none.
- **P1** — branded-id enforcement is still optional (`BRANDED_IDS_OPTIONAL`),
  so a wrong-id call at a use-case boundary is not compiler-caught yet.
- **P2** — friend-feed read model is single-owner skeleton; ranking/fanout and a
  DB adapter must land behind the same `PostRepository` port before scale.

## Next 3 steps

1. Frontend communities shell (`/communities`, MOCK_LOCAL_ONLY adapter) — see HAND007.
2. First persistence adapter behind the in-memory ports (start with content-v2 /
   communities-v2), keeping the public-api stable.
3. Flip branded ids to enforced and tighten use-case signatures
   (`UserId` / `CommunityId`) once a transport boundary exists.
