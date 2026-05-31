# features-v2/friend-feed

**Status:** UI_SHELL_ONLY + MOCK_LOCAL_ONLY

Owner-agnostic friend feed UI. Exports:

- `FriendFeedPage` — full feed at `/friends-feed`. Header + composer + list +
  empty / loading / error / permission states.
- `FriendFeedPostCard` — single post with reactions + expandable comments.
- `PersonalProfileFriendFeedPreview` — compact preview surfaced on the
  personal profile (owner / friend / stranger states, CTA to `/friends-feed`).

The mock adapter mirrors the V2 friend-feed visibility policy (friends_only
hidden from strangers, private only the author) so disabling a relationship
in the fixture immediately collapses the rendered slot.

No `@server/*` imports.
