import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationsUnreadCount } from "@client/features-v2/notifications-v2";
import { useScrollHide } from "./useScrollHide";
import styles from "./floating-nav.module.css";

export type NavTab = "home" | "profil" | "feed" | "kontakty" | "chat" | "alerts" | "search";

type FloatingNavProps = {
  active: NavTab;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type NavBtnProps = {
  icon: string;
  label: string;
  active: boolean;
  badge?: number;
  disabledReason?: string;
  onClick?: () => void;
};

function NavBtn({ icon, label, active, badge = 0, disabledReason, onClick }: NavBtnProps) {
  return (
    <button
      type="button"
      className={styles.navBtn}
      aria-label={disabledReason ? `${label} — wkrótce` : label}
      aria-current={active ? "page" : undefined}
      title={disabledReason}
      disabled={Boolean(disabledReason)}
      onClick={onClick}
    >
      <span className={`${styles.navIconWrap} ${active ? styles.navIconWrapActive : ""}`}>
        <span className={`${styles.navIcon} ${active ? styles.navIconActive : ""}`} aria-hidden="true">
          {icon}
        </span>
        {badge > 0 ? <span className={styles.badge}>{badge > 99 ? "99+" : badge}</span> : null}
      </span>
      <span className={`${styles.navLabel} ${active ? styles.navLabelActive : ""}`}>{label}</span>
    </button>
  );
}

/**
 * Floating navigation — app-shell UI, visual parity with legacy BottomNav.
 * Routes that exist in V2 (Home "/", Profil "/profile") navigate; surfaces that
 * are not built yet are disabled-policy CTAs or a local "Wkrótce" modal — never
 * no-ops, never fake routes. No legacy runtime, no legacy data client.
 */
export function FloatingNav({ active }: FloatingNavProps) {
  const navigate = useNavigate();
  const hidden = useScrollHide();
  const [mounted, setMounted] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const reduced = prefersReducedMotion();
  const unread = useNotificationsUnreadCount("u-viewer");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 200);
    return () => clearTimeout(t);
  }, []);

  const translateY = !mounted ? "100px" : hidden ? "120px" : "0px";
  const opacity = !mounted || hidden ? 0 : 1;
  const transition = reduced || !mounted
    ? "none"
    : hidden
      ? "transform 200ms ease, opacity 200ms ease"
      : "transform 200ms cubic-bezier(0.34,1.56,0.64,1), opacity 200ms ease";

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />

      <nav
        aria-label="Nawigacja główna"
        className={styles.nav}
        style={{ transform: `translateY(${translateY})`, opacity, transition }}
      >
        <div className={styles.inner}>
          <NavBtn icon="🔍" label="Szukaj" active={active === "search"} onClick={() => setSearchOpen(true)} />
          <NavBtn
            icon="🔔"
            label="Alerty"
            active={active === "alerts"}
            badge={unread.total}
            onClick={() => navigate("/notifications")}
          />

          <div className={styles.island}>
            <button
              type="button"
              className={`${styles.islandBtn} ${active === "home" ? styles.islandBtnActive : ""}`}
              aria-label="Centrum"
              aria-current={active === "home" ? "page" : undefined}
              onClick={() => navigate("/")}
            >
              <span className={`${styles.islandIcon} ${active === "home" ? styles.islandIconActive : ""}`} aria-hidden="true">🏠</span>
              <span className={`${styles.islandLabel} ${active === "home" ? styles.islandLabelActive : ""}`}>Centrum</span>
            </button>
            <span className={styles.islandSep} aria-hidden="true" />
            <button
              type="button"
              className={`${styles.islandBtn} ${active === "profil" ? styles.islandBtnActive : ""}`}
              aria-label="Profil"
              aria-current={active === "profil" ? "page" : undefined}
              onClick={() => navigate("/profile")}
            >
              <span className={`${styles.islandIcon} ${active === "profil" ? styles.islandIconActive : ""}`} aria-hidden="true">👤</span>
              <span className={`${styles.islandLabel} ${active === "profil" ? styles.islandLabelActive : ""}`}>Profil</span>
            </button>
          </div>

          <NavBtn icon="👥" label="Feed" active={active === "feed"} onClick={() => navigate("/friends-feed")} />
          <NavBtn icon="💬" label="Chat" active={active === "chat"} disabledReason="Chat będzie dostępny wkrótce" />
          <NavBtn icon="👥" label="Kontakty" active={active === "kontakty"} disabledReason="Kontakty będą dostępne wkrótce" />
        </div>
      </nav>

      {searchOpen ? (
        <div className={styles.modalOverlay} onClick={() => setSearchOpen(false)} role="presentation">
          <div
            className={styles.modalCard}
            role="dialog"
            aria-label="Szukaj — wkrótce"
            onClick={(e) => e.stopPropagation()}
          >
            <p className={styles.modalTitle}>Wkrótce</p>
            <p className={styles.modalText}>Wyszukiwarka osób i treści jest w przygotowaniu.</p>
            <button type="button" className={styles.modalButton} onClick={() => setSearchOpen(false)}>
              OK
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
