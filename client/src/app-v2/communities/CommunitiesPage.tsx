/**
 * app-v2/communities/CommunitiesPage — route shell for /communities.
 *
 * Mounts the shared AppShell (sidebar + mobile bottom-nav) around the
 * communities-v2 public feature entry. The feature owns its MOCK_LOCAL_ONLY
 * adapter.
 */
import { CommunitiesShell } from "@client/features-v2/communities-v2";
import { AppShell } from "../navigation/AppShell";

export function CommunitiesPage() {
  return (
    <AppShell active="spolecznosci">
      <CommunitiesShell />
    </AppShell>
  );
}
