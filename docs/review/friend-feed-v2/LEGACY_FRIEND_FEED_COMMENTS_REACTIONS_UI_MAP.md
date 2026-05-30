# Legacy Friend Feed Comments / Reactions UI Map — Slice 13

Status: `PARTIAL` legacy inventory. The clean-room repository does not contain the V1 runtime tree, so this map is based on the existing Slice 11 legacy UI map plus V2 adjacent interaction shells.

## Files reviewed

- `docs/review/friend-feed-v2/LEGACY_FRIEND_FEED_UI_MAP.md`
- `client/src/features-v2/friend-feed/FriendFeedPostCard.tsx`
- `client/src/features-v2/friend-feed/FriendFeedComments.tsx`
- `client/src/features-v2/communities-v2/feeds/interactions/CommunityPostInteractions.tsx`
- `client/src/features-v2/communities-v2/feeds/interactions/CommunityCommentsList.tsx`
- `client/src/features-v2/communities-v2/feeds/interactions/CommunityCommentComposer.tsx`
- `client/src/features-v2/channels/ChannelPostInteractions.tsx`
- `client/src/features-v2/channels/ChannelCommentComponents.tsx`

## Action Bar

Carry over:
- Horizontal pill actions under the post body.
- `Polub` / `Lubię to` copy with count in the same control.
- `Komentarze · N` toggle; comments are collapsed by default.
- Subtle border-top divider, small typography, mobile-friendly wrapping.

Reject:
- Legacy tRPC/Supabase hooks.
- No-op action buttons.
- Fake counters.
- Window alerts/confirms.

## Comments

Carry over:
- Flat top-level list under the expanded post.
- Rounded muted comment rows.
- Author display name, comment body, edited marker.
- Inline composer with small input and compact send button.
- Empty copy: `Brak komentarzy. Bądź pierwszy.`
- Permission copy when viewer cannot comment.
- Loading/error states distinct from empty.

V2 adjustment:
- Deleted comments render as `Komentarz usunięty`; body is stripped in DTO/store projections.
- Own edit/delete are inline text actions, not modal/confirm runtime.

## Reactions

Carry over:
- MVP reaction type: `like`.
- Toggle behavior with viewer active state.
- Batch counts for posts; no N+1 count contract in application view.

V2 addition:
- Comment reactions use the same subtle text action and count.
- Public posts can be viewed, but comment/react policy remains owner/friends by default.

## What Transfers 1:1

- Single-column feed cards.
- Subtle action pills.
- Collapsed comments by default.
- Compact inline comment composer.
- Friendly permission/empty copy.
- Mobile wrap behavior rather than dense toolbars.

## What Is Rejected

- Legacy runtime coupling.
- Old hooks/router/tRPC/Supabase imports.
- `localStorage` / `sessionStorage` backend.
- Fake save and fake counters.
- Raw records or private contact fields in DTOs/events.
- Comments/reactions stored in `social`.
