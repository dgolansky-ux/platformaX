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
