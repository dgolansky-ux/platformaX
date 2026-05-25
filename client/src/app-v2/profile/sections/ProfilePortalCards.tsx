import styles from "../profile.module.css";

type PortalCard = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  badge: string | null;
};

const CARDS: ReadonlyArray<PortalCard> = [
  {
    id: "communities",
    title: "Społeczności",
    subtitle: "Twoje grupy i dyskusje",
    icon: "👥",
    iconBg: "#1e3a5f",
    badge: null,
  },
  {
    id: "channels",
    title: "Kanały",
    subtitle: "Subskrybuj kanały twórców",
    icon: "📡",
    iconBg: "#5b21b6",
    badge: null,
  },
  {
    id: "friends-feed",
    title: "Feed znajomych",
    subtitle: "Posty Twoich znajomych",
    icon: "📰",
    iconBg: "#3d0020",
    badge: null,
  },
];

/**
 * Three portal cards in the fixed blueprint order. The target domains/routes do
 * not exist yet, so each card is a disabled-policy CTA (honest "wkrótce"), not a
 * no-op and not a fake route.
 */
export function ProfilePortalCards() {
  return (
    <div className={styles.portalCards}>
      {CARDS.map((card) => (
        <button
          key={card.id}
          type="button"
          className={styles.portalCard}
          disabled
          aria-disabled="true"
          title={`${card.title} — wkrótce`}
        >
          <span
            className={styles.portalIcon}
            style={{ background: card.iconBg }}
            aria-hidden="true"
          >
            {card.icon}
          </span>
          <span className={styles.portalBody}>
            <span className={styles.portalTitle}>{card.title}</span>
            <br />
            <span className={styles.portalSubtitle}>{card.subtitle}</span>
          </span>
          <span className={styles.portalBadge}>wkrótce</span>
        </button>
      ))}
    </div>
  );
}
