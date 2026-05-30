/**
 * app-v2/channels/ChannelProfilePage — route shell for /channels/:slug.
 */
import { Navigate, useParams } from "react-router-dom";
import { ChannelProfileShell } from "@client/features-v2/channels";
import { AppShell } from "../navigation/AppShell";

export function ChannelProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/channels" replace />;
  return (
    <AppShell active="kanaly">
      <ChannelProfileShell slug={slug} />
    </AppShell>
  );
}
