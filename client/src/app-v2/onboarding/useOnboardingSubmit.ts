import { useState } from "react";
import type {
  IdentityAuthAdapter,
  OnboardingProfileAdapter,
  CompleteOnboardingInput,
} from "../../features-v2/identity";

type SubmitInputs = {
  firstName: string;
  lastName: string;
  /** DD/MM/YYYY as entered by the UI. */
  uiBirthDate: string;
  phone: string;
};

/**
 * Convert the UI's DD/MM/YYYY birth-date input into the backend-required
 * YYYY-MM-DD ISO format. UI-side validation guarantees the format.
 */
function toIsoBirthDate(uiBirthDate: string): string {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(uiBirthDate);
  if (!match) return uiBirthDate;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

export type UseOnboardingSubmit = {
  submitting: boolean;
  submitError: string | null;
  clearError: () => void;
  submit: (inputs: SubmitInputs) => Promise<boolean>;
};

export function useOnboardingSubmit(
  profileAdapter: OnboardingProfileAdapter,
  authAdapter: IdentityAuthAdapter,
): UseOnboardingSubmit {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(inputs: SubmitInputs): Promise<boolean> {
    setSubmitError(null);
    setSubmitting(true);
    try {
      const user = await authAdapter.getCurrentUser();
      if (!user) {
        setSubmitError(
          "Musisz być zalogowany, aby zapisać profil. Zaloguj się ponownie.",
        );
        return false;
      }
      const payload: CompleteOnboardingInput = {
        firstName: inputs.firstName,
        lastName: inputs.lastName,
        dateOfBirth: toIsoBirthDate(inputs.uiBirthDate),
        phone: inputs.phone,
      };
      const result = await profileAdapter.completeOnboarding(user.id, payload);
      if (!result.ok) {
        if (result.error.code === "ALREADY_COMPLETED") return true;
        setSubmitError(result.error.message);
        return false;
      }
      return true;
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać profilu. Spróbuj ponownie.",
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    submitting,
    submitError,
    clearError: () => setSubmitError(null),
    submit,
  };
}
