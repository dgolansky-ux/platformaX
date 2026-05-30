import { FriendsPage as FriendsPageFeature } from "@client/features-v2/social/friends";
import { AppShell } from "../navigation/AppShell";

export function FriendsPage() {
  return (
    <AppShell active="kontakty">
      <FriendsPageFeature />
    </AppShell>
  );
}
