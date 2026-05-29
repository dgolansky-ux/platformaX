/**
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
