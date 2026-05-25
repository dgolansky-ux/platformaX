import { Link } from "react-router-dom";
import styles from "./OnboardingFlow.module.css";

export type OnboardingFinishedProps = {
  firstName: string;
  selectedProfile: string | null;
  isPersistent: boolean;
  onFinish: () => void;
};

export function OnboardingFinished({
  firstName,
  selectedProfile,
  isPersistent,
  onFinish,
}: OnboardingFinishedProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.container}>
        <div className={styles.topRow}>
          <Link
            to="/"
            className={styles.brand}
            aria-label="PlatformaX — strona główna"
          >
            <span className={styles.brandMark} aria-hidden="true">
              P
            </span>
            PlatformaX
          </Link>
        </div>

        <section className={styles.card} aria-labelledby="onboarding-done-title">
          <span className={styles.stepEyebrow}>Onboarding ukończony</span>
          <h1 id="onboarding-done-title" className={styles.stepTitle}>
            Wszystko gotowe{firstName ? `, ${firstName}` : ""}!
          </h1>
          <p className={styles.stepLead}>
            {isPersistent
              ? "Twój profil został zapisany. Możesz teraz przejść do swojego profilu."
              : "Profil został zapisany w domenie identity (warstwa runtime). Persistence trwała (Supabase) zostanie podpięta w kolejnym kroku — po przeładowaniu strony stan może wymagać ponownego onboardingu."}
          </p>

          <div className={styles.summaryCard}>
            <p className={styles.summaryTitle}>Podsumowanie (bez PII)</p>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Imię</span>
              <span className={styles.summaryValue}>{firstName || "—"}</span>
            </div>
            <div className={styles.summaryRow}>
              <span className={styles.summaryKey}>Kierunek profilu</span>
              <span className={styles.summaryValue}>
                {selectedProfile ?? "—"}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <span />
            <button
              type="button"
              className={styles.nextBtn}
              onClick={onFinish}
            >
              Przejdź do profilu
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
