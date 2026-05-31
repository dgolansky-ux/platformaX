/**
 * app-v2/communities/CommunityProfilePage — /communities/:slug
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityProfileShell } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunityProfilePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <AppShell active="spolecznosci">
      <CommunityProfileShell slug={slug} />
    </AppShell>
  );
}
