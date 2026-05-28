// QUALITY_STRUCTURE_EXCEPTION
// PLATFORMAX_EXCEPTION:
// Rule: PX-CODE-002
// Scope: client/src/app-v2/onboarding/OnboardingFlow.tsx
// Reason: multi-step onboarding flow owns transitional form state until step count stabilizes.
// Risk: component can become harder to review if new steps keep accumulating here.
// Owner: engineering
// Expiry: 2026-11-30
// Removal plan: refactor step orchestration into smaller containers when step count changes again.
// Evidence: docs/review/step-30-architecture-quality-scalability-guards/STEP_30_REVIEW.md
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./OnboardingFlow.module.css";
import { OnboardingProgress } from "./OnboardingProgress";
import { OnboardingFinished } from "./OnboardingFinished";
import { useOnboardingSubmit } from "./useOnboardingSubmit";
import { Step1Name } from "./steps/Step1Name";
import { Step2Birthday } from "./steps/Step2Birthday";
import { Step3Phone } from "./steps/Step3Phone";
import { Step4Avatar } from "./steps/Step4Avatar";
import { Step5Profile } from "./steps/Step5Profile";
import {
  validateBirthDate,
  validateNonEmpty,
  validatePhone,
} from "../auth/forms/validation";
import {
  profileAdapter as defaultProfileAdapter,
  type OnboardingProfileAdapter,
  identityAuthAdapter as defaultAuthAdapter,
  type IdentityAuthAdapter,
} from "../../features-v2/identity";

type StepId = 1 | 2 | 3 | 4 | 5;

type StepMeta = {
  id: StepId;
  eyebrow: string;
  title: string;
  lead: string;
};

const STEPS: ReadonlyArray<StepMeta> = [
  {
    id: 1,
    eyebrow: "Dane podstawowe",
    title: "Jak masz na imię?",
    lead: "Twoje imię pojawi się na profilu — możesz je zmienić w każdej chwili.",
  },
  {
    id: 2,
    eyebrow: "Data urodzenia",
    title: "Kiedy obchodzisz urodziny?",
    lead: "Data urodzenia jest prywatna — widoczna tylko dla Ciebie.",
  },
  {
    id: 3,
    eyebrow: "Telefon",
    title: "Twój numer telefonu",
    lead: "Numer jest prywatny — nie będzie publicznie widoczny.",
  },
  {
    id: 4,
    eyebrow: "Zdjęcie",
    title: "Zdjęcie profilowe",
    lead: "Avatar możesz dodać teraz lub później.",
  },
  {
    id: 5,
    eyebrow: "Profil",
    title: "Wybierz kierunek profilu",
    lead: "Pomoże nam dopasować rekomendacje społeczności i kontaktów.",
  },
];

type OnboardingState = {
  firstName: string;
  lastName: string;
  birthDate: string;
  phone: string;
  phoneConfirmed: boolean;
  selectedProfile: string | null;
};

type FieldErrors = {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  phoneConfirmed?: string;
};

const INITIAL_STATE: OnboardingState = {
  firstName: "",
  lastName: "",
  birthDate: "",
  phone: "",
  phoneConfirmed: false,
  selectedProfile: null,
};

function validateStep(step: StepId, state: OnboardingState): FieldErrors {
  const errors: FieldErrors = {};
  if (step === 1) {
    const f = validateNonEmpty(state.firstName, "imię");
    if (!f.valid) errors.firstName = f.message;
    const l = validateNonEmpty(state.lastName, "nazwisko");
    if (!l.valid) errors.lastName = l.message;
  }
  if (step === 2) {
    const b = validateBirthDate(state.birthDate);
    if (!b.valid) errors.birthDate = b.message;
  }
  if (step === 3) {
    const p = validatePhone(state.phone);
    if (!p.valid) errors.phone = p.message;
    if (!state.phoneConfirmed) {
      errors.phoneConfirmed = "Potwierdź, że numer należy do Ciebie";
    }
  }
  return errors;
}

export type OnboardingFlowProps = {
  profileAdapter?: OnboardingProfileAdapter;
  authAdapter?: IdentityAuthAdapter;
};

export function OnboardingFlow({
  profileAdapter = defaultProfileAdapter,
  authAdapter = defaultAuthAdapter,
}: OnboardingFlowProps = {}) {
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>(1);
  const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [finished, setFinished] = useState(false);
  const { submit, submitting, submitError } = useOnboardingSubmit(
    profileAdapter,
    authAdapter,
  );

  const meta = STEPS[step - 1];
  const isLastStep = step === STEPS.length;

  function update<K extends keyof OnboardingState>(key: K, value: OnboardingState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  async function handleNext() {
    const stepErrors = validateStep(step, state);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (isLastStep) {
      const ok = await submit({
        firstName: state.firstName,
        lastName: state.lastName,
        uiBirthDate: state.birthDate,
        phone: state.phone,
      });
      if (ok) setFinished(true);
      return;
    }
    setStep((prev) => (prev + 1) as StepId);
  }

  function handleBack() {
    if (step === 1) return;
    setErrors({});
    setStep((prev) => (prev - 1) as StepId);
  }

  function handleSkipAvatar() {
    if (step !== 4) return;
    setErrors({});
    setStep(5);
  }

  if (finished) {
    return (
      <OnboardingFinished
        firstName={state.firstName}
        selectedProfile={state.selectedProfile}
        isPersistent={profileAdapter.isPersistent()}
        onFinish={() => navigate("/profile")}
      />
    );
  }

  const nextLabel = isLastStep
    ? submitting
      ? "Zapisywanie…"
      : "Zakończ"
    : "Dalej";

  return (
    <div className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <Link to="/" className={styles.brand} aria-label="PlatformaX — strona główna">
            <span className={styles.brandMark} aria-hidden="true">
              P
            </span>
            PlatformaX
          </Link>
          {step === 4 ? (
            <button
              type="button"
              onClick={handleSkipAvatar}
              className={styles.skipLink}
            >
              Pomiń ten krok
            </button>
          ) : null}
        </div>

        <OnboardingProgress current={step} total={STEPS.length} label={meta.eyebrow} />

        <section className={styles.card} aria-labelledby="onboarding-step-title">
          <header className={styles.stepHead}>
            <span className={styles.stepEyebrow}>{meta.eyebrow}</span>
            <h1 id="onboarding-step-title" className={styles.stepTitle}>
              {meta.title}
            </h1>
            <p className={styles.stepLead}>{meta.lead}</p>
          </header>

          {step === 1 ? (
            <Step1Name
              firstName={state.firstName}
              lastName={state.lastName}
              errors={{ firstName: errors.firstName, lastName: errors.lastName }}
              onFirstName={(v) => update("firstName", v)}
              onLastName={(v) => update("lastName", v)}
            />
          ) : null}

          {step === 2 ? (
            <Step2Birthday
              birthDate={state.birthDate}
              error={errors.birthDate}
              onChange={(v) => update("birthDate", v)}
            />
          ) : null}

          {step === 3 ? (
            <Step3Phone
              phone={state.phone}
              phoneConfirmed={state.phoneConfirmed}
              errors={{
                phone: errors.phone,
                phoneConfirmed: errors.phoneConfirmed,
              }}
              onPhone={(v) => update("phone", v)}
              onPhoneConfirmed={(v) => update("phoneConfirmed", v)}
            />
          ) : null}

          {step === 4 ? <Step4Avatar firstName={state.firstName} /> : null}

          {step === 5 ? (
            <Step5Profile
              selectedProfile={state.selectedProfile}
              onSelect={(id) => update("selectedProfile", id)}
            />
          ) : null}

          {step === 2 || step === 3 ? (
            <p className={styles.privacyHint}>
              🔒 Dane prywatne — zapisywane wyłącznie po zalogowanym kanale
              identity. Nie trafiają do public DTO, ani do trwałej pamięci
              przeglądarki. Avatar i banner przejdą później przez media domain
              (presigned upload).
            </p>
          ) : null}

          {submitError ? (
            <p role="alert" className={styles.errorNotice}>
              {submitError}
            </p>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.backBtn}
              onClick={handleBack}
              disabled={step === 1 || submitting}
            >
              Wstecz
            </button>
            <button
              type="button"
              className={styles.nextBtn}
              onClick={handleNext}
              disabled={submitting}
            >
              {nextLabel}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
