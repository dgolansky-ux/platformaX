import type { InputHTMLAttributes } from "react";
import { useId, useState } from "react";
import styles from "./FormField.module.css";

type PasswordFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

export function PasswordField({
  label,
  error,
  hint,
  required,
  className,
  ...inputProps
}: PasswordFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const [revealed, setRevealed] = useState(false);
  const describedBy =
    [error ? errorId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </label>
      <div className={styles.controlWrap}>
        <input
          {...inputProps}
          id={inputId}
          type={revealed ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${styles.input} ${styles.withSuffix} ${error ? styles.inputInvalid : ""} ${className ?? ""}`}
        />
        <button
          type="button"
          onClick={() => setRevealed((v) => !v)}
          className={styles.toggle}
          aria-label={revealed ? "Ukryj hasło" : "Pokaż hasło"}
          aria-pressed={revealed}
          tabIndex={-1}
        >
          {revealed ? (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 9 4.5 10 7-.4 1-1.4 2.6-3 4M6.1 6.1C4.3 7.5 2.7 9.6 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
            </svg>
          )}
        </button>
      </div>
      {error ? (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={styles.hint}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
