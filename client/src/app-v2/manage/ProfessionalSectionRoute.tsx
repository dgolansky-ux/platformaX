/**
 * app-v2/manage/ProfessionalSectionRoute — route shell for
 * /manage/sekcja-zawodowa (Zarządzaj → Sekcja zawodowa).
 *
 * Mounts the shared AppShell around the professional-section feature shell.
 * The feature owns its MOCK_LOCAL_ONLY adapter.
 */
import { ProfessionalSection } from "@client/features-v2/identity/professional-section";
import { AppShell } from "../navigation/AppShell";

export function ProfessionalSectionRoute() {
  return (
    <AppShell active="zarzadzaj">
      <ProfessionalSection />
    </AppShell>
  );
}
