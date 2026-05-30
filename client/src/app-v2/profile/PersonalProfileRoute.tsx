/**
 * app-v2/profile/PersonalProfileRoute — route shell for /profile/:username.
 *
 * Mounts the unified personal-profile feature with the current viewer id +
 * the :username path param. The legacy /profile route (owner edit
 * dashboard) is left intact and accessible from the hero's "Zarządzaj
 * profilem" CTA — both surfaces compose the same domain data.
 */
import { useNavigate, useParams } from "react-router-dom";
import { PersonalProfilePage } from "@client/features-v2/personal-profile";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import { FloatingNav } from "../navigation/FloatingNav";
import styles from "./PersonalProfileRoute.module.css";

const DEMO_VIEWER_ID = "u-viewer";

export function PersonalProfileRoute() {
  const params = useParams<{ username: string }>();
  const navigate = useNavigate();
  const usernameRaw = params.username ?? "";
  const username = usernameRaw.replace(/^@/, "");
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="profil"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
        viewerUserId={DEMO_VIEWER_ID}
      />
      <main className={styles.content}>
        <PersonalProfilePage
          viewerUserId={DEMO_VIEWER_ID}
          profileUsername={username}
          onNavigate={(route) => navigate(route)}
        />
      </main>
      <FloatingNav active="profil" />
    </div>
  );
}
