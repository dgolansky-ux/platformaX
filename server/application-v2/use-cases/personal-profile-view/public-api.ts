/**
 * application-v2/use-cases/personal-profile-view — public API.
 *
 * Server bootstrap (and tests) import the factory + the application error +
 * resolver-port contracts here. The frontend never reaches into this module
 * directly; it depends on `PersonalProfileViewAdapter` in
 * `@shared/contracts/personal-profile-view` instead.
 */
export { createPersonalProfileViewService } from "./service";
export type {
  PersonalProfileViewService,
  PersonalProfileViewServiceDeps,
  GetPersonalProfileViewInput,
  PersonalProfileViewResult,
  PersonalProfileViewError,
  PersonalProfileViewErrorCode,
} from "./service";
export type {
  PersonalProfileWorkplacesResolver,
  PersonalProfilePublicHubResolver,
  PersonalProfileChannelsResolver,
} from "./contracts";
export {
  decideViewerRelation,
  deriveViewerState,
  friendFeedAvailability,
  hiddenFieldsReason,
  projectVisibleContactFields,
} from "./policy";
export { createProfilePageActions } from "./actions";
export type { ProfilePageActions, ProfilePageActionDeps } from "./actions";
