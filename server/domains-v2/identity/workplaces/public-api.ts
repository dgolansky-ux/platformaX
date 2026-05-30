/**
 * identity/workplaces — public API surface (Slice 12 / BACKEND_PARTIAL).
 *
 * Cross-domain importers must reach in ONLY through this file. Internal
 * modules (store, mapper internals, policy bodies) are not visible cross-
 * domain. Workplaces are part of the identity domain's professional layer —
 * they are NOT a community, and there are no member/role/join concepts.
 */
export { createWorkplacesService } from "./service";
export type {
  WorkplacesService,
  WorkplacesServiceDeps,
  WorkplacesResult,
  WorkplacesErrorCode,
  WorkplaceClock,
  WorkplaceIdGen,
  WorkplaceFriendshipResolver,
} from "./service";
export {
  createInMemoryWorkplaceRepository,
} from "./store";
export type { WorkplaceRepository } from "./store";
export {
  createNoopWorkplaceEventPublisher,
} from "./events";
export type {
  WorkplaceEventPublisher,
  WorkplaceDomainEvent,
  WorkplaceCreatedEvent,
  WorkplaceArchivedEvent,
} from "./events";
export type {
  WorkplaceContactAccessResolver,
  WorkplaceContactAccessVerdict,
  WorkplaceContactRule,
} from "./contracts";
export type {
  WorkplacePublicDTO,
  WorkplaceCardDTO,
  WorkplaceContactViewDTO,
  WorkplaceViewerStateDTO,
  WorkplaceStatus,
  WorkplaceVisibility,
  WorkplaceContactVisibility,
  CreateWorkplaceCommand,
  UpdateWorkplaceCommand,
  ArchiveWorkplaceCommand,
  ListWorkplacesForOwnerCommand,
} from "./dto";
export {
  WORKPLACE_NAME_MAX,
  WORKPLACE_SLUG_MAX,
  WORKPLACE_HEADLINE_MAX,
  WORKPLACE_DESCRIPTION_MAX,
  WORKPLACE_LOCATION_MAX,
  WORKPLACE_SPECIALIZATIONS_MAX,
  WORKPLACE_OWNER_ACTIVE_HARD_LIMIT,
} from "./dto";
export {
  canEditWorkplace,
  canViewContact,
  canViewWorkplace,
  describeContactVerdict,
  isWorkplaceContactVisibility,
  isWorkplaceVisibility,
  normalizeSlug,
  validateWebsiteUrl,
} from "./policy";
export {
  projectContactForViewer,
  toWorkplaceCard,
  toWorkplacePublic,
} from "./projections";
