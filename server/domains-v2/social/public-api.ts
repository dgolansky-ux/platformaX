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
  FriendRequest,
  SendFriendRequestInput,
  RespondToFriendRequestInput,
  AddAddressBookContactInput,
  AddSpecialistInput,
  AddressBookEntry,
  FriendEntry,
  SpecialistEntry,
  FriendRequestStatus,
} from "./social-contacts-dto";
export type {
  FriendshipRepository,
  FriendRequestRepository,
  AddressBookRepository,
  SpecialistRepository,
} from "./social-contacts-ports";
export {
  createInMemoryFriendshipRepository,
  createInMemoryFriendRequestRepository,
  createInMemoryAddressBookRepository,
  createInMemorySpecialistRepository,
} from "./social-contacts-store";
export {
  canRespondToFriendRequest,
  isDuplicatePendingFriendRequest,
  isSelfRelation,
} from "./social-contacts-policy";
