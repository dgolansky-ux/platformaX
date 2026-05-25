import { useState } from "react";
import styles from "../profile.module.css";

type ProfileProfessionalActivitiesProps = {
  isOwner: boolean;
};

type ActivityTab = "classic" | "network";

type WorkType = {
  id: string;
  label: string;
  desc: string;
};

// UI categories from blueprint §23.3 (not invented profession data).
const WORK_TYPES: ReadonlyArray<WorkType> = [
  { id: "workplace", label: "Stanowisko", desc: "Pokaż swoją rolę zawodową w firmie lub organizacji." },
  { id: "company", label: "Organizacja", desc: "Pokaż swoją firmę, markę albo organizację." },
  { id: "project", label: "Projekt", desc: "Zrealizowany projekt lub case study." },
  { id: "service", label: "Usługa", desc: "Pokaż, co oferujesz klientom jako usługę." },
  { id: "product", label: "Produkt", desc: "Aplikacja, kurs, ebook, SaaS." },
];

/**
 * Professional layer — activities (§23). Classic / Network tabs are local view
 * state. No activity data yet, so both tabs show empty states. The "add" CTA
 * opens a local "Co chcesz dodać?" sheet; its options route to editors that do
 * not exist yet, so they are disabled-policy (no fake routes, no no-ops).
 */
export function ProfileProfessionalActivities({ isOwner }: ProfileProfessionalActivitiesProps) {
  const [tab, setTab] = useState<ActivityTab>("classic");
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className={styles.section} aria-label="Działania zawodowe">
      <div className={styles.activityTabs} role="tablist" aria-label="Widok działań">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "classic"}
          className={`${styles.activityTab} ${tab === "classic" ? styles.activityTabActive : ""}`}
          onClick={() => setTab("classic")}
        >
          Klasyczny
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "network"}
          className={`${styles.activityTab} ${tab === "network" ? styles.activityTabActive : ""}`}
          onClick={() => setTab("network")}
        >
          Sieć
        </button>
      </div>

      {tab === "classic" ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">🧰</div>
          <p className={styles.emptyTitle}>Brak działań zawodowych</p>
          <p className={styles.emptyText}>
            {isOwner
              ? "Dodaj projekt, usługę lub case study aby pokazać swoją pracę."
              : "Ten użytkownik nie dodał jeszcze żadnych działań zawodowych."}
          </p>
          {isOwner ? (
            <button
              type="button"
              className={styles.professionAddButton}
              aria-expanded={sheetOpen}
              onClick={() => setSheetOpen(true)}
            >
              Dodaj działanie zawodowe
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon} aria-hidden="true">🕸️</div>
          <p className={styles.emptyTitle}>Widok sieci</p>
          <p className={styles.emptyText}>Dodaj działania aby zobaczyć widok sieci</p>
        </div>
      )}

      {sheetOpen ? (
        <div className={styles.sheet} role="dialog" aria-label="Co chcesz dodać?">
          <div className={styles.sheetHeader}>
            <p className={styles.previewMenuTitle}>Co chcesz dodać?</p>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Zamknij"
              onClick={() => setSheetOpen(false)}
            >
              ×
            </button>
          </div>
          {WORK_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              className={styles.sheetOption}
              title={`${type.label} — edytor wkrótce`}
              disabled
            >
              <span className={styles.sheetOptionLabel}>{type.label}</span>
              <span className={styles.sheetOptionDesc}>{type.desc}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
