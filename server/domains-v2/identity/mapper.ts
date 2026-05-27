/**
 * identity — mappers
 *
 * Raw persistence record -> typed DTOs.
 * - toPrivateProfileDTO: owner-only mapping, keeps PII intact.
 * - toPublicProfileDTO: strips PII and applies viewer-role visibility filters
 *   (personalStatus, profile visibility) so the result is always safe to send
 *   to the configured viewer role.
 *
 * Public mapper has dedicated PII tests in __tests__/public-mapper-no-pii.test.ts.
 */
import type {
  MediaAssetRef,
  PersonalStatusDTO,
  PublicProfileDTO,
} from "./dto";
import type { PrivateProfileDTO } from "./internal/private-profile-dto";
import type { PrivateProfileRecord } from "./internal/record";
import type { ViewerRole } from "./policy";

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

function personalStatusOf(record: PrivateProfileRecord): PersonalStatusDTO | null {
  if (!record.statusText || !record.statusVisibility) return null;
  return {
    text: record.statusText,
    emoji: record.statusEmoji,
    description: record.statusDescription,
    visibility: record.statusVisibility,
    photoMediaRef: assetRef(record.statusPhotoAssetId),
  };
}

/**
 * Can `role` see a personal status with `visibility`?
 *
 * `friends_only` requires a real `friend` role — strangers never see it. Until
 * the social graph runtime exists, no viewer will ever resolve to "friend",
 * which means `friends_only` correctly stays hidden from strangers.
 */
function canSeePersonalStatus(
  visibility: PersonalStatusDTO["visibility"],
  role: ViewerRole,
): boolean {
  if (role === "owner" || role === "admin") return true;
  if (visibility === "private") return false;
  if (visibility === "friends_only") return role === "friend";
  return true; // public
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
    location: record.location,
    profileSlug: record.profileSlug,
    civilStatus: record.civilStatus,
    socialLinks: record.socialLinks,
    personalStatus: personalStatusOf(record),
    visibility: record.visibility,
    onboardingCompleted: record.onboardingCompleted,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

/**
 * Public projection of the profile. Defaults to stranger view (most filtered)
 * so a forgotten role argument never accidentally leaks friend-only fields.
 */
export function toPublicProfileDTO(
  record: PrivateProfileRecord,
  viewerRole: ViewerRole = "stranger",
): PublicProfileDTO {
  const status = personalStatusOf(record);
  return {
    userId: record.userId,
    profileSlug: record.profileSlug,
    displayName: displayNameOf(record),
    avatarMediaRef: assetRef(record.avatarAssetId),
    bannerMediaRef: assetRef(record.bannerAssetId),
    bio: record.bio,
    location: record.location,
    civilStatus: record.civilStatus,
    socialLinks: record.socialLinks,
    personalStatus: status && canSeePersonalStatus(status.visibility, viewerRole) ? status : null,
    visibility: record.visibility,
    onboardingCompleted: record.onboardingCompleted,
  };
}
