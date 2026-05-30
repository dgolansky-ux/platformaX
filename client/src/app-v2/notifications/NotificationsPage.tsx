/**
 * app-v2/notifications/NotificationsPage — route shell for /notifications.
 *
 * Composes the desktop sidebar with the notifications-v2 Activity Center.
 * The feature itself owns the mock adapter and unread badge subscription.
 */
import { NotificationsPage as ActivityCenter } from "@client/features-v2/notifications-v2";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./NotificationsPage.module.css";

const DEMO_VIEWER_ID = "u-viewer";

export function NotificationsPage() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="powiadomienia"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <ActivityCenter viewerUserId={DEMO_VIEWER_ID} />
      </main>
    </div>
  );
}
