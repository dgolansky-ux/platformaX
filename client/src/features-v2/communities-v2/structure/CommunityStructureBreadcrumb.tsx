/**
 * features-v2/communities-v2 / structure / CommunityStructureBreadcrumb —
 * root → current trail. Each ancestor links to its structure page; the current
 * node is plain text. No PII.
 */
import { Link } from "react-router-dom";
import type { CommunityStructureBreadcrumbDTO } from "@shared/contracts/communities-structure";
import styles from "./Structure.module.css";

export function CommunityStructureBreadcrumb({
  trail,
}: {
  trail: readonly CommunityStructureBreadcrumbDTO[];
}) {
  if (trail.length === 0) return null;
  return (
    <nav className={styles.breadcrumb} aria-label="Ścieżka struktury">
      {trail.map((crumb, idx) => {
        const isLast = idx === trail.length - 1;
        return (
          <span key={crumb.id} className={styles.crumb} style={{ display: "inline-flex", gap: 6 }}>
            {isLast ? (
              <span className={styles.crumbCurrent} aria-current="page">{crumb.name}</span>
            ) : (
              <Link className={styles.crumb} to={`/communities/${crumb.slug}/structure`}>{crumb.name}</Link>
            )}
            {!isLast ? <span className={styles.crumbSep} aria-hidden="true">/</span> : null}
          </span>
        );
      })}
    </nav>
  );
}
