/**
 * features-v2/communities-v2 / structure / SubcommunityCard — one node in the
 * community tree (UI_SHELL_ONLY + MOCK_LOCAL_ONLY). Mirrors the legacy
 * NodeCard + ActionPanel: tap to reveal actions, gated by structure policy.
 * No no-op buttons — every action is wired to the structure mock-adapter via
 * the parent shell.
 */
import { Link } from "react-router-dom";
import type { CommunityStructureNodeDTO } from "@shared/contracts/communities-structure";
import styles from "./Structure.module.css";

export type SubcommunityCardProps = {
  node: CommunityStructureNodeDTO;
  isRoot: boolean;
  canManage: boolean;
  maxDepth: number;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onAddChild: (node: CommunityStructureNodeDTO) => void;
  onEdit: (node: CommunityStructureNodeDTO) => void;
  onMove: (node: CommunityStructureNodeDTO) => void;
  onDeactivate: (node: CommunityStructureNodeDTO) => void;
  onReactivate: (node: CommunityStructureNodeDTO) => void;
};

export function SubcommunityCard(props: SubcommunityCardProps) {
  const { node, isRoot, canManage, maxDepth, selected } = props;
  const deactivated = node.status === "deactivated";
  const cardClass = [
    styles.card,
    selected ? styles.cardSelected : "",
    deactivated ? styles.cardDeactivated : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cardClass} data-testid={`subcommunity-card-${node.slug}`}>
      <div
        className={styles.cardHead}
        role="button"
        tabIndex={0}
        aria-expanded={selected}
        onClick={() => props.onToggleSelect(node.id)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            props.onToggleSelect(node.id);
          }
        }}
      >
        <span className={styles.badge} aria-hidden="true">{node.name.charAt(0).toUpperCase()}</span>
        <div className={styles.cardMain}>
          <p className={styles.cardName}>
            {node.name}
            {isRoot ? <span className={`${styles.tag} ${styles.tagRoot}`}>Główna</span> : null}
            {node.visibility === "private" ? <span className={`${styles.tag} ${styles.tagPrivate}`}>Prywatna</span> : null}
            {deactivated ? <span className={`${styles.tag} ${styles.tagOff}`}>Wyłączona</span> : null}
          </p>
          <p className={styles.cardMeta}>
            <span>{node.memberCount} członków</span>
            <span>· {node.childCount} podspołeczności</span>
            <span>· {node.visibility === "public" ? "Publiczna" : "Prywatna"}</span>
          </p>
        </div>
      </div>

      {selected ? (
        <div className={styles.actions}>
          <Link className={styles.action} to={`/communities/${node.slug}`}>Otwórz</Link>
          {canManage && !deactivated && node.depth < maxDepth ? (
            <button type="button" className={`${styles.action} ${styles.actionPrimary}`} onClick={() => props.onAddChild(node)}>
              + Podspołeczność
            </button>
          ) : null}
          {canManage ? (
            <button type="button" className={styles.action} onClick={() => props.onEdit(node)}>Edytuj</button>
          ) : null}
          {canManage && !isRoot ? (
            <button type="button" className={styles.action} onClick={() => props.onMove(node)}>Przenieś</button>
          ) : null}
          {canManage && !isRoot && !deactivated ? (
            <button type="button" className={`${styles.action} ${styles.actionDanger}`} onClick={() => props.onDeactivate(node)}>
              Dezaktywuj
            </button>
          ) : null}
          {canManage && !isRoot && deactivated ? (
            <button type="button" className={`${styles.action} ${styles.actionSuccess}`} onClick={() => props.onReactivate(node)}>
              Reaktywuj
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
