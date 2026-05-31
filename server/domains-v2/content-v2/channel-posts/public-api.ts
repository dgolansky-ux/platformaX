export { createChannelPostService } from "./service";
export type {
  ChannelPostService,
  ChannelPostServiceDeps,
  ChannelPostClock,
  ChannelPostIdGenerator,
} from "./service";
export { createInMemoryChannelPostRepository } from "./store";
export type { ChannelPostRepository, ChannelPostRecord } from "./ports";
export type {
  ChannelFeedItemDTO,
  ChannelPostDTO,
  ChannelPostStatus,
  CreateChannelPostInput,
  DeactivateChannelPostInput,
  ListChannelPostsInput,
  PinChannelPostInput,
  UpdateChannelPostInput,
} from "./dto";
export type {
  ChannelFeedPage,
  ChannelPostErrorCode,
  ChannelPostResult,
} from "./contracts";
export {
  CHANNEL_POST_BODY_MAX,
  canAuthorMutatePost,
} from "./policy";
