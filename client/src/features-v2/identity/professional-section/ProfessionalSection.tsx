/**
 * features-v2/identity/professional-section / ProfessionalSection — the
 * Zarządzaj → Sekcja zawodowa shell.
 *
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY. Categories are
 * REFERENCE_DATA_READY (30 shared rows); professions + specializations are
 * DATA_PENDING (no fake lists, no fake save). No `@server/*` imports.
 */
import { useCallback, useEffect, useState, type ReactElement } from "react";
import type { ProfessionCategoryDTO } from "@shared/contracts/professions";
import { professionalSectionAdapter } from "./reference-adapter";
import { ProfessionCategoryGrid } from "./ProfessionCategoryGrid";
import { ProfessionStepsPanel } from "./ProfessionStepsPanel";
import { ProfessionProposalForm } from "./ProfessionProposalForm";
import { MyProfessionsPanel } from "./MyProfessionsPanel";
import styles from "./ProfessionalSection.module.css";

export function ProfessionalSection(): ReactElement {
  const [categories, setCategories] = useState<ProfessionCategoryDTO[] | null>(null);
  const [selected, setSelected] = useState<ProfessionCategoryDTO | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCategories(await professionalSectionAdapter.listCategories());
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Nieznany błąd");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loadError) {
    return (
      <div className={styles.error} role="alert">
        Nie udało się załadować kategorii: {loadError}
      </div>
    );
  }
  if (!categories) {
    return (
      <div className={styles.loading} aria-busy="true">
        Ładowanie kategorii…
      </div>
    );
  }

  return (
    <section className={styles.root} aria-labelledby="professional-section-heading">
      <header className={styles.header}>
        <h1 id="professional-section-heading" className={styles.title}>
          Sekcja zawodowa
        </h1>
        <p className={styles.lead}>
          Wybierz obszar zawodowy. Pełna lista zawodów i specjalizacji zostanie
          dodana po imporcie bazy.
        </p>
        <div className={styles.statusRow}>
          <span className={`${styles.statusPill} ${styles.statusReady}`}>
            Kategorie gotowe ({categories.length})
          </span>
          <span className={`${styles.statusPill} ${styles.statusPending}`}>
            Zawody / specjalizacje w przygotowaniu
          </span>
        </div>
      </header>

      <div>
        <h2 className={styles.sectionTitle}>Obszary zawodowe</h2>
        <ProfessionCategoryGrid
          categories={categories}
          selectedSlug={selected?.slug ?? null}
          onSelect={setSelected}
        />
      </div>

      {selected ? (
        <>
          <ProfessionStepsPanel category={selected} />
          <ProfessionProposalForm categoryName={selected.name} />
        </>
      ) : (
        <p className={styles.note}>
          Wybierz kategorię, aby zobaczyć kolejne kroki (zawód, specjalizacja).
        </p>
      )}

      <MyProfessionsPanel />
    </section>
  );
}
