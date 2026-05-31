/**
 * features-v2/social/contacts — public feature surface.
 *
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY (see README.md).
 *
 * Other feature folders or app-v2 routes may import from this file only.
 * Internal files (mock-adapter, individual components, css module) are
 * implementation detail and must not be reached from outside the feature.
 */
export { ContactsTab } from "./ContactsTab";
export type { ContactsTabProps } from "./ContactsTab";
// Embeddable on the public profile page (profile contact CTA / detail panel).
export { ProfileContactCard } from "./ProfileContactCard";
export { ContactPersonDetailsPanel } from "./ContactPersonDetailsPanel";
