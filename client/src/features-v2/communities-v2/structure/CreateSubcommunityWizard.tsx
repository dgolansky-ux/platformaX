/**
 * features-v2/communities-v2 / structure / CreateSubcommunityWizard — 5-step
 * overlay, 1:1 with the legacy SubCommunityWizard (Podstawy · Kategoria ·
 * Lokalizacja · Przynależność · Podsumowanie). Submits through the structure
 * mock-adapter (MOCK_LOCAL_ONLY) — no fake save, no @server imports.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { CommunityCategoryDTO } from "@shared/contracts/communities";
import type {
  CommunityStructureNodeDTO,
  SubcommunityStaffCandidateDTO,
} from "@shared/contracts/communities-structure";
import { communitiesMockAdapter } from "../mock-adapter";
import { communityStructureMockAdapter } from "./structure-mock-adapter";
import { slugify } from "../slugify";
import {
  StepBasics,
  StepBelonging,
  StepCategory,
  StepLocation,
  StepSummary,
  type SubWizardData,
} from "./SubcommunityWizardSteps";
import styles from "./Structure.module.css";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STEP_TITLES = ["Podstawy", "Kategoria", "Lokalizacja", "Przynależność", "Utwórz"];

const EMPTY: SubWizardData = {
  name: "", slug: "", description: "", visibility: "public",
  categorySlug: null, topic: "", operatingMode: "online", locationCity: "",
  founderJoins: true, staff: [],
};

export function CreateSubcommunityWizard({
  parent,
  parentSlug,
  onClose,
  onCreated,
}: {
  parent: CommunityStructureNodeDTO;
  parentSlug: string;
  onClose: () => void;
  onCreated: (node: CommunityStructureNodeDTO) => void;
}) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SubWizardData>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [categories, setCategories] = useState<readonly CommunityCategoryDTO[]>([]);
  const [candidates, setCandidates] = useState<readonly SubcommunityStaffCandidateDTO[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void communitiesMockAdapter.listCategories().then(setCategories);
    void communityStructureMockAdapter.listStaffCandidates(parentSlug).then((res) => {
      if (res.ok) setCandidates(res.value);
    });
  }, [parentSlug]);

  const update = useCallback((partial: Partial<SubWizardData>) => {
    setData((prev) => {
      const next = { ...prev, ...partial };
      if (partial.name !== undefined && !slugTouched) next.slug = slugify(partial.name);
      if (partial.slug !== undefined) setSlugTouched(true);
      return next;
    });
  }, [slugTouched]);

  const canProceedStep1 = data.name.trim().length >= 3 && SLUG_RE.test(data.slug);
  const isLast = step === STEP_TITLES.length;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    const res = await communityStructureMockAdapter.createSubcommunity({
      parentId: parent.id,
      name: data.name,
      slug: data.slug,
      description: data.description || undefined,
      visibility: data.visibility,
      categorySlug: data.categorySlug,
      topic: data.topic || undefined,
      operatingMode: data.operatingMode,
      locationCity: data.locationCity || undefined,
      founderJoins: data.founderJoins,
      staff: data.staff,
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    onCreated(res.value);
  };

  const dots = useMemo(() => STEP_TITLES.map((_, i) => i + 1), []);

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="wizard-title">
      <div className={styles.wizard}>
        <div className={styles.wizardHead}>
          <div>
            <h2 id="wizard-title" className={styles.wizardTitle}>Nowa podspołeczność</h2>
            <p className={styles.wizardSub}>Krok {step} z {STEP_TITLES.length} — {STEP_TITLES[step - 1]} · Rodzic: {parent.name}</p>
          </div>
          <button type="button" className={styles.closeBtn} aria-label="Zamknij" onClick={onClose}>×</button>
        </div>

        <div className={styles.steps} aria-hidden="true">
          {dots.map((d, i) => (
            <span key={d} style={{ display: "inline-flex", alignItems: "center", flex: i < dots.length - 1 ? 1 : "0 0 auto", gap: 4 }}>
              <span className={`${styles.stepDot} ${step === d ? styles.stepDotActive : ""} ${step > d ? styles.stepDotDone : ""}`.trim()}>
                {step > d ? "✓" : d}
              </span>
              {i < dots.length - 1 ? <span className={`${styles.stepBar} ${step > d ? styles.stepBarDone : ""}`.trim()} /> : null}
            </span>
          ))}
        </div>

        <div className={styles.wizardBody}>
          {step === 1 ? <StepBasics data={data} update={update} /> : null}
          {step === 2 ? <StepCategory data={data} update={update} categories={categories} /> : null}
          {step === 3 ? <StepLocation data={data} update={update} /> : null}
          {step === 4 ? <StepBelonging data={data} update={update} candidates={candidates} /> : null}
          {step === 5 ? <StepSummary data={data} parentName={parent.name} categories={categories} /> : null}
          {error ? <p className={styles.errorState} role="alert" style={{ marginTop: 14 }}>{error}</p> : null}
        </div>

        <div className={styles.wizardFoot}>
          {step > 1 ? (
            <button type="button" className={styles.ghostBtn} onClick={() => setStep((s) => s - 1)}>Wstecz</button>
          ) : null}
          {!isLast ? (
            <button
              type="button"
              className={styles.primaryBtn}
              disabled={step === 1 && !canProceedStep1}
              onClick={() => setStep((s) => s + 1)}
            >
              Dalej
            </button>
          ) : (
            <button type="button" className={styles.primaryBtn} disabled={submitting || !canProceedStep1} onClick={() => void submit()}>
              {submitting ? "Tworzenie…" : "Utwórz podspołeczność"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
