/**
 * app-v2/communities/CommunityChannelsPage — /communities/:slug/channels
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityChannelsView } from "@client/features-v2/communities-v2";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./CommunitiesPage.module.css";

export function CommunityChannelsPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <div className={styles.page}>
      <DesktopSidebar active="spolecznosci" displayName="Demo użytkownik" handle="demo" avatarInitial="D" />
      <main className={styles.content}>
        <CommunityChannelsView slug={slug} />
      </main>
    </div>
  );
}
