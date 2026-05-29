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
  createInMemoryFollowRepository,
} from "./store";
export type { ChannelRepository, FollowRepository } from "./ports";
export type {
  ChannelPublicDTO,
  ChannelFollowDTO,
  CreateChannelInput,
  ChannelOwnerType,
  ChannelVisibility,
  ChannelStatus,
} from "./dto";
export { isValidChannelSlug, hasCommunityOwner } from "./policy";
