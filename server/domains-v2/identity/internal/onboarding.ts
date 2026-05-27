/**
 * identity — onboarding flow (internal)
 *
 * Splits the onboarding-completion logic out of `service.ts` so it stays
 * below the backend file-size budget without sacrificing readability of the
 * use-case orchestration.
 */
import type {
  CompleteOnboardingInput,
  IdentityResult,
} from "../contracts";
import type { IdentityEvent } from "../events";
import type { PrivateProfileDTO } from "./private-profile-dto";
import type { PrivateProfileRecord } from "./record";
import { canCompleteOnboarding } from "../policy";
import { toPrivateProfileDTO } from "../mapper";
import { normalisePhone, normaliseText, validateOnboardingInput } from "./validation";
import type {
  CreateProfileRecordInput,
  IdentityProfileRepository,
} from "../repository";

export type OnboardingHooks = {
  clock: () => string;
  publish: (event: IdentityEvent) => void;
};

function errInvalid(fields: Record<string, string>): IdentityResult<PrivateProfileDTO> {
  return {
    ok: false,
    error: { code: "INVALID_INPUT", message: "Niepoprawne dane wejściowe", fields },
  };
}

function buildCreatePayload(
  userId: string,
  input: CompleteOnboardingInput,
): CreateProfileRecordInput {
  return {
    userId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    dateOfBirth: input.dateOfBirth,
    phone: normalisePhone(input.phone),
    avatarAssetId: input.avatarMediaRef?.assetId ?? null,
    bannerAssetId: null,
    bio: normaliseText(input.bio ?? null),
    location: null,
    profileSlug: null,
    statusText: null,
    statusEmoji: null,
    statusDescription: null,
    statusVisibility: null,
    statusPhotoAssetId: null,
    civilStatus: null,
    socialLinks: null,
    visibility: "public",
    onboardingCompleted: true,
  };
}

export async function completeOnboardingFlow(
  repo: IdentityProfileRepository,
  hooks: OnboardingHooks,
  userId: string,
  input: CompleteOnboardingInput,
): Promise<IdentityResult<PrivateProfileDTO>> {
  const errors = validateOnboardingInput(input);
  if (Object.keys(errors).length > 0) return errInvalid(errors);
  if (!canCompleteOnboarding("owner")) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do tej operacji" } };
  }

  const existing = await repo.findByUserId(userId);
  if (existing?.onboardingCompleted) {
    return {
      ok: false,
      error: { code: "ALREADY_COMPLETED", message: "Onboarding został już ukończony" },
    };
  }

  const now = hooks.clock();
  const payload = buildCreatePayload(userId, input);
  const record: PrivateProfileRecord = existing
    ? ((await repo.update(userId, payload, now)) as PrivateProfileRecord)
    : await repo.create(payload, now);
  hooks.publish({ type: "identity.onboarding.completed", userId, at: now });
  hooks.publish({ type: "identity.profile.public_summary_changed", userId, at: now });
  return { ok: true, value: toPrivateProfileDTO(record) };
}
