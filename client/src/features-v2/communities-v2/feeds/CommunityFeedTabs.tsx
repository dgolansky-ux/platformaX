/**
 * features-v2/communities-v2 / feeds / CommunityFeedTabs — Główny / Relacyjny /
 * Kadra switcher. A tab is shown only when the viewer may see that feed
 * (staff_only hidden from members; relational hidden when disabled).
 */
import type { CommunityFeedTabsStateDTO, CommunityFeedType } from "@shared/contracts/community-feeds";
import styles from "./Feeds.module.css";

const LABELS: Record<CommunityFeedType, string> = {
  community_all: "Główny",
  relational: "Relacyjny",
  staff_only: "Kadra",
};

export function CommunityFeedTabs({
  tabs,
  active,
  onSelect,
}: {
  tabs: CommunityFeedTabsStateDTO;
  active: CommunityFeedType;
  onSelect: (feedType: CommunityFeedType) => void;
}) {
  const visible: CommunityFeedType[] = [];
  if (tabs.communityAll.visible) visible.push("community_all");
  if (tabs.relational.visible) visible.push("relational");
  if (tabs.staffOnly.visible) visible.push("staff_only");

  return (
    <div className={styles.tabs} role="tablist" aria-label="Feedy społeczności">
      {visible.map((feedType) => {
        const isActive = active === feedType;
        const isStaff = feedType === "staff_only";
        return (
          <button
            key={feedType}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isStaff ? styles.tabStaff : ""} ${isActive ? styles.tabActive : ""}`.trim()}
            onClick={() => onSelect(feedType)}
          >
            {LABELS[feedType]}
            {isStaff ? <span className={styles.tabBadge}>tylko kadra</span> : null}
          </button>
        );
      })}
    </div>
  );
}
