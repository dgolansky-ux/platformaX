import { ContactRequestsPage as ContactRequestsPageFeature } from "@client/features-v2/social/friends";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./ContactsPage.module.css";

export function ContactRequestsPage() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="kontakty"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <ContactRequestsPageFeature />
      </main>
    </div>
  );
}
