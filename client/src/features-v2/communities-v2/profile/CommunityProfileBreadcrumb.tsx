/**
 * features-v2/communities-v2 / profile / CommunityProfileBreadcrumb
 *
 * Read-only breadcrumb (Społeczności › {name}). Slice 2 does not implement
 * sub-communities — when V2 grows a parent chain, render it here.
 */
import { Link } from "react-router-dom";
import styles from "../CommunityProfile.module.css";

type Props = { communityName: string };

export function CommunityProfileBreadcrumb({ communityName }: Props) {
  return (
    <nav className={styles.breadcrumb} aria-label="Ścieżka społeczności">
      <Link to="/communities">Społeczności</Link>
      <span>›</span>
      <span className={styles.crumbCurrent}>{communityName}</span>
    </nav>
  );
}
