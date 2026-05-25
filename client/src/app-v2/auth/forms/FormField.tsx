import type { InputHTMLAttributes } from "react";
import { useId } from "react";
import styles from "./FormField.module.css";

type FormFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "type"
> & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: InputHTMLAttributes<HTMLInputElement>["type"];
};

export function FormField({
  label,
  error,
  hint,
  required,
  type = "text",
  className,
  ...inputProps
}: FormFieldProps) {
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
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
          type={type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${styles.input} ${error ? styles.inputInvalid : ""} ${className ?? ""}`}
        />
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
