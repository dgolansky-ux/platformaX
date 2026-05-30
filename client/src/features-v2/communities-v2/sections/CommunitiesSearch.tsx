/**
 * features-v2/communities-v2/sections / CommunitiesSearch — Slice 20B-FIX.
 *
 * Premium persistent search bar + on-demand filter panel:
 *   [🔍] [____________________________] [Filtry]
 * Filter panel (mode + category chips) only mounts when the user expands.
 * Debounce 350ms; chip toggles propagate immediately.
 */
import { useEffect, useState } from "react";
import type { CommunityCategoryDTO } from "@shared/contracts/communities";
import styles from "./Sections.module.css";

export type LocationMode = "online" | "stationary" | "hybrid";

export type CommunitiesSearchFilters = {
  query: string;
  locationMode: LocationMode | null;
  categorySlug: string | null;
};

type CommunitiesSearchProps = {
  categories: readonly CommunityCategoryDTO[];
  onChange: (filters: CommunitiesSearchFilters) => void;
};

const MODES: readonly { value: LocationMode; label: string; emoji: string }[] = [
  { value: "online",     label: "Online",      emoji: "📶" },
  { value: "stationary", label: "Stacjonarna", emoji: "📍" },
  { value: "hybrid",     label: "Hybrydowa",   emoji: "🔁" },
];

export function CommunitiesSearch({ categories, onChange }: CommunitiesSearchProps) {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [locationMode, setLocationMode] = useState<LocationMode | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    onChange({ query: debounced, locationMode, categorySlug });
  }, [debounced, locationMode, categorySlug, onChange]);

  const activeCount = (locationMode ? 1 : 0) + (categorySlug ? 1 : 0);
  const hasActive = query.length > 0 || activeCount > 0;

  const clear = () => {
    setQuery("");
    setLocationMode(null);
    setCategorySlug(null);
  };

  return (
    <section className={styles.searchPanel} aria-label="Wyszukiwarka społeczności">
      <div className={styles.searchBar}>
        <span className={styles.searchBarIcon} aria-hidden="true">🔍</span>
        <input
          className={styles.searchInput}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Szukaj społeczności, tematów, ludzi…"
          maxLength={80}
          aria-label="Wpisz frazę"
        />
        <button
          type="button"
          className={`${styles.searchToggle} ${expanded || activeCount > 0 ? styles.searchToggleActive : ""}`.trim()}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="communities-search-filters"
        >
          Filtry{activeCount > 0 ? ` · ${activeCount}` : ""}
        </button>
      </div>

      {expanded ? (
        <div id="communities-search-filters" className={styles.searchBody}>
          <div className={styles.searchRow}>
            <span className={styles.searchLabel}>Tryb działania</span>
            <div className={styles.chipGroup}>
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  className={`${styles.searchChip} ${locationMode === m.value ? styles.searchChipActive : ""}`}
                  onClick={() => setLocationMode(locationMode === m.value ? null : m.value)}
                >
                  <span aria-hidden="true">{m.emoji}</span>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.searchRow}>
            <span className={styles.searchLabel}>Kategoria</span>
            <div className={styles.chipGroup}>
              {categories.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  className={`${styles.searchChip} ${categorySlug === cat.slug ? styles.searchChipActive : ""}`}
                  onClick={() => setCategorySlug(categorySlug === cat.slug ? null : cat.slug)}
                >
                  <span aria-hidden="true">{cat.emoji}</span>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
          {hasActive ? (
            <button type="button" className={styles.searchClear} onClick={clear}>Wyczyść filtry</button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
