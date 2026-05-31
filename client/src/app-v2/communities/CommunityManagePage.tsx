/**
 * app-v2/communities/CommunityManagePage — /communities/:slug/manage
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityManageShell } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunityManagePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <AppShell active="spolecznosci">
      <CommunityManageShell slug={slug} />
    </AppShell>
  );
}
