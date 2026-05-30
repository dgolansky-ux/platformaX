/**
 * app-v2/navigation/DesktopSidebar — Slice 20B-FIX (top-tier redesign).
 *
 * Premium left rail (280px). Layout: monogram + brandword, compact user
 * card (clickable → /profile), primary navigation, secondary "Twoje konto"
 * group with "Zarządzaj", and a minimal "Aktywni teraz" strip pinned to the
 * bottom. "Wiadomości" / "Znajdź ludzi" stay disabled with a "Wkrótce"
 * pill — never fake-active.
 *
 * Active-now strip uses MOCK_LOCAL_ONLY data; presence is presentational
 * only and never sent to any adapter.
 */
import { useNavigate } from "react-router-dom";
import { useNotificationsUnreadCount } from "@client/features-v2/notifications-v2";
import {
  IconBell,
  IconChannel,
  IconChat,
  IconCommunity,
  IconContacts,
  IconFeed,
  IconHome,
  IconSearch,
  IconSettings,
  IconUser,
} from "./desktop-sidebar-icons";
import styles from "./desktop-sidebar.module.css";

export type SidebarTab =
  | "centrum"
  | "profil"
  | "kontakty"
  | "feed"
  | "wiadomosci"
  | "znajdz"
  | "spolecznosci"
  | "kanaly"
  | "powiadomienia"
  | "zarzadzaj";

type DesktopSidebarProps = {
  active: SidebarTab;
  displayName: string;
  handle: string;
  avatarInitial: string;
  online?: boolean;
  viewerUserId?: string;
};

const ACTIVE_NOW_MOCK: readonly { id: string; initial: string; color: string }[] = [
  { id: "a1", initial: "M", color: "linear-gradient(135deg,#4f5fe7,#7c4ce0)" },
  { id: "a2", initial: "O", color: "linear-gradient(135deg,#0ea5e9,#6366f1)" },
  { id: "a3", initial: "P", color: "linear-gradient(135deg,#10b981,#0ea5e9)" },
  { id: "a4", initial: "K", color: "linear-gradient(135deg,#f59e0b,#ef4444)" },
];
const ACTIVE_EXTRA_COUNT = 7;
const DEFAULT_VIEWER_ID = "u-viewer";

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  badge?: number;
  onClick?: () => void;
};

function NavItem({ icon, label, active, disabled, badge, onClick }: NavItemProps) {
  const showBadge = typeof badge === "number" && badge > 0;
  return (
    <button
      type="button"
      className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={disabled ? `${label} — funkcja w przygotowaniu` : showBadge ? `${label} (${badge} nowych)` : label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      <span className={styles.navItemIcon} aria-hidden="true">{icon}</span>
      <span className={styles.navItemLabel}>{label}</span>
      {showBadge ? (
        <span className={styles.navItemBadge} data-testid="notifications-unread-badge">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );
}

export function DesktopSidebar({
  active,
  displayName,
  handle,
  avatarInitial,
  online = true,
  viewerUserId,
}: DesktopSidebarProps) {
  const navigate = useNavigate();
  const unread = useNotificationsUnreadCount(viewerUserId ?? DEFAULT_VIEWER_ID);

  return (
    <aside className={styles.sidebar} aria-label="Menu boczne">
      <button
        type="button"
        className={styles.brandRow}
        onClick={() => navigate("/")}
        aria-label="PlatformaX — przejdź do centrum"
        style={{ background: "transparent", border: 0, cursor: "pointer" }}
      >
        <span className={styles.brandMark} aria-hidden="true">X</span>
        <span className={styles.brandWord}>PlatformaX</span>
      </button>

      <button
        type="button"
        className={styles.userCard}
        onClick={() => navigate("/profile")}
        aria-label={`Otwórz profil ${displayName}`}
      >
        <span className={styles.userAvatar}>{avatarInitial}</span>
        <span className={styles.userName}>{displayName}</span>
        <span className={styles.userHandle}>
          {online ? <span className={styles.onlineDot} aria-hidden="true" /> : null}
          @{handle}
        </span>
        <span className={styles.userChevron} aria-hidden="true">›</span>
      </button>

      <nav className={styles.navGroup} aria-label="Nawigacja główna">
        <NavItem icon={<IconHome />} label="Centrum" active={active === "centrum"} onClick={() => navigate("/")} />
        <NavItem icon={<IconUser />} label="Mój profil" active={active === "profil"} onClick={() => navigate("/profile")} />
        <NavItem icon={<IconFeed />} label="Feed znajomych" active={active === "feed"} onClick={() => navigate("/friends-feed")} />
        <NavItem icon={<IconCommunity />} label="Społeczności" active={active === "spolecznosci"} onClick={() => navigate("/communities")} />
        <NavItem icon={<IconChannel />} label="Kanały" active={active === "kanaly"} onClick={() => navigate("/channels")} />
        <NavItem
          icon={<IconBell />}
          label="Powiadomienia"
          active={active === "powiadomienia"}
          badge={unread.total}
          onClick={() => navigate("/notifications")}
        />
        <NavItem icon={<IconContacts />} label="Kontakty" active={active === "kontakty"} onClick={() => navigate("/contacts")} />
      </nav>

      <div className={styles.sectionLabel}>W przygotowaniu</div>
      <nav className={styles.navGroup} aria-label="Funkcje w przygotowaniu">
        <NavItem icon={<IconSearch />} label="Znajdź ludzi" active={false} disabled />
        <NavItem icon={<IconChat />} label="Wiadomości" active={false} disabled />
      </nav>

      <div className={styles.sectionLabel}>Twoje konto</div>
      <nav className={styles.navGroup} aria-label="Ustawienia konta">
        <NavItem
          icon={<IconSettings />}
          label="Zarządzaj"
          active={active === "zarzadzaj"}
          onClick={() => navigate("/manage")}
        />
      </nav>

      <div className={styles.activeStrip}>
        <div className={styles.activeStripHeader}>
          <span className={styles.activeStripLabel}>Aktywni teraz</span>
          <span className={styles.activeStripCount}>{ACTIVE_NOW_MOCK.length + ACTIVE_EXTRA_COUNT}</span>
        </div>
        <div className={styles.activeStripRow}>
          {ACTIVE_NOW_MOCK.map((a) => (
            <span key={a.id} className={styles.activeAvatar} style={{ background: a.color }}>
              {a.initial}
            </span>
          ))}
          <span className={styles.activeExtra}>+{ACTIVE_EXTRA_COUNT}</span>
        </div>
      </div>
    </aside>
  );
}
