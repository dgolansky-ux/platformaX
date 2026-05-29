import { useNavigate } from "react-router-dom";
import styles from "./desktop-sidebar.module.css";

export type SidebarTab =
  | "centrum"
  | "profil"
  | "kontakty"
  | "feed"
  | "wiadomosci"
  | "znajdz"
  | "spolecznosci"
  | "powiadomienia"
  | "zarzadzaj";

type DesktopSidebarProps = {
  active: SidebarTab;
  displayName: string;
  handle: string;
  avatarInitial: string;
  online?: boolean;
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

type NavItemProps = {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

function NavItem({ icon, label, active, disabled, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      className={`${styles.navItem} ${active ? styles.navItemActive : ""}`}
      aria-current={active ? "page" : undefined}
      aria-label={disabled ? `${label} — wkrótce` : label}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
    >
      <span className={styles.navItemIcon} aria-hidden="true">{icon}</span>
      <span className={styles.navItemLabel}>{label}</span>
    </button>
  );
}

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconFeed() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconChat() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconCommunity() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconContacts() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 11h-6" />
      <path d="M20 8v6" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

export function DesktopSidebar({
  active,
  displayName,
  handle,
  avatarInitial,
  online = true,
}: DesktopSidebarProps) {
  const navigate = useNavigate();

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
        <NavItem icon={<IconContacts />} label="Kontakty" active={active === "kontakty"} onClick={() => navigate("/contacts")} />
        <NavItem icon={<IconFeed />} label="Feed znajomych" active={active === "feed"} disabled />
        <NavItem icon={<IconChat />} label="Wiadomości" active={active === "wiadomosci"} disabled />
        <NavItem icon={<IconSearch />} label="Znajdź ludzi" active={active === "znajdz"} disabled />

        <div className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>SPOŁECZNOŚĆ</span>
        </div>
        <NavItem icon={<IconCommunity />} label="Społeczności" active={active === "spolecznosci"} disabled />
        <NavItem icon={<IconBell />} label="Powiadomienia" active={active === "powiadomienia"} disabled />

        <div className={styles.sectionDivider}>
          <span className={styles.sectionLabel}>USŁUGI</span>
        </div>
        <NavItem icon={<IconSettings />} label="Zarządzaj" active={active === "zarzadzaj"} disabled />
      </nav>
    </aside>
  );
}
