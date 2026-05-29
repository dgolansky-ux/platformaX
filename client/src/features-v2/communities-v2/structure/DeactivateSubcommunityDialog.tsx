/**
 * features-v2/communities-v2 / structure / DeactivateSubcommunityDialog — soft
 * deactivation confirm. Replaces the legacy hard-delete dialog: deactivation is
 * reversible, keeps members and history, and is blocked by the adapter when the
 * node still has active children.
 */
import type { CommunityStructureNodeDTO } from "@shared/contracts/communities-structure";
import styles from "./Structure.module.css";

export function DeactivateSubcommunityDialog({
  node,
  onConfirm,
  onCancel,
}: {
  node: CommunityStructureNodeDTO;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const hasActiveChildren = node.childCount > 0;
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="deact-title">
      <div className={styles.dialog}>
        <h2 id="deact-title" className={styles.dialogTitle}>Dezaktywuj „{node.name}”</h2>
        <p className={styles.dialogText}>
          Dezaktywacja jest odwracalna — nie usuwa członków ani historii. Podspołeczność zniknie z aktywnej
          struktury, a później możesz ją reaktywować.
        </p>
        {hasActiveChildren ? (
          <p className={styles.notice}>
            Ta społeczność ma aktywne podspołeczności. Najpierw je dezaktywuj lub przenieś.
          </p>
        ) : null}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={onCancel}>Anuluj</button>
          <button
            type="button"
            className={styles.dangerBtn}
            disabled={hasActiveChildren}
            onClick={onConfirm}
          >
            Dezaktywuj
          </button>
        </div>
      </div>
    </div>
  );
}
