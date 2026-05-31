/**
 * features-v2/communities-v2 / structure / CommunityStructureChrome — the
 * header (hero) and toolbar (Drzewo/Lista toggle + create CTA) for the
 * structure screen. Presentational; extracted from the shell to keep each
 * component small.
 */
import { Link } from "react-router-dom";
import type { CommunityStructureViewDTO } from "@shared/contracts/communities-structure";
import styles from "./Structure.module.css";

export type ViewMode = "tree" | "list";

export function StructureHero({ view, slug }: { view: CommunityStructureViewDTO; slug: string }) {
  return (
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>Struktura społeczności</p>
        <h1 id="structure-heading" className={styles.title}>{view.current.name}</h1>
        <p className={styles.subtitle}>/{view.current.slug} · poziom {view.depth + 1} z {view.maxDepth + 1}</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        <Link to={`/communities/${slug}`} className={styles.backButton}>← Wróć do profilu</Link>
        <span className={styles.heroCount}>{view.tree.length} węzłów</span>
      </div>
    </header>
  );
}

export function StructureToolbar({
  view,
  viewMode,
  hasSubcommunities,
  onViewMode,
  onCreate,
}: {
  view: CommunityStructureViewDTO;
  viewMode: ViewMode;
  hasSubcommunities: boolean;
  onViewMode: (mode: ViewMode) => void;
  onCreate: () => void;
}) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbarInfo}>
        <h2 className={styles.toolbarTitle}>Drzewo społeczności</h2>
        <p className={styles.toolbarHint}>
          {hasSubcommunities ? "Tapnij w element, żeby zobaczyć akcje." : "Brak podspołeczności — zacznij od utworzenia pierwszej."}
        </p>
      </div>
      <div className={styles.toolbarActions}>
        <div className={styles.viewToggle} role="tablist" aria-label="Widok struktury">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "tree"}
            className={`${styles.viewBtn} ${viewMode === "tree" ? styles.viewBtnActive : ""}`.trim()}
            onClick={() => onViewMode("tree")}
          >
            Drzewo
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            className={`${styles.viewBtn} ${viewMode === "list" ? styles.viewBtnActive : ""}`.trim()}
            onClick={() => onViewMode("list")}
          >
            Lista
          </button>
        </div>
        {view.canCreateChild ? (
          <button type="button" className={styles.primaryBtn} onClick={onCreate}>+ Utwórz podspołeczność</button>
        ) : null}
      </div>
    </div>
  );
}
