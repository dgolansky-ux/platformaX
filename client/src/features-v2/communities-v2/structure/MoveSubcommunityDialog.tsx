/**
 * features-v2/communities-v2 / structure / MoveSubcommunityDialog — pick a new
 * parent for a subcommunity. The candidate list is pre-filtered by the shell to
 * exclude the node itself and its descendants (no cycles) and any node already
 * at max depth, mirroring the legacy MoveElementSheet target filter.
 */
import { useState } from "react";
import type { CommunityStructureNodeDTO } from "@shared/contracts/communities-structure";
import styles from "./Structure.module.css";

export function MoveSubcommunityDialog({
  node,
  candidates,
  onSubmit,
  onCancel,
}: {
  node: CommunityStructureNodeDTO;
  candidates: readonly CommunityStructureNodeDTO[];
  onSubmit: (newParentId: string) => void;
  onCancel: () => void;
}) {
  const [target, setTarget] = useState<string>(candidates[0]?.id ?? "");
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="move-title">
      <div className={styles.dialog}>
        <h2 id="move-title" className={styles.dialogTitle}>Przenieś „{node.name}”</h2>
        <p className={styles.dialogText}>Wybierz nową społeczność nadrzędną. Pomijamy tę społeczność i jej potomków.</p>
        {candidates.length === 0 ? (
          <p className={styles.notice}>Brak dostępnych miejsc docelowych w tym drzewie.</p>
        ) : (
          <div className={styles.field}>
            <label className={styles.label} htmlFor="move-target">Nowy rodzic</label>
            <select
              id="move-target"
              className={styles.select}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            >
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {"— ".repeat(c.depth)}{c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className={styles.dialogActions}>
          <button type="button" className={styles.ghostBtn} onClick={onCancel}>Anuluj</button>
          <button
            type="button"
            className={styles.primaryBtn}
            disabled={!target}
            onClick={() => target && onSubmit(target)}
          >
            Przenieś
          </button>
        </div>
      </div>
    </div>
  );
}
