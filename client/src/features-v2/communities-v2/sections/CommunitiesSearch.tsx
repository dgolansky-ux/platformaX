/**
 * features-v2/communities-v2/sections / CommunitiesSearch — collapsible search
 * panel mirroring the legacy CommunitiesSearchPanel structure. Debounce 350ms,
 * location-mode chips, category filter chip, clear button.
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

  const hasActive = query.length > 0 || locationMode !== null || categorySlug !== null;

  const clear = () => {
    setQuery("");
    setLocationMode(null);
    setCategorySlug(null);
  };

  return (
    <section className={styles.searchPanel} aria-label="Wyszukiwarka społeczności">
      <button
        type="button"
        className={styles.searchToggle}
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <span aria-hidden="true">🔍</span>
        <span>{hasActive ? "Wyszukiwanie aktywne" : "Wyszukaj społeczność"}</span>
        <span className={styles.searchToggleChevron} aria-hidden="true">{expanded ? "▲" : "▼"}</span>
      </button>
      {expanded ? (
        <div className={styles.searchBody}>
          <label className={styles.searchInputWrap}>
            <span className="sr-only">Wpisz frazę</span>
            <input
              className={styles.searchInput}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Wpisz nazwę albo temat społeczności"
              maxLength={80}
            />
          </label>
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
