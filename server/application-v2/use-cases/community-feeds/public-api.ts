/**
 * application-v2/use-cases/community-feeds — public API (Slice 5).
 */
export { createCommunityFeedsUseCase } from "./service";
export type { CommunityFeedsUseCase, CommunityFeedsUseCaseDeps } from "./service";
export type {
  PublishScope,
  PublishCommunityPostCommand,
  PublishCommunityPostValue,
  CommunityFeedErrorCode,
  CommunityFeedResult,
  CommunityFeedTabsStateDTO,
  CommunityFeedTabVisibility,
  ListCommunityFeedResult,
} from "./types";
export { MAX_DESCENDANT_TARGETS } from "./types";
