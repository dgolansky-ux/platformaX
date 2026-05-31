# application-v2/use-cases/personal-profile-view

Status: `BACKEND_PARTIAL` (Slice 15)

## Purpose

Composes one `PersonalProfileViewDTO` for the unified `/profile/:username`
route. The same DTO drives every mode — owner / friend / stranger /
pending_friend_request_sent / pending_friend_request_received /
contact_approved / unauthenticated — so the UI never recomputes policy.

## Composition

| Slot | Source |
| --- | --- |
| `profile` | `identity.getPublicProfile` |
| `viewerState` | policy in `policy.ts` |
| `ownerActions` | derived from `viewerState.canEditProfile` |
| `relationActions` | `social.listIncoming/OutgoingFriendRequests` + `social.areFriends` + `contactAccess.getSentContactRequests` |
| `contactPanel` | `contacts.getProfileContactRelationship` (policy-gated PII) |
| `workplacesPreview` | optional `PersonalProfileWorkplacesResolver` |
| `publicHub` | optional `PersonalProfilePublicHubResolver` |
| `channelsEntry` | optional `PersonalProfileChannelsResolver` |
| `friendFeedPreview` | policy in `policy.ts` |

When an optional resolver is not wired the orchestrator returns a truthful
empty / not-yet-wired state instead of fake data. `TRANSPORT_PARTIAL` is the
status for those slots until the resolver lands.

## Boundaries

- depends only on `@server/domains-v2/identity/public-api`,
  `@server/domains-v2/social/public-api` and
  `@server/application-v2/use-cases/contacts/public-api`;
- never imports `*/internal`, `*/service`, `*/repository`, `*/policy`
  of source domains;
- never returns raw owner-only DTOs to the frontend.

## Privacy

- `contactPanel.visibleFields` is the ONLY non-owner path that can carry
  PII, and only because `contactAccess.getVisibleContactFieldsForViewer`
  already applied the per-field policy gate.
- private profiles short-circuit non-owner viewers with `PROFILE_RESTRICTED`.
- private workplaces / hidden modules are filtered out by their respective
  resolvers; the orchestrator never sees them.
