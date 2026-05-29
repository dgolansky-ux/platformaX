/**
 * features-v2/communities-v2 / structure / CommunityStructureList — flat list
 * view (legacy "Lista"): every node ordered by depth then sortOrder, indented
 * by depth so hierarchy stays readable. Same cards + actions as the tree view.
 */
import type { CommunityStructureNodeDTO } from "@shared/contracts/communities-structure";
import { SubcommunityCard, type SubcommunityCardProps } from "./SubcommunityCard";
import styles from "./Structure.module.css";

type Handlers = Omit<SubcommunityCardProps, "node" | "isRoot" | "selected">;

export type CommunityStructureListProps = Handlers & {
  tree: readonly CommunityStructureNodeDTO[];
  rootId: string;
  selectedId: string | null;
};

export function CommunityStructureList(props: CommunityStructureListProps) {
  const { tree, rootId, selectedId, ...handlers } = props;
  const ordered = [...tree].sort(
    (a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1),
  );
  return (
    <div className={styles.list}>
      {ordered.map((node) => (
        <div key={node.id} style={{ paddingLeft: node.depth * 18 }}>
          <SubcommunityCard
            node={node}
            isRoot={node.id === rootId}
            selected={selectedId === node.id}
            {...handlers}
          />
        </div>
      ))}
    </div>
  );
}
