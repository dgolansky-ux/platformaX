/**
 * features-v2/communities-v2 / structure / CommunityStructureTree — nested tree
 * view. Mirrors the legacy org/circle tree (parent above, children indented)
 * without the heavy SVG layout engine: a clean clean-room nested layout that
 * keeps parent/child hierarchy obvious and works on mobile.
 */
import type { CommunityStructureNodeDTO } from "@shared/contracts/communities-structure";
import { SubcommunityCard, type SubcommunityCardProps } from "./SubcommunityCard";
import styles from "./Structure.module.css";

type Handlers = Omit<SubcommunityCardProps, "node" | "isRoot" | "selected">;

export type CommunityStructureTreeProps = Handlers & {
  tree: readonly CommunityStructureNodeDTO[];
  rootId: string;
  selectedId: string | null;
};

export function CommunityStructureTree(props: CommunityStructureTreeProps) {
  const { tree, rootId, selectedId, ...handlers } = props;
  const root = tree.find((n) => n.id === rootId);
  if (!root) return null;
  return (
    <div className={styles.tree}>
      <Branch node={root} tree={tree} rootId={rootId} selectedId={selectedId} handlers={handlers} />
    </div>
  );
}

function Branch({
  node,
  tree,
  rootId,
  selectedId,
  handlers,
}: {
  node: CommunityStructureNodeDTO;
  tree: readonly CommunityStructureNodeDTO[];
  rootId: string;
  selectedId: string | null;
  handlers: Handlers;
}) {
  const children = tree
    .filter((n) => n.parentId === node.id)
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1));
  return (
    <div>
      <SubcommunityCard
        node={node}
        isRoot={node.id === rootId}
        selected={selectedId === node.id}
        {...handlers}
      />
      {children.length > 0 ? (
        <div className={styles.treeChildren}>
          {children.map((child) => (
            <Branch
              key={child.id}
              node={child}
              tree={tree}
              rootId={rootId}
              selectedId={selectedId}
              handlers={handlers}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
