/**
 * shared/contracts/media-purpose-registry — purpose definitions usable on both
 * sides of the wire.
 *
 * The server domain `media` is the authoritative owner of these limits; this
 * shared table mirrors them so the frontend can render hints, pre-validate
 * mime/size and configure pickers without a round-trip. Server and client MUST
 * stay in sync — server tests assert that `getPurposeDefinition` on the domain
 * matches the table below (see `__tests__/purpose-registry-sync.test.ts`).
 *
 * NOTE: This is shared *contract data*, not business logic. Calling code that
 * mutates assets MUST still go through `MediaService` / `MediaApplicationService`.
 */
import type {
  MediaOwnerType,
  MediaPurpose,
  MediaPurposeDefinitionDTO,
  MediaVariantType,
  MediaVisibility,
} from "./media";

const MB = 1024 * 1024;
const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
const VIDEO_MIME_FUTURE = ["video/mp4", "video/webm"] as const;

function def(
  purpose: MediaPurpose,
  allowedOwnerTypes: readonly MediaOwnerType[],
  allowedMimeTypes: readonly string[],
  maxSizeBytes: number,
  maxFiles: number,
  variantPolicy: readonly MediaVariantType[],
  defaultVisibility: MediaVisibility,
  canBePublic: boolean,
  recommendedWidth: number | null = null,
  recommendedHeight: number | null = null,
): MediaPurposeDefinitionDTO {
  return {
    purpose,
    allowedOwnerTypes,
    allowedMimeTypes,
    maxSizeBytes,
    maxFiles,
    variantPolicy,
    defaultVisibility,
    canBePublic,
    requiresOwnershipCheck: true,
    recommendedWidth,
    recommendedHeight,
  };
}

const AVATAR_VARIANTS: readonly MediaVariantType[] = ["original", "avatar", "small"];
const BANNER_VARIANTS: readonly MediaVariantType[] = ["original", "banner", "large"];
const POST_VARIANTS: readonly MediaVariantType[] = ["original", "thumbnail", "medium", "large"];
const TEASER_VARIANTS: readonly MediaVariantType[] = ["original", "preview", "thumbnail"];
const GALLERY_VARIANTS: readonly MediaVariantType[] = ["original", "thumbnail", "medium"];
const PRESENTATION_VARIANTS: readonly MediaVariantType[] = ["original", "medium", "large"];
const IMPORTANT_EVENT_VARIANTS: readonly MediaVariantType[] = ["original", "preview", "medium", "large"];

const REGISTRY: Readonly<Record<MediaPurpose, MediaPurposeDefinitionDTO>> = {
  profile_avatar: def("profile_avatar", ["user_profile"], IMAGE_MIME, 5 * MB, 1, AVATAR_VARIANTS, "public", true, 512, 512),
  profile_banner: def("profile_banner", ["user_profile"], IMAGE_MIME, 10 * MB, 1, BANNER_VARIANTS, "public", true, 1600, 400),
  profile_bio_media: def("profile_bio_media", ["user_profile"], IMAGE_MIME, 5 * MB, 1, AVATAR_VARIANTS, "public", true, 1024, 1024),
  profile_presentation_media: def(
    "profile_presentation_media",
    ["user_profile", "profile_presentation"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    10 * MB,
    10,
    PRESENTATION_VARIANTS,
    "friends_only",
    false,
  ),
  profile_important_event_media: def(
    "profile_important_event_media",
    ["user_profile", "important_event"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    15 * MB,
    5,
    IMPORTANT_EVENT_VARIANTS,
    "friends_only",
    false,
  ),
  friend_feed_post_media: def(
    "friend_feed_post_media",
    ["post"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    10 * MB,
    10,
    POST_VARIANTS,
    "friends_only",
    false,
  ),
  community_avatar: def("community_avatar", ["community"], IMAGE_MIME, 5 * MB, 1, AVATAR_VARIANTS, "public", true, 512, 512),
  community_banner: def("community_banner", ["community"], IMAGE_MIME, 10 * MB, 1, BANNER_VARIANTS, "public", true, 1600, 400),
  community_post_media: def(
    "community_post_media",
    ["post"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    10 * MB,
    10,
    POST_VARIANTS,
    "members_only",
    false,
  ),
  community_staff_post_media: def(
    "community_staff_post_media",
    ["post"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    10 * MB,
    10,
    POST_VARIANTS,
    "members_only",
    false,
  ),
  community_relational_post_media: def(
    "community_relational_post_media",
    ["post"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    10 * MB,
    10,
    POST_VARIANTS,
    "members_only",
    false,
  ),
  channel_avatar: def("channel_avatar", ["channel"], IMAGE_MIME, 5 * MB, 1, AVATAR_VARIANTS, "public", true, 512, 512),
  channel_banner: def("channel_banner", ["channel"], IMAGE_MIME, 10 * MB, 1, BANNER_VARIANTS, "public", true, 1600, 400),
  channel_post_media: def(
    "channel_post_media",
    ["post"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    15 * MB,
    10,
    POST_VARIANTS,
    "public",
    true,
  ),
  workplace_logo: def("workplace_logo", ["workplace"], IMAGE_MIME, 5 * MB, 1, AVATAR_VARIANTS, "public", true, 512, 512),
  workplace_banner: def("workplace_banner", ["workplace"], IMAGE_MIME, 10 * MB, 1, BANNER_VARIANTS, "public", true, 1600, 400),
  workplace_post_media: def(
    "workplace_post_media",
    ["post"],
    [...IMAGE_MIME, ...VIDEO_MIME_FUTURE],
    10 * MB,
    10,
    POST_VARIANTS,
    "public",
    true,
  ),
  workplace_teaser_media: def("workplace_teaser_media", ["post"], IMAGE_MIME, 5 * MB, 3, TEASER_VARIANTS, "public", true),
  event_cover: def("event_cover", ["event"], IMAGE_MIME, 10 * MB, 1, BANNER_VARIANTS, "public", true, 1600, 900),
  event_gallery: def("event_gallery", ["event"], IMAGE_MIME, 10 * MB, 20, GALLERY_VARIANTS, "members_only", false),
  newsletter_message_media: def(
    "newsletter_message_media",
    ["post"],
    IMAGE_MIME,
    10 * MB,
    5,
    POST_VARIANTS,
    "members_only",
    false,
  ),
};

export const MEDIA_PURPOSE_LIST: readonly MediaPurpose[] = Object.keys(REGISTRY) as MediaPurpose[];

export function getMediaPurposeDefinition(purpose: MediaPurpose): MediaPurposeDefinitionDTO {
  const found = REGISTRY[purpose];
  if (!found) {
    throw new Error(`MEDIA_PURPOSE_NOT_REGISTERED: ${purpose}`);
  }
  return found;
}

export function listMediaPurposeDefinitions(): readonly MediaPurposeDefinitionDTO[] {
  return MEDIA_PURPOSE_LIST.map((p) => REGISTRY[p]);
}
