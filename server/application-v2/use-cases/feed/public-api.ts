/**
 * application-v2/use-cases/feed — public API.
 *
 * Server bootstrap (and the frontend mock adapter for the MOCK_LOCAL_ONLY
 * phase) imports the factory + application-level types from here.
 */
export { createFriendFeedUseCase } from "./service";
export type {
  FriendFeedUseCase,
  FriendFeedUseCaseDeps,
  FriendFeedFoundationInput,
  FriendFeedFoundationView,
} from "./service";
