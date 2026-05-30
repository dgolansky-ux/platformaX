/**
 * features-v2/communities-v2 / CommunitiesShell — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Clean-room re-implementation of the legacy Communities screen — Slice 20B-FIX
 * top-tier redesign. Premium hero (no dev copy), persistent search bar,
 * scannable "Moje społeczności" grid, horizontal "Polecane" carousel and a
 * proper category grid for discovery.
 *
 * All data through MOCK_LOCAL_ONLY adapter; no `@server/*` imports.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  CommunitiesShellData,
  CommunityCardDTO,
  CommunityCategoryDTO,
} from "@shared/contracts/communities";
import { CommunityCard } from "./CommunityCard";
import { communitiesMockAdapter } from "./mock-adapter";
import { CategoriesSection } from "./sections/CategoriesSection";
import {
  CommunitiesSearch,
  type CommunitiesSearchFilters,
} from "./sections/CommunitiesSearch";
import { MyCommunitiesSection } from "./sections/MyCommunitiesSection";
import { RecommendedSection } from "./sections/RecommendedSection";
import styles from "./CommunitiesShell.module.css";
import sections from "./sections/Sections.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CommunitiesShellData };

const EMPTY_FILTERS: CommunitiesSearchFilters = { query: "", locationMode: null, categorySlug: null };

export function CommunitiesShell() {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [filters, setFilters] = useState<CommunitiesSearchFilters>(EMPTY_FILTERS);

  useEffect(() => {
    let alive = true;
    communitiesMockAdapter
      .listCommunitiesShell()
      .then((data) => {
        if (alive) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Nieznany błąd";
        if (alive) setState({ status: "error", message });
      });
    return () => {
      alive = false;
    };
  }, []);

  const handleSelectCategory = useCallback((slug: string) => {
    setFilters((prev) => ({ ...prev, categorySlug: prev.categorySlug === slug ? null : slug }));
  }, []);

  const handleFiltersChange = useCallback((next: CommunitiesSearchFilters) => {
    setFilters(next);
  }, []);

  const isSearchMode = useMemo(
    () => filters.query.length > 0 || filters.locationMode !== null || filters.categorySlug !== null,
    [filters],
  );

  return (
    <section className={styles.root} aria-labelledby="communities-heading">
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <p className={styles.brand}>Odkrywaj</p>
          <h1 id="communities-heading" className={styles.title}>Społeczności</h1>
          <p className={styles.subtitle}>
            Dołącz do społeczności, w których ludzie rozwijają to, co Cię interesuje — albo zbuduj własną.
          </p>
        </div>
        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => navigate("/communities/new")}
          >
            <span className={styles.primaryButtonPlus} aria-hidden="true">＋</span>
            Utwórz społeczność
          </button>
        </div>
      </header>

      {state.status === "loading" ? (
        <div className={styles.loadingState} aria-busy="true">Ładowanie społeczności…</div>
      ) : null}
      {state.status === "error" ? (
        <div className={styles.errorState} role="alert">
          Nie udało się załadować społeczności: {state.message}
        </div>
      ) : null}

      {state.status === "ready" ? (
        <ShellBody
          data={state.data}
          filters={filters}
          isSearchMode={isSearchMode}
          onFiltersChange={handleFiltersChange}
          onSelectCategory={handleSelectCategory}
        />
      ) : null}
    </section>
  );
}

type ShellBodyProps = {
  data: CommunitiesShellData;
  filters: CommunitiesSearchFilters;
  isSearchMode: boolean;
  onFiltersChange: (filters: CommunitiesSearchFilters) => void;
  onSelectCategory: (slug: string) => void;
};

function ShellBody({ data, filters, isSearchMode, onFiltersChange, onSelectCategory }: ShellBodyProps) {
  const categories = data.categories ?? [];
  const my = data.myCommunities;
  const recommended = data.recommendedCommunities ?? [];
  const discover = data.discoverCommunities;
  const searchResults = useMemo(() => filterCommunities([...my, ...discover], filters), [my, discover, filters]);

  return (
    <>
      <CommunitiesSearch categories={categories} onChange={onFiltersChange} />

      {isSearchMode ? (
        <SearchResults results={searchResults} />
      ) : (
        <>
          <MyCommunitiesSection communities={my} />
          <RecommendedSection communities={recommended} categories={categories} />
          <CategoriesSection
            categories={categories}
            activeSlug={filters.categorySlug}
            onSelect={onSelectCategory}
          />
        </>
      )}
    </>
  );
}

function SearchResults({ results }: { results: readonly CommunityCardDTO[] }) {
  if (results.length === 0) {
    return (
      <div className={sections.searchEmpty}>
        <span className={sections.searchEmptyIcon} aria-hidden="true">🔍</span>
        <p>Brak wyników. Spróbuj innej frazy albo wyczyść filtry.</p>
      </div>
    );
  }
  return (
    <div className={sections.searchResults}>
      {results.map((c) => (
        <CommunityCard key={c.id} community={c} />
      ))}
    </div>
  );
}

function filterCommunities(
  communities: readonly CommunityCardDTO[],
  filters: CommunitiesSearchFilters,
): CommunityCardDTO[] {
  const q = filters.query.trim().toLowerCase();
  return communities.filter((c) => {
    if (q && !c.name.toLowerCase().includes(q) && !c.description.toLowerCase().includes(q)) return false;
    if (filters.categorySlug && c.categorySlug !== filters.categorySlug) return false;
    void filters.locationMode; // adapter nie przechowuje per-card location mode w shell payload
    return true;
  });
}

// Re-export legacy aliases for compatibility with downstream test imports.
export type { CommunityCategoryDTO };
