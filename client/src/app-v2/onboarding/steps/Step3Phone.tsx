import { FormField } from "../../auth/forms/FormField";
import stepsStyles from "./steps.module.css";

type Step3Props = {
  phone: string;
  phoneConfirmed: boolean;
  errors: { phone?: string; phoneConfirmed?: string };
  onPhone: (v: string) => void;
  onPhoneConfirmed: (v: boolean) => void;
};

export function Step3Phone({
  phone,
  phoneConfirmed,
  errors,
  onPhone,
  onPhoneConfirmed,
}: Step3Props) {
  return (
    <div className={stepsStyles.stack}>
      <FormField
        label="Numer telefonu"
        required
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="np. +48 600 123 456"
        value={phone}
        onChange={(e) => onPhone(e.target.value.replace(/[^0-9+\s-]/g, ""))}
        maxLength={20}
        hint="Podaj numer w formacie krajowym lub z prefiksem +"
        error={errors.phone}
      />

      <label className={stepsStyles.checkRow}>
        <input
          type="checkbox"
          checked={phoneConfirmed}
          onChange={(e) => onPhoneConfirmed(e.target.checked)}
          className={stepsStyles.check}
          aria-invalid={errors.phoneConfirmed ? true : undefined}
        />
        <span>
          Potwierdzam, że podany numer telefonu jest moim prawdziwym numerem
          i należy do mnie.
        </span>
      </label>
      {errors.phoneConfirmed ? (
        <p className={stepsStyles.inlineError}>{errors.phoneConfirmed}</p>
      ) : null}
    </div>
  );
}
