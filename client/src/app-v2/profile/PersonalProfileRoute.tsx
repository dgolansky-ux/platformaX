/**
 * app-v2/profile/PersonalProfileRoute — route shell for /profile/:username.
 *
 * Mounts the unified personal-profile feature with the current viewer id +
 * the :username path param inside the shared AppShell. The legacy /profile
 * route (owner edit dashboard) is left intact and accessible from the hero's
 * "Zarządzaj profilem" CTA — both surfaces compose the same domain data.
 */
import { useNavigate, useParams } from "react-router-dom";
import { PersonalProfilePage } from "@client/features-v2/personal-profile";
import { AppShell } from "../navigation/AppShell";

const DEMO_VIEWER_ID = "u-viewer";

export function PersonalProfileRoute() {
  const params = useParams<{ username: string }>();
  const navigate = useNavigate();
  const usernameRaw = params.username ?? "";
  const username = usernameRaw.replace(/^@/, "");
  return (
    <AppShell active="profil" viewerUserId={DEMO_VIEWER_ID}>
      <PersonalProfilePage
        viewerUserId={DEMO_VIEWER_ID}
        profileUsername={username}
        onNavigate={(route) => navigate(route)}
      />
    </AppShell>
  );
}
