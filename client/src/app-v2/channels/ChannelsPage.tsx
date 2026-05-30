/**
 * app-v2/channels/ChannelsPage — route shell for /channels.
 *
 * Mounts the shared AppShell (sidebar + mobile bottom-nav) around the
 * channels-v2 public feature entry. The feature owns its MOCK_LOCAL_ONLY
 * adapter.
 */
import { ChannelsShell } from "@client/features-v2/channels";
import { AppShell } from "../navigation/AppShell";

export function ChannelsPage() {
  return (
    <AppShell active="kanaly">
      <ChannelsShell />
    </AppShell>
  );
}
