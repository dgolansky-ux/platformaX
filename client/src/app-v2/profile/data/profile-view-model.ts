/**
 * app-v2/profile/data — composition of identity and media public adapters into
 * the personal profile view model the shell renders.
 *
 * Owner DTOs (`PrivateProfileDTO`) and stranger DTOs (`PublicProfileDTO`) both
 * map into the SAME `PersonalProfileView` shape — the shell renders both, but
 * private fields never enter `PersonalProfileView`. Media asset refs are
 * resolved through `mediaAdapter.getPublicMediaUrl`; storage is env-required,
 * so a URL is null until a real storage backend is wired.
 */
import type {
  PrivateProfileDTO,
  PublicProfileDTO,
  MediaAssetRef,
} from "@server/domains-v2/identity/public-api";
import type { MediaUploadAdapter } from "../../../features-v2/media";
import {
  ownerPersonalProfile,
  publicPersonalProfile,
} from "../fixtures";
import type { PersonalProfileView } from "../types";

/** First character of a display name; safe for empty/space-only input. */
function initialOf(name: string | null | undefined): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return trimmed[0]!.toUpperCase();
}

function privateDisplayName(dto: PrivateProfileDTO): string {
  const parts: string[] = [];
  if (dto.firstName && dto.firstName.trim().length > 0) parts.push(dto.firstName.trim());
  if (dto.lastName && dto.lastName.trim().length > 0) parts.push(dto.lastName.trim());
  return parts.length > 0 ? parts.join(" ") : "Użytkownik";
}

/**
 * Resolve a media asset ref into a public URL via the media boundary. Returns
 * null when there is no ref, when the asset is not found, or when the storage
 * backend is env-required (no `publicUrl` yet) — the shell must surface that as
 * "no image" rather than fake an URL.
 */
export async function resolveMediaUrl(
  media: MediaUploadAdapter,
  ref: MediaAssetRef | null,
): Promise<string | null> {
  if (!ref) return null;
  const result = await media.getPublicMediaUrl({ assetId: ref.assetId });
  if (!result.ok) return null;
  return result.value.url;
}

type ProfileMediaUrls = {
  avatarUrl: string | null;
  bannerUrl: string | null;
};

/** Owner-facing view model — private fields are explicitly excluded. */
export function toOwnerPersonalProfileView(
  dto: PrivateProfileDTO,
  urls: ProfileMediaUrls,
): PersonalProfileView {
  const displayName = privateDisplayName(dto);
  return {
    ...ownerPersonalProfile,
    userId: dto.userId,
    displayName,
    avatarInitial: initialOf(displayName),
    avatarUrl: urls.avatarUrl,
    bannerUrl: urls.bannerUrl,
    bio: dto.bio,
    isOwner: true,
  };
}

/** Public viewer view model — DTO has no PII to begin with. */
export function toPublicPersonalProfileView(
  dto: PublicProfileDTO,
  urls: ProfileMediaUrls,
): PersonalProfileView {
  return {
    ...publicPersonalProfile,
    userId: dto.userId,
    displayName: dto.displayName,
    avatarInitial: initialOf(dto.displayName),
    avatarUrl: urls.avatarUrl,
    bannerUrl: urls.bannerUrl,
    bio: dto.bio,
    isOwner: false,
  };
}

/** Fixed-cap list of media references resolved by a single owner profile view. */
const MAX_PROFILE_MEDIA_REFS = 2;

/** Resolve avatar/banner URLs in parallel through the media boundary. */
export async function resolveProfileMediaUrls(
  media: MediaUploadAdapter,
  refs: {
    avatarMediaRef: MediaAssetRef | null;
    bannerMediaRef: MediaAssetRef | null;
  },
): Promise<ProfileMediaUrls> {
  const pending: Array<Promise<string | null>> = [
    resolveMediaUrl(media, refs.avatarMediaRef),
    resolveMediaUrl(media, refs.bannerMediaRef),
  ].slice(0, MAX_PROFILE_MEDIA_REFS);
  const [avatarUrl, bannerUrl] = await Promise.all(pending);
  return { avatarUrl: avatarUrl ?? null, bannerUrl: bannerUrl ?? null };
}
