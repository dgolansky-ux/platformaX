/**
 * features-v2/manage — ManageStatusBadge.
 * Visual mapping of section status to a small badge.
 */
import type { ManageSectionStatus } from "./types";
import styles from "./Manage.module.css";

const LABEL: Record<ManageSectionStatus, string> = {
  ready: "Gotowe",
  partial: "Częściowe",
  needs_setup: "Do uzupełnienia",
  blocked: "Wymaga decyzji",
};

const CLASS: Record<ManageSectionStatus, string> = {
  ready: styles.statusReady,
  partial: styles.statusPartial,
  needs_setup: styles.statusNeedsSetup,
  blocked: styles.statusBlocked,
};

export function ManageStatusBadge({ status }: { status: ManageSectionStatus }) {
  return (
    <span className={`${styles.statusBadge} ${CLASS[status]}`} aria-label={`Status sekcji: ${LABEL[status]}`}>
      {LABEL[status]}
    </span>
  );
}
