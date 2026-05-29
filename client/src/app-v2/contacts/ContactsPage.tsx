/**
 * app-v2/contacts/ContactsPage — route shell for /contacts.
 *
 * Composes the DesktopSidebar (with `active="kontakty"`) and the
 * `features-v2/social/contacts` UI shell. No data fetching here; the
 * feature owns its mock adapter (MOCK_LOCAL_ONLY status, see the
 * feature README).
 */
import { ContactsTab } from "@client/features-v2/social/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import { DesktopSidebar } from "../navigation/DesktopSidebar";

const MOCK_VIEWER_ID = "u-mock-alice" as UserId;

export function ContactsPage() {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f8fafc" }}>
      <DesktopSidebar
        active="kontakty"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <div style={{ flex: 1 }}>
        <ContactsTab viewerId={MOCK_VIEWER_ID} />
      </div>
    </div>
  );
}
