/**
 * Pure async orchestration used by `useProfileData`. Splitting this out keeps
 * the hook surface tiny and lets tests exercise the full state machine without
 * pulling React, JSX or Supabase SDK into the test runner — addresses the OOM
 * we hit when test-loading the full identity barrel.
 */
import type { IdentityAuthAdapter, OnboardingProfileAdapter } from "../../../features-v2/identity";
import type { MediaUploadAdapter } from "../../../features-v2/media";
import {
  resolveProfileMediaUrls,
  toOwnerPersonalProfileView,
} from "./profile-view-model";
import type { PersonalProfileView } from "../types";

export type ProfileDataState =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | {
      kind: "ready";
      userId: string;
      view: PersonalProfileView;
      isPersistent: boolean;
    }
  | { kind: "empty"; userId: string }
  | { kind: "error"; message: string };

export type FetchProfileDataDeps = {
  auth: IdentityAuthAdapter;
  profile: OnboardingProfileAdapter;
  media: MediaUploadAdapter;
};

const GENERIC_ERROR = "Nie udało się pobrać profilu. Spróbuj ponownie.";

export async function fetchProfileDataOnce(
  deps: FetchProfileDataDeps,
): Promise<ProfileDataState> {
  try {
    const user = await deps.auth.getCurrentUser();
    if (!user) return { kind: "anonymous" };

    const result = await deps.profile.getMyProfile(user.id);
    if (!result.ok) {
      if (result.error.code === "NOT_FOUND") {
        return { kind: "empty", userId: user.id };
      }
      return { kind: "error", message: result.error.message };
    }

    const urls = await resolveProfileMediaUrls(deps.media, {
      avatarMediaRef: result.value.avatarMediaRef,
      bannerMediaRef: result.value.bannerMediaRef,
    });
    const view = toOwnerPersonalProfileView(result.value, urls);
    return {
      kind: "ready",
      userId: user.id,
      view,
      isPersistent: deps.profile.isPersistent(),
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : GENERIC_ERROR;
    return { kind: "error", message };
  }
}
