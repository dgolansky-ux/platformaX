/**
 * app-v2/navigation/FloatingNav — Slice 22A.
 *
 * Mobile bottom nav: 5 tabs (Centrum, Feed, [+] compose, Powiadomienia,
 * Profil). The central "+" is route-aware:
 *   - on /friends-feed     → opens the friend-feed composer
 *   - on /communities/:slug/feed → opens the community-feed composer
 *   - on /channels/:slug   → opens the channel composer
 *   - elsewhere            → disabled with an accessible explanation
 *
 * No placeholder "Wkrótce" modal, no fake save. The FAB dispatches a
 * `platformax:open-composer` CustomEvent that the active feed surface
 * subscribes to via `useComposerOpenEvent`.
 *
 * Scroll-hide and reduced-motion respected. Hidden on >=1024px.
 */
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useNotificationsUnreadCount } from "@client/features-v2/notifications-v2";
import { dispatchOpenComposer, type ComposerSurface } from "@client/features-v2/publishing";
import { useScrollHide } from "./useScrollHide";
import styles from "./floating-nav.module.css";

export type NavTab = "home" | "profil" | "feed" | "kontakty" | "chat" | "alerts" | "search" | "communities";

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
      aria-label={disabledReason ? `${label} — ${disabledReason}` : label}
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

function detectComposerSurface(pathname: string): ComposerSurface | null {
  if (pathname === "/friends-feed") return "friend_feed";
  if (/^\/communities\/[^/]+\/feed\/?$/.test(pathname)) return "community_feed";
  if (/^\/channels\/[^/]+\/?$/.test(pathname)) return "channel";
  return null;
}

const FAB_DISABLED_LABEL =
  "Aby opublikować, otwórz feed znajomych, feed społeczności lub kanał";

export function FloatingNav({ active }: FloatingNavProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const hidden = useScrollHide();
  const [mounted, setMounted] = useState(false);
  const reduced = prefersReducedMotion();
  const unread = useNotificationsUnreadCount("u-viewer");

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(t);
  }, []);

  const composerSurface = useMemo(
    () => detectComposerSurface(location.pathname),
    [location.pathname],
  );
  const fabDisabled = composerSurface === null;

  const translateY = !mounted ? "100%" : hidden ? "100%" : "0px";
  const opacity = !mounted ? 0 : 1;
  const transition = reduced ? "none" : "transform 220ms cubic-bezier(0.4,0,0.2,1), opacity 200ms ease";

  return (
    <>
      <div className={styles.spacer} aria-hidden="true" />

      <nav
        aria-label="Nawigacja mobilna"
        className={styles.nav}
        style={{ transform: `translateY(${translateY})`, opacity, transition }}
      >
        <div className={styles.inner}>
          <NavBtn icon="🏠" label="Centrum" active={active === "home"} onClick={() => navigate("/")} />
          <NavBtn icon="👥" label="Feed" active={active === "feed"} onClick={() => navigate("/friends-feed")} />

          <div className={styles.fabSlot}>
            <button
              type="button"
              className={styles.fab}
              aria-label={fabDisabled ? FAB_DISABLED_LABEL : "Opublikuj wpis"}
              title={fabDisabled ? FAB_DISABLED_LABEL : undefined}
              disabled={fabDisabled}
              onClick={() => {
                if (composerSurface === null) return;
                dispatchOpenComposer(composerSurface);
              }}
            >
              <span className={styles.fabIcon} aria-hidden="true">＋</span>
            </button>
          </div>

          <NavBtn
            icon="🔔"
            label="Alerty"
            active={active === "alerts"}
            badge={unread.total}
            onClick={() => navigate("/notifications")}
          />
          <NavBtn icon="👤" label="Profil" active={active === "profil"} onClick={() => navigate("/profile")} />
        </div>
      </nav>
    </>
  );
}
