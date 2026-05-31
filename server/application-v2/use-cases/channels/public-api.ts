/**
 * application-v2/use-cases/channels — public API (Slice 7 product slice).
 */
export { createChannelsUseCase } from "./service";
export type { ChannelsUseCase, ChannelsUseCaseDeps } from "./service";
export type {
  ChannelsUseCaseErrorCode,
  ChannelsUseCaseResult,
  CreateCommunityChannelCommand,
  AssignCommunityChannelLeadCommand,
  RevokeCommunityChannelLeadCommand,
  UpdateCommunityChannelLeadPermissionsCommand,
  FollowChannelCommand,
  ChannelDirectoryCard,
  ChannelsDirectoryView,
  ChannelLeadPublicView,
  ChannelProfileView,
  ChannelsDirectoryQuery,
  GetChannelLeadsView,
} from "./types";
