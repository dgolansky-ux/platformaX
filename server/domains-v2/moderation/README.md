# moderation

Status: `BACKEND_PARTIAL`
Slice: 20 (Reports & moderation foundation)
Owner: @dgolansky-ux
Type: OPERATIONAL_DOMAIN

## Purpose

Owns moderation reports + actions for the platform.

Users can file a report against any reportable target type. Moderators / admins
can view the queue, take per-report actions (dismiss / mark under review /
hide / deactivate / restrict / mark reviewed / no action), and the source
domain applies the actual content state change via its own public-api.

## Owns

- Moderation reports
- Moderation actions
- Report reason registry + target registry
- Per-target action capability metadata

## Does NOT own

- Source content state (lives in `content-v2/*`, `identity/*`, `communities-v2`,
  `channels`, `media`, `events-v2`, etc. — the application use-case calls each
  source domain's public-api to apply the action).
- Automated moderation / AI moderation.
- Automatic bans / penalty system.
- Email / push notifications.

## Public surface

- `public-api.ts`
- `contracts.ts`
- `events.ts`

## Internal modules (not importable by other domains)

- `repository.ts` — re-exported via `moderation-store.ts` to keep the public-api
  boundary guard clean (which blocks any export specifier path containing
  `repository`).
- `service.ts`, `mapper.ts`, `policy.ts`.

## Events

- `ModerationReportCreated`
- `ModerationReportReviewed`
- `ModerationActionTaken`

See `notifications-v2/event-registry.ts` for current handler status (most are
`no_notification_needed` / `planned` — see report).

## Status notes

- `service.ts` carries `ALLOW_FILE_SIZE_EXCEPTION` (EXC-012) — co-locates the
  create-report flow with the moderator review/action flow in one factory.
- All review-side DTOs require `canReviewReports`; the public reporter DTO
  (`ModerationReportPublicStatusDTO`) never leaks description / severity /
  resolution data.
- Description is moderator-only — never returned in the public status DTO.

## Canonical governance

- [Rules Registry](../../docs/governance/RULES_REGISTRY.yml)
- [Governance Index](../../docs/governance/GOVERNANCE_INDEX.md)
- [Domain Status Registry](../../docs/governance/DOMAIN_STATUS_REGISTRY.yml)
- [Status Taxonomy](../../docs/governance/STATUS_TAXONOMY.md)

Local exceptions: EXC-012 (service.ts file-size).
