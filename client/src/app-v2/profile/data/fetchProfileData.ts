/**
 * Pure async orchestration used by `useProfileData`. The application boundary
 * already composes identity + media into a single `OwnerProfileView`, so this
 * layer only handles the auth-gated state machine and translates application
 * error codes into UI state.
 */
import type {
  IdentityAuthAdapter,
  OnboardingProfileAdapter,
} from "../../../features-v2/identity";
import { toOwnerPersonalProfileView } from "./profile-view-model";
import type { ProfileDataState } from "../types";

export type { ProfileDataState };

export type FetchProfileDataDeps = {
  auth: IdentityAuthAdapter;
  profile: OnboardingProfileAdapter;
};

const GENERIC_ERROR = "Nie udało się pobrać profilu. Spróbuj ponownie.";

export async function fetchProfileDataOnce(
  deps: FetchProfileDataDeps,
): Promise<ProfileDataState> {
  try {
    const user = await deps.auth.getCurrentUser();
    if (!user) return { kind: "anonymous" };

    const result = await deps.profile.getMyProfileView(user.id);
    if (!result.ok) {
      if (result.error.code === "PROFILE_NOT_FOUND") {
        return { kind: "empty", userId: user.id };
      }
      return { kind: "error", message: result.error.message };
    }

    return {
      kind: "ready",
      userId: user.id,
      view: toOwnerPersonalProfileView(result.value),
      isPersistent: deps.profile.isPersistent(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : GENERIC_ERROR;
    return { kind: "error", message };
  }
}
