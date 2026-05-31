# newsletter-chat-v2

**Status:** FOUNDATION_READY (in-memory store, no HTTP transport)
**Delivery:** NO_EMAIL_DELIVERY — broadcasts persist, fanout/delivery is
out of scope for this slice.

Owns the **Newsletter chatowy** module's data. A newsletter chat is a
one-way broadcast surface: the owner (or community admin) publishes
messages, subscribers receive them. Subscribers cannot post inbound —
this is **not** a private chat.

## Out of scope this slice

- Email or push delivery.
- Subscriber list / member identities — only counts are exposed publicly.
- Inbound messages from subscribers.
- 1:1 chat.
- Massive fanout.

## Public surface

Import only from `public-api.ts`. Public DTO carries no `createdByUserId`
on the chat and no `authorUserId` on messages.
