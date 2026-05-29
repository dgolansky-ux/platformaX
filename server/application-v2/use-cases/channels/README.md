# application-v2/use-cases/channels

Status: `PARTIAL`

Cross-domain flow (ADR-010, rule PX-APP-001) composing **communities-v2** and
**channels**.

`createChannelForCommunity(input)`:

1. `authority.canManageCommunity(communityId, actorUserId)` — the
   `CommunityAuthorityResolver` contract from communities-v2. Channels does not
   own community roles, so the authority decision lives here, not in the domain.
2. On success, `channels.createChannelForCommunity({ ownerType: "community", … })`.

Returns the channel public DTO, or `FORBIDDEN` when the actor cannot manage the
community. The use-case owns no data and uses only public surfaces.
