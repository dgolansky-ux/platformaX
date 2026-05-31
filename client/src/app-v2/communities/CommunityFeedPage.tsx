/**
 * app-v2/communities/CommunityFeedPage — /communities/:slug/feed
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityFeedsShell } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunityFeedPage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <AppShell active="spolecznosci">
      <CommunityFeedsShell slug={slug} />
    </AppShell>
  );
}
