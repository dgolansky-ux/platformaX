import { FriendRequestsPage as FriendRequestsPageFeature } from "@client/features-v2/social/friends";
import { AppShell } from "../navigation/AppShell";

export function FriendRequestsPage() {
  return (
    <AppShell active="kontakty">
      <FriendRequestsPageFeature />
    </AppShell>
  );
}
