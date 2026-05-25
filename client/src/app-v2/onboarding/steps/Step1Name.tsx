import { FormField } from "../../auth/forms/FormField";
import stepsStyles from "./steps.module.css";

type Step1Props = {
  firstName: string;
  lastName: string;
  errors: { firstName?: string; lastName?: string };
  onFirstName: (v: string) => void;
  onLastName: (v: string) => void;
};

export function Step1Name({
  firstName,
  lastName,
  errors,
  onFirstName,
  onLastName,
}: Step1Props) {
  return (
    <div className={stepsStyles.stack}>
      <div className={stepsStyles.row}>
        <FormField
          label="Imię"
          required
          autoComplete="given-name"
          placeholder="np. Anna"
          value={firstName}
          onChange={(e) => onFirstName(e.target.value)}
          error={errors.firstName}
        />
        <FormField
          label="Nazwisko"
          required
          autoComplete="family-name"
          placeholder="np. Kowalska"
          value={lastName}
          onChange={(e) => onLastName(e.target.value)}
          error={errors.lastName}
        />
      </div>
    </div>
  );
}
