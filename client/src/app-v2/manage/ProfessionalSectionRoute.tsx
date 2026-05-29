/**
 * app-v2/manage/ProfessionalSectionRoute — route shell for
 * /manage/sekcja-zawodowa (Zarządzaj → Sekcja zawodowa).
 *
 * Composes the DesktopSidebar with the professional-section feature shell.
 * No data fetching here; the feature owns its MOCK_LOCAL_ONLY adapter.
 */
import { ProfessionalSection } from "@client/features-v2/identity/professional-section";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import styles from "./ManageLayout.module.css";

export function ProfessionalSectionRoute() {
  return (
    <div className={styles.page}>
      <DesktopSidebar
        active="zarzadzaj"
        displayName="Demo użytkownik"
        handle="demo"
        avatarInitial="D"
      />
      <main className={styles.content}>
        <ProfessionalSection />
      </main>
    </div>
  );
}
