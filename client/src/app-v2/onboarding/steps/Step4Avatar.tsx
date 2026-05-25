import stepsStyles from "./steps.module.css";

type Step4Props = {
  firstName: string;
};

function initials(firstName: string): string {
  const trimmed = firstName.trim();
  if (!trimmed) return "P";
  return trimmed.charAt(0).toUpperCase();
}

export function Step4Avatar({ firstName }: Step4Props) {
  return (
    <div className={stepsStyles.avatarRow}>
      <div className={stepsStyles.avatarCircle} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="9" r="4" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <p className={stepsStyles.avatarLabel}>
        Dodanie zdjęcia będzie możliwe po podłączeniu modułu mediów. Możesz
        pominąć ten krok i wrócić do niego później — Twoje konto będzie
        oznaczone literą „{initials(firstName)}".
      </p>
    </div>
  );
}
