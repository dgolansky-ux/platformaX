# Notification Event Registry (Slice 14)

Status: `EVENT_REGISTRY_READY`

Single source of truth for which product events trigger an in-app
notification, who the recipient is, and the current handler status. Mirrors
the typed registry at
[`server/domains-v2/notifications-v2/event-registry.ts`](../../../server/domains-v2/notifications-v2/event-registry.ts).
The typed copy is authoritative; this Markdown is the human-readable view.

Handler statuses
- `implemented` — application-v2 handler wired in this slice.
- `planned` — decision is `yes` but handler not wired yet.
- `no_notification_needed` — explicit decision NOT to notify.
- `blocked_by_missing_source_event` — handler intent exists but source domain
  does not emit the event yet.

## Friend feed

| Event | createsNotification | Recipient | Actor | Category | Status | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| FriendFeedPostCreated | no | — | postAuthorId | — | no_notification_needed | Friends already see new posts on the feed — pushing a notification per post would be noise. |
| FriendFeedCommentCreated | yes | postAuthorId | commentAuthorId | friend_feed | implemented | Post author should be notified about a new comment on their post. |
| FriendFeedReactionAdded | yes | postAuthorId | reactorId | friend_feed | implemented | Post author should be notified about a new reaction on their post. |
| FriendFeedCommentReactionAdded | yes | commentAuthorId | reactorId | friend_feed | implemented | Comment author should be notified about a new reaction on their comment. |

## Communities

| Event | createsNotification | Recipient | Actor | Category | Status |
| --- | --- | --- | --- | --- | --- |
| CommunityInviteCreated | yes | invitedUserId | inviterUserId | communities | blocked_by_missing_source_event |
| CommunityJoinRequestCreated | yes | communityAdmins | requesterId | communities | blocked_by_missing_source_event |
| CommunityJoinRequestAccepted | yes | requesterId | decisionMakerId | communities | blocked_by_missing_source_event |
| CommunityJoinRequestRejected | yes | requesterId | decisionMakerId | communities | blocked_by_missing_source_event |
| CommunityRoleChanged | yes | affectedUserId | actorUserId | communities | blocked_by_missing_source_event |
| SubcommunityCreated | no | — | actorUserId | communities | planned |

## Channels

| Event | createsNotification | Recipient | Actor | Category | Status |
| --- | --- | --- | --- | --- | --- |
| ChannelPostCreated | yes | channelFollowers | publisherId | channels | blocked_by_missing_source_event |
| ChannelLeadAssigned | yes | assignedUserId | actorUserId | channels | blocked_by_missing_source_event |
| ChannelLeadRevoked | yes | affectedUserId | actorUserId | channels | blocked_by_missing_source_event |
| ChannelPostCommentCreated | yes | postAuthorId | commentAuthorId | channels | blocked_by_missing_source_event |
| ChannelPostReactionAdded | yes | postAuthorId | reactorId | channels | blocked_by_missing_source_event |

## Modules

| Event | createsNotification | Recipient | Actor | Category | Status |
| --- | --- | --- | --- | --- | --- |
| EventCreated | yes | ownerAudience | actorUserId | modules | blocked_by_missing_source_event |
| EventUpdated | yes | interestedUsers | actorUserId | modules | blocked_by_missing_source_event |
| TopicCreated | no | — | actorUserId | modules | no_notification_needed |
| NewsletterMessagePublished | yes | newsletterSubscribers | publisherId | modules | blocked_by_missing_source_event |
| IntegrationCreated | no | — | actorUserId | modules | no_notification_needed |

## Professional

| Event | createsNotification | Recipient | Actor | Category | Status |
| --- | --- | --- | --- | --- | --- |
| WorkplacePostCreated | no | — | authorUserId | professional | no_notification_needed |
| WorkplaceContactRequestCreated | yes | workplaceOwnerId | requesterId | professional | blocked_by_missing_source_event |

## Runtime status

- Outbox: `OUTBOX_SKELETON` — notifications consume application-v2 mappings;
  full outbox/worker runtime not wired this slice.
- Notifications domain: `BACKEND_PARTIAL` — in-memory adapter ships,
  durable adapter pending.
- Delivery channels: in-app only. Email / push / mobile-native not implemented.
- Notification UI: `UI_SHELL_ONLY` + `MOCK_LOCAL_ONLY`.

## Integrity check

The `notifications-v2-event-registry` test asserts that every entry has a
non-empty `eventType`, `sourceDomain`, `recipientRule`, `actorRule`, `reason`,
that every `createsNotification: true` entry has a valid category, and that
`no_notification_needed` entries never promise a notification. Adding a new
entry to the typed registry without updating those fields fails the build.
