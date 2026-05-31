# Notification Event Registry Draft

Status: `NOTIFICATION_MAPPING_DRAFT`.

No notifications runtime, UI, email, push, or activity center is implemented here. This draft records event-to-notification intent so future notification work has typed hooks to attach to.

## Friend Feed Events

### FriendFeedCommentCreated

- creates_notification: yes
- recipient: `postAuthorId`
- exclude_if_actor_is_recipient: yes
- reason: autor posta powinien wiedzieć o komentarzu
- payload: `eventId`, `eventType`, `actorUserId`, `recipientUserId`, `postId`, `commentId`, `occurredAt`, `correlationId`
- PII: no

### FriendFeedReactionAdded

- creates_notification: yes
- recipient: `postAuthorId`
- exclude_if_actor_is_recipient: yes
- reason: autor posta powinien wiedzieć o reakcji
- payload: `eventId`, `eventType`, `actorUserId`, `recipientUserId`, `postId`, `occurredAt`, `correlationId`
- PII: no

### FriendFeedCommentReactionAdded

- creates_notification: yes
- recipient: `commentAuthorId`
- exclude_if_actor_is_recipient: yes
- reason: autor komentarza powinien wiedzieć o reakcji
- payload: `eventId`, `eventType`, `actorUserId`, `recipientUserId`, `postId`, `commentId`, `occurredAt`, `correlationId`
- PII: no

### FriendFeedCommentUpdated

- creates_notification: no
- reason: edycja własnego komentarza zwykle nie wymaga powiadomienia
- payload: `eventId`, `eventType`, `actorUserId`, `recipientUserId`, `postId`, `commentId`, `occurredAt`, `correlationId`
- PII: no

### FriendFeedCommentDeleted

- creates_notification: no
- reason: usunięcie własnego komentarza zwykle nie wymaga powiadomienia
- payload: `eventId`, `eventType`, `actorUserId`, `recipientUserId`, `postId`, `commentId`, `occurredAt`, `correlationId`
- PII: no

## Runtime Status

- Outbox: `OUTBOX_SKELETON`
- Notifications domain: `SCAFFOLD_ONLY`
- Delivery channels: not implemented
- Notification UI: not implemented
