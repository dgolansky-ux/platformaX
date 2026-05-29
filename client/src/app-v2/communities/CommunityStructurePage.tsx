/**
 * app-v2/communities/CommunityStructurePage — /communities/:slug/structure
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityStructureShell } from "@client/features-v2/communities-v2";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./CommunitiesPage.module.css";

export function CommunityStructurePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <div className={styles.page}>
      <DesktopSidebar active="spolecznosci" displayName="Demo użytkownik" handle="demo" avatarInitial="D" />
      <main className={styles.content}>
        <CommunityStructureShell slug={slug} />
      </main>
    </div>
  );
}
