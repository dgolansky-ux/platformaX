/**
 * identity — mappers
 *
 * Raw persistence record -> typed DTOs.
 * - toPrivateProfileDTO: owner-only mapping, keeps PII intact.
 * - toPublicProfileDTO: strips PII; what every non-owner viewer sees.
 *
 * Public mapper has dedicated PII tests in __tests__/public-mapper-no-pii.test.ts.
 */
import type { MediaAssetRef, PublicProfileDTO } from "./dto";
import type { PrivateProfileDTO } from "./internal/private-profile-dto";
import type { PrivateProfileRecord } from "./internal/record";

function assetRef(id: string | null): MediaAssetRef | null {
  return id ? { assetId: id } : null;
}

function displayNameOf(record: PrivateProfileRecord): string {
  const parts = [record.firstName, record.lastName].filter(
    (p): p is string => typeof p === "string" && p.trim().length > 0,
  );
  if (parts.length > 0) return parts.join(" ");
  return "Użytkownik";
}

export function toPrivateProfileDTO(
  record: PrivateProfileRecord,
): PrivateProfileDTO {
  return {
    userId: record.userId,
    firstName: record.firstName,
    lastName: record.lastName,
    dateOfBirth: record.dateOfBirth,
    phone: record.phone,
    avatarMediaRef: assetRef(record.avatarAssetId),
    bannerMediaRef: assetRef(record.bannerAssetId),
    bio: record.bio,
    visibility: record.visibility,
    onboardingCompleted: record.onboardingCompleted,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toPublicProfileDTO(
  record: PrivateProfileRecord,
): PublicProfileDTO {
  return {
    userId: record.userId,
    displayName: displayNameOf(record),
    avatarMediaRef: assetRef(record.avatarAssetId),
    bannerMediaRef: assetRef(record.bannerAssetId),
    bio: record.bio,
    visibility: record.visibility,
    onboardingCompleted: record.onboardingCompleted,
  };
}
