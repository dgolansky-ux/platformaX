/**
 * features-v2/communities-v2/cards / CreateCommunityCard — Slice 20B-FIX.
 *
 * Empty-state CTA tile that opens the wizard. Premium "+" disc with brand
 * gradient + soft dashed wrapper. Pure presentational; routing is owned by
 * the parent. Used in MyCommunitiesSection when the user has no membership.
 */
import { Link } from "react-router-dom";
import styles from "./Cards.module.css";

type CreateCommunityCardProps = {
  to?: string;
};

export function CreateCommunityCard({ to = "/communities/new" }: CreateCommunityCardProps) {
  return (
    <Link to={to} className={styles.createCard} aria-label="Utwórz nową społeczność">
      <span className={styles.createCardIcon} aria-hidden="true">＋</span>
      <div className={styles.createCardBody}>
        <p className={styles.createCardTitle}>Utwórz społeczność</p>
        <p className={styles.createCardHelp}>Zaproś znajomych i specjalistów do wspólnej przestrzeni.</p>
      </div>
    </Link>
  );
}
