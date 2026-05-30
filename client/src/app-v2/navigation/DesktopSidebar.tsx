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

const ACTIVE_NOW_MOCK = [
  { id: "a1", initial: "M", color: "#1e4fd8" },
  { id: "a2", initial: "O", color: "#2563eb" },
  { id: "a3", initial: "P", color: "#3b82f6" },
  { id: "a4", initial: "K", color: "#475569" },
  { id: "a5", initial: "T", color: "#1e3a5f" },
  { id: "a6", initial: "E", color: "#334155" },
];
const ACTIVE_EXTRA_COUNT = 5;
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
      aria-label={disabled ? `${label} — wkrótce` : showBadge ? `${label} (${badge} nowych)` : label}
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
      <div className={styles.logo}>PlatformaX</div>

      <div className={styles.userCard}>
        <div className={styles.userAvatar}>{avatarInitial}</div>
        <div className={styles.userName}>{displayName}</div>
        <div className={styles.userHandle}>
          {online ? <span className={styles.onlineDot} aria-label="Online" /> : null}
          @{handle}
        </div>
      </div>

      <div className={styles.activeNow}>
        <div className={styles.activeNowHeader}>
          <span className={styles.sectionLabel}>AKTYWNI TERAZ</span>
          <button type="button" className={styles.activeNowAction} disabled aria-label="Ustaw aktywnych — wkrótce">
            Ustaw
          </button>
        </div>
        <div className={styles.activeNowAvatars}>
          {ACTIVE_NOW_MOCK.map((a) => (
            <span key={a.id} className={styles.activeAvatar} style={{ background: a.color }}>
              {a.initial}
            </span>
          ))}
          <span className={styles.activeExtra}>+{ACTIVE_EXTRA_COUNT}</span>
        </div>
      </div>

      <nav className={styles.nav}>
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
        <NavItem icon={<IconSearch />} label="Znajdź ludzi" active={active === "znajdz"} disabled />
        <NavItem icon={<IconChat />} label="Wiadomości" active={active === "wiadomosci"} disabled />

        <div className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>TWOJE KONTO</span>
        </div>
        <NavItem
          icon={<IconSettings />}
          label="Zarządzaj"
          active={active === "zarzadzaj"}
          onClick={() => navigate("/manage")}
        />
      </nav>
    </aside>
  );
}
