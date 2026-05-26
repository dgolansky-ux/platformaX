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
  /** Small "0 odkryj!" badge — count is 0 until the underlying domain is wired. */
  discoverCount: number;
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
  },
];

/**
 * Three portal cards in the fixed blueprint order. Target domains/routes don't
 * exist yet, so each card is a disabled-policy CTA (honest "wkrótce" title),
 * not a no-op and not a fake route. Visual parity with legacy ProfileTopRowCards:
 * "0 odkryj!" discovery badge next to the title and a soft-pulsing green "open"
 * indicator on the right — the dot stays vivid even while the card is disabled,
 * because the legacy design uses it to signal that the surface is live for
 * exploration once enabled.
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
                <span
                  className={styles.portalBadge}
                  aria-label={`${card.discoverCount} nowych do odkrycia`}
                >
                  {card.discoverCount} odkryj!
                </span>
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
