/**
 * app-v2/contacts/ContactsPage — route shell for /contacts.
 *
 * Mounts the shared AppShell (sidebar + mobile bottom-nav) around the
 * features-v2/social/contacts UI shell. No data fetching here; the feature
 * owns its mock adapter (MOCK_LOCAL_ONLY).
 */
import { ContactsTab } from "@client/features-v2/social/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import { AppShell } from "../navigation/AppShell";

const MOCK_VIEWER_ID = "u-mock-alice" as UserId;

export function ContactsPage() {
  return (
    <AppShell active="kontakty">
      <ContactsTab viewerId={MOCK_VIEWER_ID} />
    </AppShell>
  );
}
