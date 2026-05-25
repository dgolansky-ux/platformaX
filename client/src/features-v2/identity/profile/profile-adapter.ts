/**
 * features-v2/identity/profile — runtime adapter.
 *
 * Wires the V2 identity backend domain to the frontend through a thin typed
 * boundary. Persistence is currently an in-memory adapter (no HTTP transport,
 * no Supabase repository yet — see BLOCKER_REQUIRES_PERSISTENCE_ADAPTER), so
 * state is volatile across reloads. The adapter is honest about this via
 * `isPersistent() === false`.
 *
 * When the Supabase repository (or any other transport) is wired, replace the
 * `createInMemoryIdentityProfileRepository` call below with the real adapter.
 * The frontend contract does not need to change.
 */
import {
  createIdentityService,
  createInMemoryIdentityProfileRepository,
  type IdentityService,
} from "@server/domains-v2/identity/public-api";
import type {
  CompleteOnboardingInput,
  OnboardingProfileAdapter,
} from "./types";

export type ProfileAdapterDeps = {
  service: IdentityService;
  isPersistent: boolean;
};

export function createProfileAdapter(
  deps: ProfileAdapterDeps,
): OnboardingProfileAdapter {
  return {
    isPersistent: () => deps.isPersistent,
    async completeOnboarding(userId: string, input: CompleteOnboardingInput) {
      return deps.service.completeOnboarding(userId, input);
    },
    async getMyProfile(userId: string) {
      return deps.service.getMyProfile(userId);
    },
    async getPublicProfile(
      viewerId: string | null,
      profileUserId: string,
    ) {
      return deps.service.getPublicProfile(viewerId, profileUserId);
    },
  };
}

/**
 * Default in-memory adapter shared across the app. Volatile — wipes on reload.
 * This is the explicit boundary the task requires while no transport exists.
 */
const defaultRepository = createInMemoryIdentityProfileRepository();
const defaultService = createIdentityService({ repository: defaultRepository });

export const profileAdapter: OnboardingProfileAdapter = createProfileAdapter({
  service: defaultService,
  isPersistent: false,
});
