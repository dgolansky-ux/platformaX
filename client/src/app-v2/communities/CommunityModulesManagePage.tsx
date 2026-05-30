/**
 * app-v2/communities/CommunityModulesManagePage — /communities/:slug/manage/modules
 */
import { Navigate, useParams } from "react-router-dom";
import { CommunityModulesManage } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunityModulesManagePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <Navigate to="/communities" replace />;
  return (
    <AppShell active="spolecznosci">
      <CommunityModulesManage slug={slug} />
    </AppShell>
  );
}
