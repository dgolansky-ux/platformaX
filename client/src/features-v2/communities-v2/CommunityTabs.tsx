import styles from "./CommunitiesShell.module.css";

export type CommunitiesTabKey = "mine" | "discover";

type CommunityTabsProps = {
  activeTab: CommunitiesTabKey;
  mineCount: number;
  discoverCount: number;
  onSelect: (tab: CommunitiesTabKey) => void;
};

export function CommunityTabs({
  activeTab,
  mineCount,
  discoverCount,
  onSelect,
}: CommunityTabsProps) {
  return (
    <div className={styles.tabs} role="tablist" aria-label="Sekcje społeczności">
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "mine"}
        className={`${styles.tab} ${activeTab === "mine" ? styles.tabActive : ""}`}
        onClick={() => onSelect("mine")}
      >
        Moje społeczności <span className={styles.tabBadge}>{mineCount}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === "discover"}
        className={`${styles.tab} ${activeTab === "discover" ? styles.tabActive : ""}`}
        onClick={() => onSelect("discover")}
      >
        Odkrywaj <span className={styles.tabBadge}>{discoverCount}</span>
      </button>
    </div>
  );
}
