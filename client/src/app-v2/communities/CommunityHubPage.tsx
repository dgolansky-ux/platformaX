/**
 * app-v2/communities/CommunityHubPage — /communities/:slug/hub
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityPublicHubView } from "@client/features-v2/communities-v2";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./CommunitiesPage.module.css";

export function CommunityHubPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <div className={styles.page}>
      <DesktopSidebar active="spolecznosci" displayName="Demo użytkownik" handle="demo" avatarInitial="D" />
      <main className={styles.content}>
        <CommunityPublicHubView slug={slug} />
      </main>
    </div>
  );
}
