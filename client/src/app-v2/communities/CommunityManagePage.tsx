/**
 * app-v2/communities/CommunityManagePage — /communities/:slug/manage
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityManageShell } from "@client/features-v2/communities-v2";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./CommunitiesPage.module.css";

export function CommunityManagePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <div className={styles.page}>
      <DesktopSidebar active="spolecznosci" displayName="Demo użytkownik" handle="demo" avatarInitial="D" />
      <main className={styles.content}>
        <CommunityManageShell slug={slug} />
      </main>
    </div>
  );
}
