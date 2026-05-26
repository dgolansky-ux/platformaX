import type { CSSProperties, ReactNode } from "react";
import styles from "../styles/profile-portal.module.css";

type PortalCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  bg: string;
  delayMs: number;
  /** Discovery badge — small grey "N odkryj!" by default. */
  discoverCount: number;
  /** Optional pink "N new" badge with a close X (overrides the discovery badge). */
  newCount?: number;
};

// Per-card accent colors mirror legacy ProfileTopRow (Społeczności = blue,
// Kanały = violet/featured cream, Feed znajomych = pink).
const ICONS: Record<string, ReactNode> = {
  communities: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  ),
  channels: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" /><path d="M7.8 16.2a7 7 0 010-8.4" /><circle cx="12" cy="12" r="2" /><path d="M16.2 7.8a7 7 0 010 8.4" /><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  ),
  "friends-feed": (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
};

const CARDS: ReadonlyArray<PortalCard> = [
  {
    id: "communities",
    title: "Społeczności",
    subtitle: "Twoje grupy i dyskusje",
    icon: "",
    accent: "#1E4FD8",
    bg: "#FFFFFF",
    delayMs: 0,
    discoverCount: 0,
  },
  {
    id: "channels",
    title: "Kanały",
    subtitle: "Subskrybuj kanały twórców",
    icon: "",
    accent: "#7C3AED",
    bg: "#FFFFFF",
    delayMs: 80,
    discoverCount: 0,
  },
  {
    id: "friends-feed",
    title: "Feed znajomych",
    subtitle: "Posty Twoich znajomych",
    icon: "",
    accent: "#E11D48",
    bg: "#FFFFFF",
    delayMs: 160,
    discoverCount: 0,
    newCount: 20,
  },
];

/**
 * Three portal cards in the fixed blueprint order. Target domains/routes don't
 * exist yet, so each card is a disabled-policy CTA (honest "wkrótce" title),
 * not a no-op and not a fake route. Visual parity with legacy ProfileTopRowCards:
 * a discovery badge ("N odkryj!" — grey) next to the title, optionally upgraded
 * to a pink "N new" pill with a dismiss X (Feed znajomych in the screenshot),
 * plus a soft-pulsing green "open" indicator on the right.
 */
export function ProfilePortalCards() {
  return (
    <div className={styles.portalCards}>
      {CARDS.map((card) => {
        const cssVars: CSSProperties & Record<string, string> = {
          "--ptlAccent": card.accent,
          "--ptlBg": card.bg,
          "--ptlDelay": `${card.delayMs}ms`,
        };
        return (
          <button
            key={card.id}
            type="button"
            className={styles.portalCard}
            disabled
            aria-disabled="true"
            title={`${card.title} — wkrótce`}
            style={cssVars}
          >
            <span className={styles.portalIcon} aria-hidden="true">
              {ICONS[card.id] ?? card.icon}
            </span>
            <span className={styles.portalBody}>
              <span className={styles.portalTitleRow}>
                <span className={styles.portalTitle}>{card.title}</span>
                {card.newCount && card.newCount > 0 ? (
                  <span
                    className={styles.portalBadgeNew}
                    aria-label={`${card.newCount} nowych postów`}
                  >
                    {card.newCount} new
                    <span className={styles.portalBadgeClose} aria-hidden="true">
                      ×
                    </span>
                  </span>
                ) : (
                  <span
                    className={styles.portalBadge}
                    aria-label={`${card.discoverCount} nowych do odkrycia`}
                  >
                    {card.discoverCount} odkryj!
                  </span>
                )}
              </span>
              <span className={styles.portalSubtitle}>{card.subtitle}</span>
            </span>
            <span className={styles.portalRight}>
              <span className={styles.portalOnlineDot} aria-hidden="true" />
              <span className={styles.portalOpenLabel}>open</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
