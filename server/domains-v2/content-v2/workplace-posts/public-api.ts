/**
 * content-v2/workplace-posts — public API (Slice 12 / BACKEND_PARTIAL).
 *
 * Cross-domain importers reach in via this file only.
 */
export { createWorkplacePostsService } from "./service";
export type {
  WorkplacePostsService,
  WorkplacePostsServiceDeps,
  WorkplacePostsResult,
  WorkplacePostsErrorCode,
  WorkplacePostClock,
  WorkplacePostIdGen,
} from "./service";
export { createInMemoryWorkplacePostRepository } from "./store";
export type { WorkplacePostRepository } from "./ports";
export {
  createNoopWorkplacePostEventPublisher,
} from "./events";
export type {
  WorkplacePostEventPublisher,
  WorkplacePostDomainEvent,
  WorkplacePostCreatedEvent,
} from "./events";
export type {
  WorkplaceOwnershipResolver,
  WorkplacePostFriendshipResolver,
} from "./contracts";
export type {
  WorkplacePostPublicDTO,
  WorkplacePostListDTO,
  WorkplacePostType,
  WorkplacePostStatus,
  WorkplacePostVisibility,
  CreateWorkplacePostCommand,
  DeactivateWorkplacePostCommand,
  ListWorkplacePostsQuery,
} from "./dto";
export {
  WORKPLACE_POST_BODY_MAX,
  WORKPLACE_POST_MEDIA_REFS_MAX,
  WORKPLACE_POST_DEFAULT_LIMIT,
  WORKPLACE_POST_MAX_LIMIT,
  WORKPLACE_POST_TEASER_PREVIEW_MAX,
} from "./dto";
export {
  canViewWorkplacePost,
  isWorkplacePostType,
  isWorkplacePostVisibility,
} from "./policy";
export {
  toWorkplacePostPublic,
} from "./projections";
