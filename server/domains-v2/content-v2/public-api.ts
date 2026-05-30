/**
 * QUALITY_STRUCTURE_EXCEPTION: Aggregated content-v2 facade for legacy slices
 * plus Slice-11 friend-posts; kept stable for cross-domain imports.
 *
 * content-v2 — public API surface (BACKEND_PARTIAL / READ_MODEL_SKELETON).
 * Other domains/use-cases import ONLY from here.
 */
export { createContentService } from "./service";
export type {
  ContentService,
  ContentServiceDeps,
  ContentResult,
  ContentErrorCode,
  ContentClock,
  ContentIdGenerator,
} from "./service";
export { createInMemoryPostRepository } from "./store";
export type { PostRepository } from "./ports";
export type {
  PostPublicDTO,
  FriendFeedItemDTO,
  FriendFeedQuery,
  CreatePostInput,
  PostVisibility,
  PostStatus,
  PostContextType,
} from "./dto";
export { canSeePost } from "./policy";

// ── community-feeds (Slice 5) ──────────────────────────────────────────────
export { createCommunityFeedService } from "./community-feeds/service";
export type {
  CommunityFeedService,
  CommunityFeedServiceDeps,
  CommunityFeedResult,
  CommunityFeedErrorCode,
  CommunityFeedClock,
  CommunityFeedIdGenerator,
} from "./community-feeds/service";
export {
  createInMemoryCommunityPostRepository,
  createInMemoryCommunityFeedItemRepository,
} from "./community-feeds/store";
export type {
  CommunityPostRepository,
  CommunityFeedItemRepository,
  CommunityPostRecord,
  CommunityFeedItemRecord,
} from "./community-feeds/ports";
export type {
  CommunityFeedType,
  CommunityPostStatus,
  CommunityPostDTO,
  CommunityFeedItemDTO,
  CommunityPostResult,
  CreateCommunityPostInput,
  DistributeCommunityPostInput,
  ListCommunityFeedQuery,
  RelationalCountQuery,
} from "./community-feeds/dto";
export { isValidFeedType, monthKeyOf } from "./community-feeds/policy";

// ── comments (Slice 6) ─────────────────────────────────────────────────────
export { createCommentService } from "./comments/service";
export type {
  CommentService,
  CommentServiceDeps,
  CommentClock,
  CommentIdGenerator,
} from "./comments/service";
export { createInMemoryCommentRepository } from "./comments/store";
export type { CommentRepository, CommentRecord } from "./comments/ports";
export type {
  CommentDTO,
  CommentListDTO,
  CommentStatus,
  CommentAuthorPublicSummaryDTO,
  CreateCommentInput,
  UpdateCommentInput,
  DeleteCommentInput,
  ListCommentsQuery,
  CountCommentsQuery,
} from "./comments/dto";
export type {
  CommentErrorCode,
  CommentResult,
  CommentCreatedValue,
  CommentUpdatedValue,
  CommentDeletedValue,
  CommentListValue,
} from "./comments/contracts";
export { COMMENT_BODY_MAX } from "./comments/policy";

// ── reactions (Slice 6) ────────────────────────────────────────────────────
export { createReactionService } from "./reactions/service";
export type {
  ReactionService,
  ReactionServiceDeps,
  ReactionClock,
  ReactionIdGenerator,
} from "./reactions/service";
export { createInMemoryReactionRepository } from "./reactions/store";
export type { ReactionRepository, ReactionRecord } from "./reactions/ports";
export { REACTION_TYPES } from "./reactions/dto";
export type {
  ReactionDTO,
  ReactionTargetType,
  ReactionType,
  ReactionTargetRef,
  ReactionSummaryDTO,
  ViewerReactionStateDTO,
  SetReactionInput,
  RemoveReactionInput,
  ToggleReactionInput,
  SummaryQuery as ReactionSummaryQuery,
  ViewerStateQuery as ReactionViewerStateQuery,
} from "./reactions/dto";
export type {
  ReactionErrorCode,
  ReactionResult,
  SetReactionValue,
  RemoveReactionValue,
  ToggleReactionValue,
  SummaryValue as ReactionSummaryValue,
  ViewerStateValue as ReactionViewerStateValue,
} from "./reactions/contracts";
export { isValidReactionType, isValidTargetType } from "./reactions/policy";

// ── friend-posts (Slice 11) ────────────────────────────────────────────────
export { createFriendPostsService } from "./friend-posts/service";
export type {
  FriendPostsService,
  FriendPostsServiceDeps,
  FriendPostsResult,
  FriendPostsErrorCode,
  FriendPostsClock,
  FriendPostsIdGen,
  FriendFeedRawPageDTO,
} from "./friend-posts/service";
export {
  createInMemoryFriendPostRepository,
  createInMemoryFriendPostCommentRepository,
  createInMemoryFriendPostReactionRepository,
} from "./friend-posts/store";
export type {
  FriendPostRepository,
  FriendPostCommentRepository,
  FriendPostReactionRepository,
} from "./friend-posts/store";
export type { FriendshipResolver } from "./friend-posts/contracts";
export {
  createNoopFriendFeedEventPublisher,
} from "./friend-posts/events";
export type {
  FriendFeedEventPublisher,
  FriendFeedDomainEvent,
  FriendFeedPostCreatedEvent,
  FriendFeedCommentCreatedEvent,
  FriendFeedReactionAddedEvent,
} from "./friend-posts/events";
export type {
  FriendPostDTO,
  FriendPostPublicDTO,
  FriendPostVisibility,
  FriendPostStatus,
  FriendPostAuthorSummary,
  FriendFeedItemDTO as FriendFeedItemEnrichedDTO,
  FriendFeedPageDTO,
  FriendPostCommentDTO,
  FriendPostCommentPublicDTO,
  FriendPostReactionSummaryDTO,
  FriendPostViewerStateDTO,
  PersonalProfileFriendFeedPreviewDTO,
  CreateFriendPostCommand,
  UpdateFriendPostInput,
  DeactivateFriendPostInput,
  ListFriendFeedCommand,
  GetProfileFriendFeedPreviewCommand,
  CreateFriendPostCommentInput,
  DeleteFriendPostCommentInput,
  ListFriendPostCommentsQuery,
} from "./friend-posts/dto";
export {
  FRIEND_POST_BODY_MAX,
  FRIEND_POST_COMMENT_BODY_MAX,
  FRIEND_POST_MEDIA_REFS_MAX,
  FRIEND_FEED_DEFAULT_LIMIT,
  FRIEND_FEED_MAX_LIMIT,
  PROFILE_PREVIEW_DEFAULT_LIMIT,
  PROFILE_PREVIEW_MAX_LIMIT,
} from "./friend-posts/dto";
export {
  canViewFriendPost,
  isFriendPostVisibility,
} from "./friend-posts/policy";
export {
  toFriendPostPublic,
  toFriendPostCommentPublic,
} from "./friend-posts/projections";

// ── workplace-posts (Slice 12) ─────────────────────────────────────────────
export { createWorkplacePostsService } from "./workplace-posts/service";
export type {
  WorkplacePostsService,
  WorkplacePostsServiceDeps,
  WorkplacePostsResult,
  WorkplacePostsErrorCode,
  WorkplacePostClock,
  WorkplacePostIdGen,
} from "./workplace-posts/service";
export { createInMemoryWorkplacePostRepository } from "./workplace-posts/store";
export type { WorkplacePostRepository } from "./workplace-posts/ports";
export {
  createNoopWorkplacePostEventPublisher,
} from "./workplace-posts/events";
export type {
  WorkplacePostEventPublisher,
  WorkplacePostDomainEvent,
  WorkplacePostCreatedEvent,
} from "./workplace-posts/events";
export type {
  WorkplaceOwnershipResolver,
  WorkplacePostFriendshipResolver,
} from "./workplace-posts/contracts";
export type {
  WorkplacePostPublicDTO,
  WorkplacePostListDTO,
  WorkplacePostType,
  WorkplacePostStatus,
  WorkplacePostVisibility,
  CreateWorkplacePostCommand,
  DeactivateWorkplacePostCommand,
  ListWorkplacePostsQuery,
} from "./workplace-posts/dto";
export {
  WORKPLACE_POST_BODY_MAX,
  WORKPLACE_POST_MEDIA_REFS_MAX,
  WORKPLACE_POST_DEFAULT_LIMIT,
  WORKPLACE_POST_MAX_LIMIT,
  WORKPLACE_POST_TEASER_PREVIEW_MAX,
} from "./workplace-posts/dto";
export {
  canViewWorkplacePost,
  isWorkplacePostType,
  isWorkplacePostVisibility,
} from "./workplace-posts/policy";
export { toWorkplacePostPublic } from "./workplace-posts/projections";

// ── workplace-teasers (Slice 12) ───────────────────────────────────────────
export { createWorkplaceTeasersService } from "./workplace-teasers/service";
export type {
  WorkplaceTeasersService,
  WorkplaceTeasersServiceDeps,
  WorkplaceTeaserCreateResult,
  WorkplaceTeasersErrorCode,
  WorkplaceTeaserPageDTO,
  WorkplaceTeaserClock,
  WorkplaceTeaserIdGen,
} from "./workplace-teasers/service";
export { createInMemoryWorkplaceTeaserRepository } from "./workplace-teasers/store";
export type { WorkplaceTeaserRepository } from "./workplace-teasers/ports";
export {
  createNoopWorkplaceTeaserEventPublisher,
} from "./workplace-teasers/events";
export type {
  WorkplaceTeaserEventPublisher,
  WorkplaceTeaserDomainEvent,
  FriendFeedWorkplaceTeaserCreatedEvent,
} from "./workplace-teasers/events";
export type { WorkplaceTeaserFriendshipResolver } from "./workplace-teasers/contracts";
export type {
  WorkplaceTeaserPublicDTO,
  WorkplaceTeaserVisibility,
  CreateWorkplaceTeaserCommand,
  ListWorkplaceTeasersForViewerQuery,
} from "./workplace-teasers/dto";
export {
  WORKPLACE_TEASER_DEFAULT_LIMIT,
  WORKPLACE_TEASER_MAX_LIMIT,
} from "./workplace-teasers/dto";
export {
  buildPreviewText as buildWorkplaceTeaserPreviewText,
  buildDedupeKey as buildWorkplaceTeaserDedupeKey,
  canViewTeaser as canViewWorkplaceTeaser,
  deriveTeaserVisibility as deriveWorkplaceTeaserVisibility,
  isWorkplaceTeaserVisibility,
} from "./workplace-teasers/policy";
export {
  toWorkplaceTeaserPublic,
  workplacePostRoute,
} from "./workplace-teasers/projections";

