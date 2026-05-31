/**
 * features-v2/publishing — target → media purpose mapping.
 *
 * Each publishing target maps to a `MediaPurpose` from the media domain so
 * the shared `MediaPicker` knows what limits to enforce. We never duplicate
 * purpose strings inside the composer code — surfaces ask the map.
 *
 * `ownerType` is `"post"` for every feed target (the asset will end up
 * attached to the post that the composer is drafting). Profile-presentation
 * and important-event composers attach assets to the respective profile
 * sub-entities.
 */
import type { MediaOwnerType, MediaPurpose } from "@shared/contracts/media";
import type { PublishingTargetTypeUi } from "./types";

export type PublishingMediaSurfaceConfig = {
  purpose: MediaPurpose;
  ownerType: MediaOwnerType;
};

const MAP: Readonly<Record<PublishingTargetTypeUi, PublishingMediaSurfaceConfig>> = {
  friend_feed: { purpose: "friend_feed_post_media", ownerType: "post" },
  community_feed: { purpose: "community_post_media", ownerType: "post" },
  community_staff_feed: { purpose: "community_staff_post_media", ownerType: "post" },
  community_relational_feed: {
    purpose: "community_relational_post_media",
    ownerType: "post",
  },
  channel: { purpose: "channel_post_media", ownerType: "post" },
  workplace: { purpose: "workplace_post_media", ownerType: "post" },
  important_event: {
    purpose: "profile_important_event_media",
    ownerType: "important_event",
  },
  profile_presentation: {
    purpose: "profile_presentation_media",
    ownerType: "profile_presentation",
  },
};

export function getPublishingMediaSurface(
  targetType: PublishingTargetTypeUi,
): PublishingMediaSurfaceConfig {
  return MAP[targetType];
}

/**
 * Build a stable per-composer draft owner id. Until a real draft persistence
 * layer is wired, we tag uploads with `draft-{viewer}-{target}-{targetId}` so
 * the media domain still enforces ownerId presence + idempotency.
 */
export function buildDraftOwnerId(
  viewerUserId: string,
  targetType: PublishingTargetTypeUi,
  targetId: string | null,
): string {
  return `draft-${viewerUserId}-${targetType}-${targetId ?? "self"}`;
}
