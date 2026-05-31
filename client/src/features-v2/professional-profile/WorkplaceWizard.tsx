/**
 * QUALITY_STRUCTURE_EXCEPTION: Slice 12 5-step wizard kept in a single
 * component until UX is locked. Splitting per-step would prematurely freeze
 * the shape; the steps are declarative and short.
 *
 * features-v2/professional-profile / WorkplaceWizard — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * 5-step creator for "Miejsce pracy". Layout mirrors the legacy
 * ProfessionEditor wizard (Basics → Profession → Contact → Presentation →
 * Summary). No fake save: a successful submit calls
 * `professionalProfileMockAdapter.createWorkplace` and surfaces the result to
 * the parent.
 */
import { useState } from "react";
import { professionalProfileMockAdapter } from "./mock-adapter";
import type {
  CreateWorkplaceInputUi,
  WorkplaceCardUi,
  WorkplaceContactVisibilityUi,
  WorkplaceVisibilityUi,
} from "./types";
import styles from "./Workplace.module.css";

type Props = {
  viewerUserId: string;
  onCreated: (card: WorkplaceCardUi) => void;
  onCancel?: () => void;
};

type Step = 0 | 1 | 2 | 3 | 4;

const STEP_TITLES = [
  "Podstawy",
  "Zawód i obszar",
  "Kontakt i linki",
  "Prezentacja",
  "Podsumowanie",
] as const;

const STEP_HELP = [
  "Jak nazywa się Twoje miejsce pracy?",
  "Wybierz obszar zawodowy (opcjonalnie — dane referencyjne dopinane później).",
  "Pokaż jak się z Tobą skontaktować i komu te dane są widoczne.",
  "Pokaż jak wyglądasz w pracy.",
  "Sprawdź i utwórz miejsce pracy.",
] as const;

const CONTACT_VISIBILITY_OPTIONS: ReadonlyArray<{ value: WorkplaceContactVisibilityUi; label: string }> = [
  { value: "owner_only", label: "Tylko Ja" },
  { value: "friends", label: "Znajomi" },
  { value: "approved_contact_fields", label: "Osoby z zaakceptowaną zgodą kontaktową" },
  { value: "public", label: "Publicznie" },
];

const VISIBILITY_OPTIONS: ReadonlyArray<{ value: WorkplaceVisibilityUi; label: string }> = [
  { value: "public", label: "Publiczne" },
  { value: "friends_only", label: "Tylko znajomi" },
  { value: "private", label: "Prywatne (tylko Ty)" },
];

export function WorkplaceWizard({ viewerUserId, onCreated, onCancel }: Props) {
  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [professionCategorySlug] = useState<string | null>(null);
  const [professionSlug] = useState<string | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactVisibility, setContactVisibility] = useState<WorkplaceContactVisibilityUi>("owner_only");
  const [locationText, setLocationText] = useState("");
  const [onlineAvailable, setOnlineAvailable] = useState(false);
  const [visibility, setVisibility] = useState<WorkplaceVisibilityUi>("public");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function nextStep() {
    if (step === 0 && (name.trim().length === 0 || slug.trim().length === 0)) {
      setError("Nazwa i adres URL są wymagane.");
      return;
    }
    setError(null);
    if (step < 4) setStep((step + 1) as Step);
  }

  function prevStep() {
    setError(null);
    if (step > 0) setStep((step - 1) as Step);
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const input: CreateWorkplaceInputUi = {
      viewerUserId,
      name,
      slug,
      headline,
      description,
      professionCategorySlug,
      professionSlug,
      websiteUrl,
      contactEmail,
      contactPhone,
      contactVisibility,
      locationText,
      onlineAvailable,
      visibility,
    };
    const res = await professionalProfileMockAdapter.createWorkplace(input);
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    onCreated(res.value);
  }

  return (
    <section className={styles.wizardRoot} aria-labelledby="workplace-wizard-title">
      <header>
        <p className={styles.wizardLabel}>Miejsce pracy · {step + 1} / 5</p>
        <h1 id="workplace-wizard-title" className={styles.wizardTitle}>{STEP_TITLES[step]}</h1>
        <p className={styles.wizardHelp}>{STEP_HELP[step]}</p>
      </header>

      <div className={styles.wizardProgress} aria-hidden="true">
        {STEP_TITLES.map((_, idx) => (
          <span
            key={idx}
            className={`${styles.wizardStep} ${idx < step ? styles.wizardStepDone : idx === step ? styles.wizardStepActive : ""}`}
          />
        ))}
      </div>

      {step === 0 ? (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-name">Nazwa miejsca pracy</label>
            <input
              id="wp-name"
              className={styles.fieldInput}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. Coach Dawid"
              maxLength={120}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-slug">Adres URL (slug)</label>
            <input
              id="wp-slug"
              className={styles.fieldInput}
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="np. coach-dawid"
              maxLength={80}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-headline">Krótki opis (headline)</label>
            <input
              id="wp-headline"
              className={styles.fieldInput}
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="np. Coaching kariery i rozwoju"
              maxLength={140}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-description">Opis</label>
            <textarea
              id="wp-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Co prezentuje to miejsce pracy?"
              maxLength={2000}
            />
          </div>
        </>
      ) : null}

      {step === 1 ? (
        <>
          <p className={styles.contactMuted}>
            Wybór zawodu/specjalizacji jest opcjonalny — dane referencyjne są dopinane w kolejnej iteracji
            (DATA_PENDING). Nie tworzymy fake wyboru.
          </p>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel}>Kategoria zawodowa</label>
            <p className={styles.empty}>DATA_PENDING — wybór kategorii dostępny po dopięciu reference data.</p>
          </div>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-website">Strona www</label>
            <input
              id="wp-website"
              className={styles.fieldInput}
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-contact-email">Email kontaktowy</label>
            <input
              id="wp-contact-email"
              className={styles.fieldInput}
              type="text"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="kontakt@…"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-contact-phone">Telefon kontaktowy</label>
            <input
              id="wp-contact-phone"
              className={styles.fieldInput}
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+48 …"
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-contact-visibility">Widoczność kontaktu</label>
            <select
              id="wp-contact-visibility"
              className={styles.composerSelect}
              value={contactVisibility}
              onChange={(e) => setContactVisibility(e.target.value as WorkplaceContactVisibilityUi)}
            >
              {CONTACT_VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </>
      ) : null}

      {step === 3 ? (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-location">Lokalizacja (tekst)</label>
            <input
              id="wp-location"
              className={styles.fieldInput}
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              placeholder="np. Warszawa / online"
              maxLength={200}
            />
          </div>
          <div className={styles.fieldRow}>
            <input
              id="wp-online"
              type="checkbox"
              checked={onlineAvailable}
              onChange={(e) => setOnlineAvailable(e.target.checked)}
            />
            <label htmlFor="wp-online" className={styles.fieldLabel}>Dostępne online</label>
          </div>
          <p className={styles.contactMuted}>
            Logo i baner — upload media będzie podpięty w kolejnej iteracji
            (MEDIA_UPLOAD_NOT_CONNECTED).
          </p>
        </>
      ) : null}

      {step === 4 ? (
        <>
          <div className={styles.fieldGroup}>
            <label className={styles.fieldLabel} htmlFor="wp-visibility">Widoczność miejsca pracy</label>
            <select
              id="wp-visibility"
              className={styles.composerSelect}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as WorkplaceVisibilityUi)}
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.summary}>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Nazwa</span><span className={styles.summaryValue}>{name || "—"}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Adres URL</span><span className={styles.summaryValue}>{slug || "—"}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Headline</span><span className={styles.summaryValue}>{headline || "—"}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Strona www</span><span className={styles.summaryValue}>{websiteUrl || "—"}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Email</span><span className={styles.summaryValue}>{contactEmail || "—"}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Telefon</span><span className={styles.summaryValue}>{contactPhone || "—"}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Widoczność kontaktu</span><span className={styles.summaryValue}>{CONTACT_VISIBILITY_OPTIONS.find((o) => o.value === contactVisibility)?.label ?? contactVisibility}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Lokalizacja</span><span className={styles.summaryValue}>{locationText || "—"}{onlineAvailable ? " · online" : ""}</span></div>
            <div className={styles.summaryRow}><span className={styles.summaryLabel}>Widoczność miejsca</span><span className={styles.summaryValue}>{VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.label ?? visibility}</span></div>
          </div>
        </>
      ) : null}

      {error ? <p className={styles.errorBanner} role="alert">{error}</p> : null}

      <div className={styles.wizardActions}>
        {step === 0 ? (
          onCancel ? (
            <button type="button" className={styles.button} onClick={onCancel}>Anuluj</button>
          ) : <span />
        ) : (
          <button type="button" className={styles.button} onClick={prevStep} disabled={submitting}>Wstecz</button>
        )}
        {step < 4 ? (
          <button type="button" className={styles.primaryButton} onClick={nextStep}>Dalej</button>
        ) : (
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void handleSubmit()}
            disabled={submitting}
          >
            {submitting ? "Tworzenie…" : "Utwórz miejsce pracy"}
          </button>
        )}
      </div>
    </section>
  );
}
