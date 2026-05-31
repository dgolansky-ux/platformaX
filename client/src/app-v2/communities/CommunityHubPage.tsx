/**
 * app-v2/communities/CommunityHubPage — /communities/:slug/hub
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityPublicHubView } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunityHubPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <AppShell active="spolecznosci">
      <CommunityPublicHubView slug={slug} />
    </AppShell>
  );
}
