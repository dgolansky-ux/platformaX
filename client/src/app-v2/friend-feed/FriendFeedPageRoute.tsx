/**
 * app-v2/friend-feed/FriendFeedPageRoute — route shell for /friends-feed.
 *
 * Mounts the Slice 13/17 friend feed runtime behind the real platform route
 * used by sidebar navigation and personal-profile preview CTAs.
 */
import { FriendFeedPage } from "@client/features-v2/friend-feed";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import { FloatingNav } from "../navigation/FloatingNav";
import styles from "./FriendFeedPageRoute.module.css";

const DEMO_VIEWER_ID = "u-viewer";

export function FriendFeedPageRoute() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="feed"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
        viewerUserId={DEMO_VIEWER_ID}
      />
      <main className={styles.content}>
        <FriendFeedPage viewerUserId={DEMO_VIEWER_ID} />
      </main>
      <FloatingNav active="feed" />
    </div>
  );
}
