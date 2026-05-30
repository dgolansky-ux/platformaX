import { FriendRequestsPage as FriendRequestsPageFeature } from "@client/features-v2/social/friends";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "../contacts/ContactsPage.module.css";

export function FriendRequestsPage() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="kontakty"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <FriendRequestsPageFeature />
      </main>
    </div>
  );
}
