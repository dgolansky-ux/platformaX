/**
 * features-v2/public-hub — UI feature barrel
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY (no @server/* imports).
 */
export { PublicHubView } from "./PublicHubView";
export { publicHubMockAdapter } from "./mock-adapter";
export { TopicsSlot } from "./slots/TopicsSlot";
export { EventsSlot } from "./slots/EventsSlot";
export { IntegrationsSlot } from "./slots/IntegrationsSlot";
export { NewsletterChatSlot } from "./slots/NewsletterChatSlot";
export type {
  HubViewUiDTO,
  HubModuleSlotUi,
  HubOwnerSummaryUi,
  HubTopicUi,
  HubEventUi,
  HubIntegrationUi,
  HubNewsletterChatUi,
} from "./types";
