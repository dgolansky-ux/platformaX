import type { ChangeEvent } from "react";
import { FormField } from "../../auth/forms/FormField";
import stepsStyles from "./steps.module.css";

type Step2Props = {
  birthDate: string;
  error?: string;
  onChange: (v: string) => void;
};

function maskDate(input: string): string {
  const digits = input.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function Step2Birthday({ birthDate, error, onChange }: Step2Props) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(maskDate(e.target.value));
  }

  return (
    <div className={stepsStyles.stack}>
      <FormField
        label="Data urodzenia"
        required
        inputMode="numeric"
        placeholder="dd/mm/rrrr"
        value={birthDate}
        onChange={handleChange}
        maxLength={10}
        hint="Format: dzień/miesiąc/rok, np. 15/03/1990"
        error={error}
      />
    </div>
  );
}
