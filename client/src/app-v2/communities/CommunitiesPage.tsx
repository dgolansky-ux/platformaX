/**
 * app-v2/communities/CommunitiesPage — route shell for /communities.
 *
 * App layer composes navigation and the communities-v2 public feature entry.
 * The feature owns its MOCK_LOCAL_ONLY adapter.
 */
import { CommunitiesShell } from "@client/features-v2/communities-v2";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./CommunitiesPage.module.css";

export function CommunitiesPage() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="spolecznosci"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <CommunitiesShell />
      </main>
    </div>
  );
}
