/**
 * content-v2/friend-posts — public API surface (FOUNDATION_READY).
 *
 * Other domains / use-cases import only from this file. Internal modules
 * (store, projections, policy, service body) are not reachable cross-domain.
 */
export { createFriendPostsService } from "./service";
export type {
  FriendPostsService,
  FriendPostsServiceDeps,
  FriendPostsResult,
  FriendPostsErrorCode,
  FriendPostsClock,
  FriendPostsIdGen,
  FriendFeedRawPageDTO,
} from "./service";
export {
  createInMemoryFriendPostRepository,
  createInMemoryFriendPostCommentRepository,
  createInMemoryFriendPostReactionRepository,
} from "./store";
export type {
  FriendPostRepository,
  FriendPostCommentRepository,
  FriendPostReactionRepository,
} from "./store";
export type { FriendshipResolver } from "./contracts";
export {
  createNoopFriendFeedEventPublisher,
} from "./events";
export type {
  FriendFeedEventPublisher,
  FriendFeedDomainEvent,
  FriendFeedPostCreatedEvent,
  FriendFeedCommentCreatedEvent,
  FriendFeedReactionAddedEvent,
  FriendFeedCommentReactionAddedEvent,
  FriendFeedCommentUpdatedEvent,
  FriendFeedCommentDeletedEvent,
} from "./events";
export type {
  FriendPostDTO,
  FriendPostPublicDTO,
  FriendPostVisibility,
  FriendPostStatus,
  FriendPostAuthorSummary,
  FriendFeedItemDTO,
  FriendFeedPageDTO,
  FriendPostCommentDTO,
  FriendPostCommentPublicDTO,
  FriendFeedReactionSummaryDTO,
  FriendFeedViewerReactionStateDTO,
  FriendFeedInteractionSummaryDTO,
  FriendFeedReactionTargetType,
  FriendFeedReactionType,
  FriendPostReactionSummaryDTO,
  FriendPostViewerStateDTO,
  PersonalProfileFriendFeedPreviewDTO,
  CreateFriendPostCommand,
  UpdateFriendPostInput,
  DeactivateFriendPostInput,
  ListFriendFeedCommand,
  GetProfileFriendFeedPreviewCommand,
  CreateFriendPostCommentInput,
  UpdateFriendPostCommentInput,
  DeleteFriendPostCommentInput,
  ListFriendPostCommentsQuery,
  ReactToFriendPostInput,
  ReactToFriendPostCommentInput,
  GetFriendFeedInteractionSummaryQuery,
  FriendFeedCommentDTO,
  FriendFeedCommentListDTO,
  CreateFriendFeedCommentCommand,
  ReactToFriendFeedPostCommand,
  ReactToFriendFeedCommentCommand,
} from "./dto";
export {
  FRIEND_POST_BODY_MAX,
  FRIEND_POST_COMMENT_BODY_MAX,
  FRIEND_POST_MEDIA_REFS_MAX,
  FRIEND_FEED_DEFAULT_LIMIT,
  FRIEND_FEED_MAX_LIMIT,
  PROFILE_PREVIEW_DEFAULT_LIMIT,
  PROFILE_PREVIEW_MAX_LIMIT,
} from "./dto";
export {
  canViewFriendPost,
  isFriendPostVisibility,
} from "./policy";
export {
  toFriendPostPublic,
  toFriendPostCommentPublic,
} from "./projections";
