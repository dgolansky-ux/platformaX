/**
 * app-v2/channels/ChannelsPage — route shell for /channels.
 *
 * App layer composes navigation and the channels-v2 public feature entry.
 * The feature owns its MOCK_LOCAL_ONLY adapter.
 */
import { ChannelsShell } from "@client/features-v2/channels";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./ChannelsPage.module.css";

export function ChannelsPage() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="kanaly"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <ChannelsShell />
      </main>
    </div>
  );
}
