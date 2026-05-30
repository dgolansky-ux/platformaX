/**
 * features-v2/friend-feed — UI feature barrel.
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 */
export { FriendFeedPage } from "./FriendFeedPage";
export { FriendFeedPostCard } from "./FriendFeedPostCard";
export { PersonalProfileFriendFeedPreview } from "./PersonalProfileFriendFeedPreview";
export { friendFeedMockAdapter } from "./mock-adapter";
export type {
  FriendFeedItemUi,
  FriendFeedPageUi,
  FriendFeedAuthorUi,
  FriendFeedVisibility,
  FriendFeedComposerStateUi,
  PersonalProfileFriendFeedPreviewUi,
  FriendPostCommentUi,
} from "./types";
