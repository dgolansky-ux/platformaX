/**
 * app-v2/navigation/AppShell — shared route chrome.
 *
 * Standardises sidebar offset, mobile bottom-nav and content column so every
 * authenticated / demo route in app-v2/ uses the same layout primitives. No
 * business logic — pure structural component. Pages compose:
 *   <AppShell active="…"><MyPage /></AppShell>.
 *
 * Provides a "Przejdź do treści" skip link and a single <main id="main-content">
 * landmark so keyboard / screen reader users do not have to traverse the
 * sidebar on every navigation.
 */
import type { ReactNode } from "react";
import { DesktopSidebar, type SidebarTab } from "./DesktopSidebar";
import { FloatingNav, type NavTab } from "./FloatingNav";
import styles from "./app-shell.module.css";

type AppShellProps = {
  active: SidebarTab;
  mobileActive?: NavTab;
  displayName?: string;
  handle?: string;
  avatarInitial?: string;
  viewerUserId?: string;
  children: ReactNode;
};

const SIDEBAR_TO_MOBILE: Partial<Record<SidebarTab, NavTab>> = {
  centrum: "home",
  profil: "profil",
  feed: "feed",
  powiadomienia: "alerts",
  kontakty: "kontakty",
  spolecznosci: "communities",
};

export function AppShell({
  active,
  mobileActive,
  displayName = "Demo użytkownik",
  handle = "demo",
  avatarInitial = "D",
  viewerUserId,
  children,
}: AppShellProps) {
  const mobile = mobileActive ?? SIDEBAR_TO_MOBILE[active] ?? "home";
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skipLink}>
        Przejdź do treści
      </a>
      <DesktopSidebar
        active={active}
        displayName={displayName}
        handle={handle}
        avatarInitial={avatarInitial}
        viewerUserId={viewerUserId}
      />
      <main id="main-content" className={styles.content} tabIndex={-1}>
        {children}
      </main>
      <FloatingNav active={mobile} />
    </div>
  );
}
