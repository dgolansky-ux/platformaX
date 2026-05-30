import { ContactRequestsPage as ContactRequestsPageFeature } from "@client/features-v2/social/friends";
import { AppShell } from "../navigation/AppShell";

export function ContactRequestsPage() {
  return (
    <AppShell active="kontakty">
      <ContactRequestsPageFeature />
    </AppShell>
  );
}
