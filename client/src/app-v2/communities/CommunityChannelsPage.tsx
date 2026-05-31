/**
 * app-v2/communities/CommunityChannelsPage — /communities/:slug/channels
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityChannelsView } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunityChannelsPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <AppShell active="spolecznosci">
      <CommunityChannelsView slug={slug} />
    </AppShell>
  );
}
