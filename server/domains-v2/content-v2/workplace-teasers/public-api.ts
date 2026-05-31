/**
 * content-v2/workplace-teasers — public API (Slice 12 / BACKEND_PARTIAL).
 */
export {
  createWorkplaceTeasersService,
} from "./service";
export type {
  WorkplaceTeasersService,
  WorkplaceTeasersServiceDeps,
  WorkplaceTeaserCreateResult,
  WorkplaceTeasersErrorCode,
  WorkplaceTeaserPageDTO,
  WorkplaceTeaserClock,
  WorkplaceTeaserIdGen,
} from "./service";
export {
  createInMemoryWorkplaceTeaserRepository,
} from "./store";
export type { WorkplaceTeaserRepository } from "./ports";
export {
  createNoopWorkplaceTeaserEventPublisher,
} from "./events";
export type {
  WorkplaceTeaserEventPublisher,
  WorkplaceTeaserDomainEvent,
  FriendFeedWorkplaceTeaserCreatedEvent,
} from "./events";
export type { WorkplaceTeaserFriendshipResolver } from "./contracts";
export type {
  WorkplaceTeaserPublicDTO,
  WorkplaceTeaserVisibility,
  CreateWorkplaceTeaserCommand,
  ListWorkplaceTeasersForViewerQuery,
} from "./dto";
export {
  WORKPLACE_TEASER_DEFAULT_LIMIT,
  WORKPLACE_TEASER_MAX_LIMIT,
} from "./dto";
export {
  buildPreviewText,
  buildDedupeKey,
  canViewTeaser,
  deriveTeaserVisibility,
  isWorkplaceTeaserVisibility,
} from "./policy";
export {
  toWorkplaceTeaserPublic,
  workplacePostRoute,
} from "./projections";
