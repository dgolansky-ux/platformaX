/**
 * useProfileBioEdit — minimal owner-only bio editor wired through the identity
 * profile adapter (`updateMyProfile` -> `updatePrivateProfile`). Other private
 * fields (firstName/lastName/phone/dateOfBirth) are intentionally out of scope
 * for this first wiring step; they belong to a fuller editor (PROFILE_RUNTIME_
 * PARTIAL — see step-33 report).
 */
import { useState } from "react";
import {
  profileAdapter as defaultProfileAdapter,
  type OnboardingProfileAdapter,
} from "../../../features-v2/identity";

export type BioEditState = {
  saving: boolean;
  error: string | null;
};

export type UseProfileBioEditDeps = {
  profileAdapter?: OnboardingProfileAdapter;
};

export type UseProfileBioEditResult = {
  state: BioEditState;
  saveBio: (userId: string, bio: string) => Promise<boolean>;
  clearError: () => void;
};

const BIO_MAX = 175;

export function useProfileBioEdit(
  deps: UseProfileBioEditDeps = {},
): UseProfileBioEditResult {
  const profile = deps.profileAdapter ?? defaultProfileAdapter;
  const [state, setState] = useState<BioEditState>({ saving: false, error: null });

  async function saveBio(userId: string, bio: string): Promise<boolean> {
    const trimmed = bio.trim();
    if (trimmed.length > BIO_MAX) {
      setState({ saving: false, error: `Bio może mieć maksymalnie ${BIO_MAX} znaków` });
      return false;
    }
    setState({ saving: true, error: null });
    try {
      const result = await profile.updateMyProfile(userId, {
        bio: trimmed.length === 0 ? null : trimmed,
      });
      if (!result.ok) {
        setState({ saving: false, error: result.error.message });
        return false;
      }
      setState({ saving: false, error: null });
      return true;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać bio. Spróbuj ponownie.";
      setState({ saving: false, error: message });
      return false;
    }
  }

  return {
    state,
    saveBio,
    clearError: () => setState((s) => ({ ...s, error: null })),
  };
}

export const PROFILE_BIO_MAX_LENGTH = BIO_MAX;
