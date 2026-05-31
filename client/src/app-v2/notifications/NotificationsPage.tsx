/**
 * app-v2/notifications/NotificationsPage — route shell for /notifications.
 *
 * Mounts the shared AppShell (sidebar + mobile bottom-nav) around the
 * notifications-v2 Activity Center. The feature itself owns the mock adapter
 * and unread badge subscription.
 */
import { NotificationsPage as ActivityCenter } from "@client/features-v2/notifications-v2";
import { AppShell } from "../navigation/AppShell";

const DEMO_VIEWER_ID = "u-viewer";

export function NotificationsPage() {
  return (
    <AppShell active="powiadomienia">
      <ActivityCenter viewerUserId={DEMO_VIEWER_ID} />
    </AppShell>
  );
}
