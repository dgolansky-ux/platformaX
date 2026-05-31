/**
 * app-v2/communities/CommunityStructurePage — /communities/:slug/structure
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityStructureShell } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunityStructurePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <AppShell active="spolecznosci">
      <CommunityStructureShell slug={slug} />
    </AppShell>
  );
}
