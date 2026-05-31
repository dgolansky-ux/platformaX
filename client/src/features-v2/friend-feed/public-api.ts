/**
 * features-v2/friend-feed — public surface for cross-feature imports.
 *
 * Other features (e.g. personal-profile's friend-feed preview slot) import
 * ONLY from here. The internal page + adapter modules are not reachable
 * cross-feature.
 */
export {
  PersonalProfileFriendFeedPreview,
  friendFeedMockAdapter,
} from "./index";
export type {
  FriendFeedAuthorUi,
  FriendFeedComposerStateUi,
  FriendFeedItemUi,
  FriendFeedPageUi,
  FriendFeedVisibility,
  PersonalProfileFriendFeedPreviewUi,
} from "./types";
