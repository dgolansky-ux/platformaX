/**
 * features-v2/professional-profile — public surface.
 *
 * Other features import ONLY from this file (boundary guard requires
 * cross-feature imports to go through `/public-api`, `/contracts`, or
 * `/events`).
 */
export {
  ProfileProfessionalLayer,
  WorkplacePage,
  WorkplaceWizard,
  WorkplaceMicroFeed,
  professionalProfileMockAdapter,
} from "./index";
export type {
  CreateWorkplaceInputUi,
  CreateWorkplacePostInputUi,
  ProfessionalLayerItemUi,
  ProfessionalLayerUi,
  ProfessionalProfileAdapterResult,
  WorkplaceCardUi,
  WorkplaceContactViewUi,
  WorkplaceContactVisibilityUi,
  WorkplaceMicroFeedItemUi,
  WorkplaceMicroFeedPageUi,
  WorkplaceOwnerSummaryUi,
  WorkplacePageUi,
  WorkplacePostTypeUi,
  WorkplacePostUi,
  WorkplacePostVisibilityUi,
  WorkplacePublicUi,
  WorkplaceStatusUi,
  WorkplaceTeaserItemUi,
  WorkplaceTeaserPageUi,
  WorkplaceTeaserUi,
  WorkplaceViewerStateUi,
  WorkplaceVisibilityUi,
} from "./types";
