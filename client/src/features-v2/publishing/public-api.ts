/**
 * features-v2/publishing — public API surface.
 * Other features import only from here.
 */
export { PublishingComposerCore } from "./PublishingComposerCore";
export { ComposerTrigger } from "./ComposerTrigger";
export { ComposerModal } from "./ComposerModal";
export { PublishingTargetSelector } from "./PublishingTargetSelector";
export { PublishingVisibilitySelector } from "./PublishingVisibilitySelector";
export { PublishingMediaPicker } from "./PublishingMediaPicker";
export { PublishingPreview } from "./PublishingPreview";
export { PublishingSubmitBar } from "./PublishingSubmitBar";
export {
  PublishingLoadingState,
  PublishingSuccessState,
  PublishingPartialState,
  PublishingBlockedState,
  PublishingErrorState,
} from "./PublishingStates";

export { usePublishingTargets } from "./hooks/usePublishingTargets";
export { usePublishingPreview } from "./hooks/usePublishingPreview";
export { usePublishCommand } from "./hooks/usePublishCommand";

export {
  useComposerOpenEvent,
  dispatchOpenComposer,
  type ComposerSurface,
} from "./useComposerOpenEvent";

export { FriendFeedComposer } from "./composers/FriendFeedComposer";
export {
  CommunityFeedComposer,
  StaffFeedComposer,
  RelationalFeedComposer,
} from "./composers/CommunityFeedComposer";
export { ChannelComposer } from "./composers/ChannelComposer";
export { WorkplaceComposer } from "./composers/WorkplaceComposer";
export { ImportantEventComposer } from "./composers/ImportantEventComposer";
export { ProfilePresentationComposer } from "./composers/ProfilePresentationComposer";

export {
  createPublishingMockAdapter,
  PUBLISHING_MOCK_DEFAULT_TARGETS,
} from "./mock-adapter";

export type {
  PublishingAdapter,
  PublishingCommandUi,
  PublishingContentTypeUi,
  PublishingErrorCodeUi,
  PublishingErrorUi,
  PublishingMediaRefUi,
  PublishingMediaTypeUi,
  PublishingPreviewUi,
  PublishingResultStatusUi,
  PublishingResultUi,
  PublishingTargetDefinitionUi,
  PublishingTargetStatusUi,
  PublishingTargetTypeUi,
  PublishingVisibilityUi,
  PublishingBlockedReasonUi,
} from "./types";
