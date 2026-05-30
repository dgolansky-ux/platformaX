/**
 * app-v2/friend-feed/FriendFeedPageRoute — route shell for /friends-feed.
 *
 * Mounts the Slice 13/17 friend feed runtime inside the shared AppShell.
 */
import { FriendFeedPage } from "@client/features-v2/friend-feed";
import { AppShell } from "../navigation/AppShell";

const DEMO_VIEWER_ID = "u-viewer";

export function FriendFeedPageRoute() {
  return (
    <AppShell active="feed" viewerUserId={DEMO_VIEWER_ID}>
      <FriendFeedPage viewerUserId={DEMO_VIEWER_ID} />
    </AppShell>
  );
}
