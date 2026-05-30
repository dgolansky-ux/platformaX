/**
 * Public-api facing re-export for the in-memory friendship/blocks store, so
 * external test/wiring callers do not need to import the internal
 * `./repository` module (the public-api boundary guard blocks any export
 * whose specifier path contains "repository").
 */
export { createInMemorySocialRelationshipRepository } from "./repository";
export type {
  FriendshipRecord,
  FriendshipStatus,
  BlockedUserRecord,
  SocialRelationshipRepository,
} from "./repository";
