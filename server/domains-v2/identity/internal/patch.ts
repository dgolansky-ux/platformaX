/**
 * identity — patch builders (internal)
 *
 * Translates the service-layer input shapes into the repository-layer
 * `UpdateProfileRecordPatch`. Kept thin so `service.ts` stays at use-case level.
 */
import type {
  UpdatePersonalStatusInput,
  UpdatePrivateProfileInput,
} from "../contracts";
import type { UpdateProfileRecordPatch } from "../repository";
import {
  normalisePhone,
  normaliseSocialLinks,
  normaliseText,
} from "./validation";

export function buildPrivateProfilePatch(
  input: UpdatePrivateProfileInput,
): UpdateProfileRecordPatch {
  const patch: UpdateProfileRecordPatch = {};
  if (input.firstName !== undefined) patch.firstName = input.firstName.trim();
  if (input.lastName !== undefined) patch.lastName = input.lastName.trim();
  if (input.dateOfBirth !== undefined) patch.dateOfBirth = input.dateOfBirth;
  if (input.phone !== undefined) patch.phone = normalisePhone(input.phone);
  if (input.avatarMediaRef !== undefined) {
    patch.avatarAssetId = input.avatarMediaRef?.assetId ?? null;
  }
  if (input.bannerMediaRef !== undefined) {
    patch.bannerAssetId = input.bannerMediaRef?.assetId ?? null;
  }
  if (input.bio !== undefined) patch.bio = normaliseText(input.bio);
  if (input.location !== undefined) patch.location = normaliseText(input.location);
  if (input.profileSlug !== undefined) {
    patch.profileSlug = input.profileSlug === null ? null : input.profileSlug.trim();
  }
  if (input.civilStatus !== undefined) patch.civilStatus = input.civilStatus;
  if (input.socialLinks !== undefined) {
    patch.socialLinks = normaliseSocialLinks(input.socialLinks);
  }
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  return patch;
}

export function buildPersonalStatusPatch(
  input: UpdatePersonalStatusInput,
): UpdateProfileRecordPatch {
  return {
    statusText: input.text.trim(),
    statusEmoji: normaliseText(input.emoji ?? null),
    statusDescription: normaliseText(input.description ?? null),
    statusVisibility: input.visibility,
    statusPhotoAssetId: input.photoMediaRef?.assetId ?? null,
  };
}

export const CLEAR_PERSONAL_STATUS_PATCH: UpdateProfileRecordPatch = {
  statusText: null,
  statusEmoji: null,
  statusDescription: null,
  statusVisibility: null,
  statusPhotoAssetId: null,
};
