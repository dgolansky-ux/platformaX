/**
 * features-v2/professional-profile — public exports.
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY (Slice 12).
 */
export { ProfileProfessionalLayer } from "./ProfileProfessionalLayer";
export { WorkplacePage } from "./WorkplacePage";
export { WorkplaceWizard } from "./WorkplaceWizard";
export { WorkplaceMicroFeed } from "./WorkplaceMicroFeed";
export { professionalProfileMockAdapter } from "./mock-adapter";
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
