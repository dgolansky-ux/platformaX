# application-v2/use-cases/feed

Status: `PARTIAL`

Cross-domain flow (ADR-010, rule PX-APP-001) composing **social** and
**content-v2**.

`getFriendFeedFoundation(viewerUserId, cursor?, limit?)`:

1. `social.listFriends(viewerUserId)` → the explicit set of friend ids.
2. `content.listFriendFeed({ viewerUserId, authorUserIds, cursor, limit })`.

The author set is always explicit — there is **no global feed**, no ranking and
no fanout here. content-v2 owns visibility filtering (`canSeePost`); social owns
who counts as a friend. The use-case owns no data and only calls each domain's
`public-api.ts`.
