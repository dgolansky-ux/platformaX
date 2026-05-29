/**
 * features-v2/communities-v2/wizard / CreateCommunityWizard — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY orchestrator for the 4-step community creation flow.
 *
 * Clean-room re-implementation of the legacy CommunityWizard: 4 steps, top
 * progress bar, sticky CTA footer, Pomiń / Dalej / Utwórz społeczność. Submits
 * through the local mock-adapter — no fake save claim, no @server/* import.
 */
import { useEffect, useMemo, useState } from "react";
import type {
  CommunityCategoryDTO,
  CommunityProfileDTO,
} from "@shared/contracts/communities";
import { communitiesMockAdapter } from "../mock-adapter";
import { slugify } from "../slugify";
import {
  EMPTY_WIZARD_DATA,
  WIZARD_STEPS,
  type WizardData,
} from "./wizard-types";
import { BasicsStep, CategoryStep, LocationStep, SummaryStep } from "./WizardSteps";
import styles from "./Wizard.module.css";

type CreateCommunityWizardProps = {
  categories: readonly CommunityCategoryDTO[];
  onCreated: (community: CommunityProfileDTO) => void;
  onCancel: () => void;
};

export function CreateCommunityWizard({ categories, onCreated, onCancel }: CreateCommunityWizardProps) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-derive slug from name unless user typed slug
  useEffect(() => {
    if (!data.slug && data.name) {
      setData((prev) => ({ ...prev, slug: slugify(prev.name) }));
    }
  }, [data.name, data.slug]);

  const update = (patch: Partial<WizardData>) => setData((prev) => ({ ...prev, ...patch }));

  const canProceed = useMemo(() => {
    if (step === 1) return data.name.trim().length >= 3 && data.slug.length > 0;
    return true;
  }, [step, data.name, data.slug]);

  const isLast = step === WIZARD_STEPS.length;
  const currentStep = WIZARD_STEPS[step - 1];
  const categoryName = categories.find((c) => c.slug === data.categorySlug)?.name ?? null;

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const res = await communitiesMockAdapter.createCommunity({
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      visibility: data.visibility,
      categorySlug: data.categorySlug,
      topic: data.topic || undefined,
      locationMode: data.locationMode,
      locationCity: data.locationCity || undefined,
    });
    setSubmitting(false);
    if (!res.ok) {
      const msg = res.error.code === "VALIDATION" ? `${res.error.field}: ${res.error.message}` : res.error.message;
      setError(msg);
      // Wizard return user to step 1 on slug/name validation errors
      if (res.error.code === "VALIDATION" && (res.error.field === "name" || res.error.field === "slug")) {
        setStep(1);
      }
      return;
    }
    onCreated(res.value);
  }

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          {step > 1 ? (
            <button type="button" className={styles.iconButton} onClick={() => setStep((s) => s - 1)} aria-label="Wstecz">
              ←
            </button>
          ) : null}
          <div>
            <h1 id="wizard-title" className={styles.headerTitle}>Nowa społeczność</h1>
            <p className={styles.headerSub}>Krok {step} z {WIZARD_STEPS.length} — {currentStep.title}</p>
          </div>
        </div>
        <button type="button" className={styles.iconButton} onClick={onCancel} aria-label="Zamknij kreator">✕</button>
      </header>

      <div className={styles.progressBar} aria-hidden="true">
        {WIZARD_STEPS.map((s) => (
          <span key={s.id} className={`${styles.progressDash} ${s.id <= step ? styles.progressDashActive : ""}`} />
        ))}
      </div>

      <main className={styles.content}>
        <div className={styles.contentInner}>
          {step === 1 ? <BasicsStep data={data} update={update} /> : null}
          {step === 2 ? <CategoryStep data={data} update={update} categories={categories} /> : null}
          {step === 3 ? <LocationStep data={data} update={update} /> : null}
          {step === 4 ? <SummaryStep data={data} categoryName={categoryName} /> : null}
          {error ? <p className={styles.error} role="alert">{error}</p> : null}
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          {!isLast ? (
            <div className={styles.footerRow}>
              {step > 1 ? (
                <button type="button" className={styles.secondaryButton} onClick={() => setStep((s) => s + 1)}>
                  Pomiń
                </button>
              ) : null}
              <button
                type="button"
                className={styles.primaryButton}
                disabled={!canProceed}
                onClick={() => setStep((s) => s + 1)}
              >
                Dalej →
              </button>
            </div>
          ) : (
            <button type="button" className={styles.primaryButton} disabled={submitting} onClick={handleSubmit}>
              {submitting ? "Tworzenie…" : "⚡ Utwórz społeczność"}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
