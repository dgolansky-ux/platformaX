/**
 * features-v2/communities-v2 / feeds / DescendantCommunityPicker — checkbox list
 * of descendant communities for "selected" publish scope. Indented by depth.
 * Only descendants the viewer is allowed to publish into are passed in.
 */
import type { DescendantPublishTargetDTO } from "@shared/contracts/community-feeds";
import styles from "./Feeds.module.css";

export function DescendantCommunityPicker({
  descendants,
  selectedIds,
  onToggle,
}: {
  descendants: readonly DescendantPublishTargetDTO[];
  selectedIds: readonly string[];
  onToggle: (id: string) => void;
}) {
  if (descendants.length === 0) {
    return <p className={styles.scopeNote}>Brak podspołeczności do wyboru.</p>;
  }
  const selected = new Set(selectedIds);
  return (
    <>
      <div className={styles.picker} role="group" aria-label="Wybierz podspołeczności">
        {descendants.map((d) => (
          <label key={d.id} className={styles.pickerRow} style={{ paddingLeft: 8 + d.depth * 16 }}>
            <input type="checkbox" checked={selected.has(d.id)} onChange={() => onToggle(d.id)} />
            <span>{d.name}</span>
          </label>
        ))}
      </div>
      {selected.size > 0 ? <p className={styles.pickerCount}>Zaznaczono: {selected.size}</p> : null}
    </>
  );
}
