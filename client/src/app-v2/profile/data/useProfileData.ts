/**
 * useProfileData — orchestrates auth + profile application boundary into the
 * personal profile view the shell renders.
 *
 * State machine (read-only outside this hook):
 *  - "loading"      — initial fetch in progress
 *  - "anonymous"    — no authenticated user; shell falls back to the demo fixture
 *  - "ready"        — owner profile hydrated via the application boundary
 *  - "empty"        — authenticated owner with no profile yet (onboarding required)
 *  - "error"        — application boundary returned a non-PROFILE_NOT_FOUND error
 *
 * No direct Supabase / SDK imports — only typed feature adapter facades. Media
 * URL resolution happens server-side inside the application service.
 */
import { useCallback, useEffect, useState } from "react";
import {
  identityAuthAdapter as defaultAuthAdapter,
  profileAdapter as defaultProfileAdapter,
  type IdentityAuthAdapter,
  type OnboardingProfileAdapter,
} from "../../../features-v2/identity";
import { fetchProfileDataOnce, type ProfileDataState } from "./fetchProfileData";

export type { ProfileDataState };

export type UseProfileDataDeps = {
  authAdapter?: IdentityAuthAdapter;
  profileAdapter?: OnboardingProfileAdapter;
};

export type UseProfileDataResult = {
  state: ProfileDataState;
  reload: () => void;
};

export function useProfileData(deps: UseProfileDataDeps = {}): UseProfileDataResult {
  const auth = deps.authAdapter ?? defaultAuthAdapter;
  const profile = deps.profileAdapter ?? defaultProfileAdapter;

  const [state, setState] = useState<ProfileDataState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    void (async () => {
      const next = await fetchProfileDataOnce({ auth, profile });
      if (cancelled) return;
      setState(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [auth, profile, reloadKey]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { state, reload };
}
