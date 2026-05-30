/**
 * features-v2/content-display — public API surface.
 */
export {
  PostDisplayRoot,
  PostAuthorSummary,
  PostDisplayHeader,
  PostBody,
  PostMediaGrid,
  PostMeta,
  PostPrivacyBadge,
  PostBadgeRow,
} from "./PostDisplayKit";
export { PostActionBar, PostRouteLink } from "./PostActionBar";
export { PostSkeleton, PostErrorState, PostEmptyState } from "./PostDisplayStates";

export {
  FriendFeedPostCard,
  CommunityFeedPostCard,
  StaffFeedPostCard,
  RelationalFeedPostCard,
  ChannelPostCard,
  WorkplacePostCard,
  WorkplaceTeaserCard,
  ImportantEventCard,
  ProfilePresentationCard,
  CompactPostPreviewCard,
} from "./variants/PostCardVariants";

export type {
  PostDisplayActionBarConfig,
  PostDisplayAuthor,
  PostDisplayBadge,
  PostDisplayInteractionSummary,
  PostDisplayMediaRef,
  PostDisplaySourceContext,
  PostDisplayStatus,
  PostDisplayType,
  PostDisplayViewModel,
  PostDisplayVisibility,
} from "./types";
