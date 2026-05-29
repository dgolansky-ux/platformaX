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
import styles from "./ContactsPage.module.css";

const MOCK_VIEWER_ID = "u-mock-alice" as UserId;

export function ContactsPage() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="kontakty"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <ContactsTab viewerId={MOCK_VIEWER_ID} />
      </main>
    </div>
  );
}
