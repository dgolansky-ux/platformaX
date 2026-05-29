/**
 * app-v2/channels/ChannelProfilePage — route shell for /channels/:slug.
 */
import { Navigate, useParams } from "react-router-dom";
import { ChannelProfileShell } from "@client/features-v2/channels";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./ChannelsPage.module.css";

export function ChannelProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/channels" replace />;
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="kanaly"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <ChannelProfileShell slug={slug} />
      </main>
    </div>
  );
}
