/**
 * features-v2/communities-v2 / feeds / CommunityPublishScopeSelector — choose
 * where a post is published: only here / direct children / selected / all.
 * Mirrors the legacy StructureScopeSelector (here/selected/all). Shown only for
 * staff allowed to publish down, and never for the relational feed (which is
 * always "current_community_only").
 */
import type { CommunityPublishScope, DescendantPublishTargetDTO } from "@shared/contracts/community-feeds";
import { DescendantCommunityPicker } from "./DescendantCommunityPicker";
import styles from "./Feeds.module.css";

const OPTIONS: { value: CommunityPublishScope; label: string }[] = [
  { value: "current_community_only", label: "Tylko ta społeczność" },
  { value: "direct_children", label: "Bezpośrednie podspołeczności" },
  { value: "selected_descendants", label: "Wybrane podspołeczności" },
  { value: "all_descendants", label: "Wszystkie podspołeczności" },
];

const SCOPE_HINTS: Record<CommunityPublishScope, string> = {
  current_community_only: "Post pojawi się tylko w tym feedzie.",
  direct_children: "Post trafi też do bezpośrednich podspołeczności.",
  selected_descendants: "Zaznacz podspołeczności poniżej.",
  all_descendants: "Post trafi do całej hierarchii poniżej.",
};

export function CommunityPublishScopeSelector({
  scope,
  onScope,
  descendants,
  selectedIds,
  onToggleTarget,
}: {
  scope: CommunityPublishScope;
  onScope: (scope: CommunityPublishScope) => void;
  descendants: readonly DescendantPublishTargetDTO[];
  selectedIds: readonly string[];
  onToggleTarget: (id: string) => void;
}) {
  return (
    <div className={styles.scopeBox}>
      <p className={styles.scopeLabel}>Zasięg publikacji</p>
      <div className={styles.scopeChips}>
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={scope === opt.value}
            className={`${styles.scopeChip} ${scope === opt.value ? styles.scopeChipActive : ""}`.trim()}
            onClick={() => onScope(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <p className={styles.scopeNote}>{SCOPE_HINTS[scope]}</p>
      {scope === "selected_descendants" ? (
        <DescendantCommunityPicker descendants={descendants} selectedIds={selectedIds} onToggle={onToggleTarget} />
      ) : null}
    </div>
  );
}
