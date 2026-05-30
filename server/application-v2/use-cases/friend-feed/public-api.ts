/**
 * application-v2/use-cases/friend-feed — public API.
 */
export { createFriendFeedUseCaseV2 } from "./service";
export type { FriendFeedUseCaseV2, FriendFeedUseCaseDeps } from "./service";
export type {
  FriendFeedItemViewDTO,
  FriendFeedPageViewDTO,
  PersonalProfileFriendFeedPreviewViewDTO,
  FriendFeedComposerStateViewDTO,
} from "./types";
