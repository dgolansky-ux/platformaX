/**
 * social — public API surface.
 *
 * Other domains may import only from this file. Internal modules
 * (repository, service implementation files, policy) must NOT be reached
 * cross-domain. The Kontakty slice exposes:
 *  - factory `createSocialContactsService`,
 *  - port interfaces + in-memory factories (for tests / wiring),
 *  - request / response Input types,
 *  - pure policy helpers (consumed by the application use-case).
 */
export {
  createSocialContactsService,
} from "./social-contacts-service";
export {
  createSocialRelationshipService,
  createSocialRelationshipService as createSocialRelationshipV2Service,
} from "./service";
export type {
  SocialContactsService,
  SocialContactsServiceDeps,
  SocialContactsClock,
  SocialContactsIdGenerator,
  SocialContactsError,
  SocialContactsErrorCode,
  SocialContactsResult,
} from "./social-contacts-service";
export type {
  SocialRelationshipService,
  SocialRelationshipServiceDeps,
} from "./service";
export type {
  FriendRequest,
  SendFriendRequestInput,
  RespondToFriendRequestInput,
  AddAddressBookContactInput,
  AddSpecialistInput,
  SetFriendCircleInput,
  AddressBookEntry,
  ContactGroupEntry,
  FriendCircle,
  FriendEntry,
  SpecialistEntry,
  FriendRequestStatus,
} from "./social-contacts-dto";
export type {
  BlockUserInput,
  CancelFriendRequestInput,
  RespondFriendRequestInput,
  SocialRelationshipError,
  SocialRelationshipErrorCode,
  SocialRelationshipResult,
  UnblockUserInput,
} from "./dto";
export type { SocialRelationshipServiceContract } from "./contracts";
export type {
  FriendshipRepository,
  FriendRequestRepository,
  AddressBookRepository,
  SpecialistRepository,
  ContactGroupRepository,
} from "./social-contacts-ports";
export {
  createInMemoryFriendshipRepository,
  createInMemoryFriendRequestRepository,
  createInMemoryAddressBookRepository,
  createInMemorySpecialistRepository,
  createInMemoryContactGroupRepository,
} from "./social-contacts-store";
export { createInMemorySocialRelationshipRepository } from "./social-relationship-store";
export {
  canRespondToFriendRequest,
  isDuplicatePendingFriendRequest,
  isSelfRelation,
} from "./social-contacts-policy";
