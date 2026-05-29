/**
 * channels — public API surface (BACKEND_PARTIAL).
 * Other domains/use-cases import ONLY from here.
 */
export { createChannelsService } from "./service";
export type {
  ChannelsService,
  ChannelsServiceDeps,
  ChannelsResult,
  ChannelsErrorCode,
  ChannelsClock,
  ChannelsIdGenerator,
} from "./service";
export {
  createInMemoryChannelRepository,
  createInMemoryChannelLeadRepository,
  createInMemoryFollowRepository,
} from "./store";
export type {
  ChannelRepository,
  ChannelLeadRepository,
  FollowRepository,
} from "./ports";
export type {
  ChannelPublicDTO,
  ChannelLeadDTO,
  ChannelFollowDTO,
  CreateChannelInput,
  AssignChannelLeadInput,
  RevokeChannelLeadInput,
  UpdateChannelLeadPermissionsInput,
  UpdateChannelProfileInput,
  ChannelOwnerType,
  ChannelVisibility,
  ChannelStatus,
} from "./dto";
export {
  CHANNEL_LEAD_PERMISSIONS,
  MAX_ACTIVE_LEADS,
  MIN_ACTIVE_LEADS,
} from "./contracts";
export type {
  ChannelLeadRole,
  ChannelLeadPermission,
  ChannelLeadStatus,
} from "./contracts";
export {
  isValidChannelSlug,
  hasCommunityOwner,
  isValidLeadRole,
  isValidLeadPermission,
  normalizeLeadPermissions,
  canAddMoreLeads,
  canRemoveLead,
  leadHasPermission,
  canPublishChannelContent,
  canManageChannelContent,
  canPinChannelPost,
  canViewChannelFeed,
} from "./policy";
