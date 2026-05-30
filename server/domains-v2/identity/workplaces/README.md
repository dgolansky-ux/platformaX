# identity/workplaces

**Status:** `BACKEND_PARTIAL` (Slice 12)

Workplaces are part of the **professional layer** of the personal profile in
the `identity` domain. They are NOT a community: there are no members, no
roles, no join requests, no invites, no sub-groups.

A workplace presents the owner's work: name + headline + description, optional
profession/specialization links, optional website/contact data with viewer-
gated visibility (`owner_only` / `friends` / `approved_contact_fields` /
`public`), optional logo/banner/location, visibility (`public`/`friends_only`/
`private`) and status (`draft`/`active`/`archived`).

The micro-feed of workplace posts lives in `content-v2/workplace-posts`, and
the friend-feed mini-teaser lives in `content-v2/workplace-teasers`.

## Public API surface

Other domains / use-cases import only from `public-api.ts`:

- `createWorkplacesService(deps)` — service factory.
- `createInMemoryWorkplaceRepository()` — in-memory adapter (BACKEND_PARTIAL).
- `createNoopWorkplaceEventPublisher()` — outbox skeleton.
- DTOs: `WorkplacePublicDTO`, `WorkplaceCardDTO`, `WorkplaceContactViewDTO`,
  `WorkplaceViewerStateDTO`.
- Commands: `CreateWorkplaceCommand`, `UpdateWorkplaceCommand`,
  `ArchiveWorkplaceCommand`, `ListWorkplacesForOwnerCommand`.
- Policy helpers: `canViewWorkplace`, `canEditWorkplace`, `canViewContact`,
  `validateWebsiteUrl`, `normalizeSlug`, `isWorkplaceVisibility`,
  `isWorkplaceContactVisibility`.
- Mappers: `toWorkplacePublic`, `toWorkplaceCard`, `projectContactForViewer`.

## Rules

- Only the profile owner (`actorUserId === ownerProfileId`) can create or edit
  workplaces on their own profile.
- `slug` is normalized to lowercase and unique per owner.
- Website URL validation rejects `javascript:` / `data:` / `file:` /
  `vbscript:` schemes and only accepts `http(s)://`.
- Public DTO carries no `contactEmail` / `contactPhone` — these are only
  exposed via `WorkplaceContactViewDTO` when the contact access policy
  allows.
- Soft hard-limit of `WORKPLACE_OWNER_ACTIVE_HARD_LIMIT = 10` active
  (draft+active) workplaces per owner.
- Archived workplaces are hidden from non-owner viewers.

## What this domain does NOT own

- Workplace posts / micro-feed — owned by `content-v2/workplace-posts`.
- Friend-feed teasers — owned by `content-v2/workplace-teasers`.
- Friendship graph / contact-access decisions — injected via
  `WorkplaceFriendshipResolver` + `WorkplaceContactAccessResolver` ports
  (wired by `application-v2`).

## Persistence

In-memory store only. DB adapter (drizzle) pending — schema draft in the
slice-12 report. NO `pnpm db push`, NO production deploy in this slice.

## Tests

See `__tests__/workplaces-service.test.ts` — covers create/update/archive,
slug uniqueness, URL safety, public DTO PII-stripping, contact gating, and
viewer state.
