import type { CSSProperties } from "react";
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
const CARDS: ReadonlyArray<PortalCard> = [
  {
    id: "communities",
    title: "Społeczności",
    subtitle: "Twoje grupy i dyskusje",
    icon: "🌐",
    accent: "#3B82F6",
    bg: "#FFFFFF",
    delayMs: 0,
    discoverCount: 0,
  },
  {
    id: "channels",
    title: "Kanały",
    subtitle: "Subskrybuj kanały twórców",
    icon: "📡",
    accent: "#8B5CF6",
    bg: "#FAFAFA",
    delayMs: 80,
    discoverCount: 0,
  },
  {
    id: "friends-feed",
    title: "Feed znajomych",
    subtitle: "Posty Twoich znajomych",
    icon: "👥",
    accent: "#EE1D52",
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
              {card.icon}
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
