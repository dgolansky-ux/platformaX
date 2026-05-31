import { useState } from "react";
import sec from "../styles/profile-sections.module.css";
import pro from "../styles/profile-professional.module.css";

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
 * state. No activity data yet, so both tabs show empty states. Classic tab also
 * mirrors legacy ProfileProfessionalSection's "Moja praca" disabled anchor and
 * "Moduł w budowie" warning card. The "add" CTA opens a local "Co chcesz
 * dodać?" sheet; its options route to editors that don't exist yet, so they
 * are disabled-policy (no fake routes, no no-ops).
 */
export function ProfileProfessionalActivities({ isOwner }: ProfileProfessionalActivitiesProps) {
  const [tab, setTab] = useState<ActivityTab>("classic");
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <section className={sec.section} aria-label="Działania zawodowe">
      <div className={pro.activityTabs} role="tablist" aria-label="Widok działań">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "classic"}
          className={`${pro.activityTab} ${tab === "classic" ? pro.activityTabActive : ""}`}
          onClick={() => setTab("classic")}
        >
          Klasyczny
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "network"}
          className={`${pro.activityTab} ${tab === "network" ? pro.activityTabActive : ""}`}
          onClick={() => setTab("network")}
        >
          Sieć
        </button>
      </div>

      {tab === "classic" ? (
        <>
          {isOwner ? (
            <button
              type="button"
              className={pro.workplaceAnchor}
              title="Sekcja Miejsce pracy w przygotowaniu"
              disabled
            >
              <span aria-hidden="true">+</span> Moja praca
            </button>
          ) : null}

          <div className={pro.workplaceWarning} role="status">
            <span className={pro.workplaceWarningIcon} aria-hidden="true">🔧</span>
            <div className={pro.workplaceWarningBody}>
              <p className={pro.workplaceWarningTitle}>Moduł w budowie</p>
              <p className={pro.workplaceWarningText}>
                Sekcja Miejsce pracy jest w przygotowaniu.
              </p>
            </div>
          </div>

          <div className={sec.emptyState}>
            <div className={sec.emptyIcon} aria-hidden="true">🧰</div>
            <p className={sec.emptyTitle}>Brak działań zawodowych</p>
            <p className={sec.emptyText}>
              {isOwner
                ? "Dodaj projekt, usługę lub case study aby pokazać swoją pracę."
                : "Ten użytkownik nie dodał jeszcze żadnych działań zawodowych."}
            </p>
            {isOwner ? (
              <button
                type="button"
                className={pro.addButton}
                aria-expanded={sheetOpen}
                onClick={() => setSheetOpen(true)}
              >
                Dodaj działanie zawodowe
              </button>
            ) : null}
          </div>
        </>
      ) : (
        <div className={sec.emptyState}>
          <div className={sec.emptyIcon} aria-hidden="true">🕸️</div>
          <p className={sec.emptyTitle}>Widok sieci</p>
          <p className={sec.emptyText}>Dodaj działania aby zobaczyć widok sieci</p>
        </div>
      )}

      {sheetOpen ? (
        <div className={pro.sheet} role="dialog" aria-label="Co chcesz dodać?">
          <div className={pro.sheetHeader}>
            <p className={pro.sheetTitle}>Co chcesz dodać?</p>
            <button
              type="button"
              className={pro.sheetClose}
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
              className={pro.sheetOption}
              title={`${type.label} — edytor w przygotowaniu`}
              disabled
            >
              <span className={pro.sheetOptionLabel}>{type.label}</span>
              <span className={pro.sheetOptionDesc}>{type.desc}</span>
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
