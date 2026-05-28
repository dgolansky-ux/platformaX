/**
 * application-v2/profile — view composer.
 *
 * Pure composition helpers that turn a domain DTO + media lookups into a
 * single profile view DTO. No identity/media state is owned here — the
 * service injects the live `MediaService` so the composer can resolve media
 * refs to URLs without coupling to a concrete storage adapter.
 *
 * Lives in its own module so `service.ts` stays focused on use-case
 * orchestration (request → policy → domain → view) and the size guard
 * (`check-application-service-size.mjs`, 280-line cap) does not need a
 * special-case for application services.
 */
import type {
  MediaAssetDTO,
  MediaService,
} from "@server/domains-v2/media/public-api";
import { asMediaAssetId } from "@shared/contracts/ids";
import type {
  PersonalStatusDTO,
  PrivateProfileDTO,
  PublicProfileDTO,
} from "@server/domains-v2/identity/public-api";
import type {
  OwnerProfileView,
  PersonalStatusView,
  ProfileMediaRefView,
  PublicProfileView,
} from "./dto";

export function displayNameOf(
  first: string | null,
  last: string | null,
): string {
  const parts: string[] = [];
  if (first && first.trim().length > 0) parts.push(first.trim());
  if (last && last.trim().length > 0) parts.push(last.trim());
  return parts.length > 0 ? parts.join(" ") : "Użytkownik";
}

function refViewFromAsset(asset: MediaAssetDTO): ProfileMediaRefView {
  return { assetId: asset.assetId, url: asset.url };
}

async function resolveRefView(
  media: MediaService,
  assetId: string | undefined | null,
): Promise<ProfileMediaRefView | null> {
  if (!assetId) return null;
  const result = await media.getPublicMediaUrl({ assetId: asMediaAssetId(assetId) });
  if (!result.ok) return { assetId, url: null };
  return refViewFromAsset(result.value);
}

async function statusView(
  media: MediaService,
  status: PersonalStatusDTO | null,
): Promise<PersonalStatusView | null> {
  if (!status) return null;
  const photo = await resolveRefView(media, status.photoMediaRef?.assetId);
  return {
    text: status.text,
    emoji: status.emoji,
    description: status.description,
    visibility: status.visibility,
    photo,
  };
}

export async function composeOwnerView(
  media: MediaService,
  dto: PrivateProfileDTO,
): Promise<OwnerProfileView> {
  const [avatar, banner, personalStatus] = await Promise.all([
    resolveRefView(media, dto.avatarMediaRef?.assetId),
    resolveRefView(media, dto.bannerMediaRef?.assetId),
    statusView(media, dto.personalStatus),
  ]);
  return {
    profileUserId: dto.userId,
    profileSlug: dto.profileSlug,
    firstName: dto.firstName,
    lastName: dto.lastName,
    displayName: displayNameOf(dto.firstName, dto.lastName),
    dateOfBirth: dto.dateOfBirth,
    phone: dto.phone,
    bio: dto.bio,
    location: dto.location,
    civilStatus: dto.civilStatus,
    socialLinks: dto.socialLinks,
    personalStatus,
    visibility: dto.visibility,
    onboardingCompleted: dto.onboardingCompleted,
    avatar,
    banner,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    isOwner: true,
  };
}

export async function composePublicView(
  media: MediaService,
  dto: PublicProfileDTO,
): Promise<PublicProfileView> {
  const [avatar, banner, personalStatus] = await Promise.all([
    resolveRefView(media, dto.avatarMediaRef?.assetId),
    resolveRefView(media, dto.bannerMediaRef?.assetId),
    statusView(media, dto.personalStatus),
  ]);
  return {
    profileUserId: dto.userId,
    profileSlug: dto.profileSlug,
    displayName: dto.displayName,
    bio: dto.bio,
    location: dto.location,
    civilStatus: dto.civilStatus,
    socialLinks: dto.socialLinks,
    personalStatus,
    visibility: dto.visibility,
    onboardingCompleted: dto.onboardingCompleted,
    avatar,
    banner,
    isOwner: false,
  };
}
