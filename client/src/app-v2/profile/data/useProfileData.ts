/**
 * useProfileData — orchestrates auth + identity profile + media refs into the
 * personal profile view the shell renders.
 *
 * State machine (read-only outside this hook):
 *  - "loading"      — initial fetch in progress
 *  - "anonymous"    — no authenticated user; shell falls back to the demo fixture
 *  - "ready"        — owner profile hydrated from identity + media boundaries
 *  - "empty"        — authenticated owner with no profile yet (onboarding required)
 *  - "error"        — identity boundary returned a non-NOT_FOUND error
 *
 * No direct Supabase / SDK imports — only typed adapter facades.
 */
import { useCallback, useEffect, useState } from "react";
import {
  identityAuthAdapter as defaultAuthAdapter,
  profileAdapter as defaultProfileAdapter,
  type IdentityAuthAdapter,
  type OnboardingProfileAdapter,
} from "../../../features-v2/identity";
import {
  mediaAdapter as defaultMediaAdapter,
  type MediaUploadAdapter,
} from "../../../features-v2/media";
import { fetchProfileDataOnce, type ProfileDataState } from "./fetchProfileData";

export type { ProfileDataState };

export type UseProfileDataDeps = {
  authAdapter?: IdentityAuthAdapter;
  profileAdapter?: OnboardingProfileAdapter;
  mediaAdapter?: MediaUploadAdapter;
};

export type UseProfileDataResult = {
  state: ProfileDataState;
  reload: () => void;
};

export function useProfileData(deps: UseProfileDataDeps = {}): UseProfileDataResult {
  const auth = deps.authAdapter ?? defaultAuthAdapter;
  const profile = deps.profileAdapter ?? defaultProfileAdapter;
  const media = deps.mediaAdapter ?? defaultMediaAdapter;

  const [state, setState] = useState<ProfileDataState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void (async () => {
      const next = await fetchProfileDataOnce({ auth, profile, media });
      if (cancelled) return;
      setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, profile, media, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { state, reload };
}
