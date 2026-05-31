// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/media — application service.
 *
 * Thin composition layer: every surface (profile, friend feed, communities,
 * channels, workplaces, events, newsletter) gets one surface-specific
 * `create*UploadIntent` method here. Each one:
 *
 *  1. Authenticates the actor.
 *  2. Asks `MediaPermissionsPort` whether the actor may upload for that
 *     owner — the media domain only knows asset-ownership, NOT social/
 *     community/channel/workplace authority.
 *  3. Delegates to `media.createUploadIntent` with the matching purpose.
 *
 * `completeMediaUpload` is the generic finalisation use-case used by every
 * surface (the actor + intent/asset already identify the surface).
 *
 * No cross-domain `internal/*` imports — only `public-api.ts` from media and
 * the injected `MediaPermissionsPort`.
 */
import type {
  CreateUploadIntentInput,
  MediaAssetDTO,
  MediaOwnerType,
  MediaPurpose,
  MediaService,
  UploadFileMeta,
  UploadIntentDTO,
} from "@server/domains-v2/media/public-api";
import {
  makeMediaAppError,
  mapMediaDomainError,
  type MediaApplicationError,
  type MediaApplicationResult,
} from "./errors";
import type {
  ChannelLeadPermission,
  MediaPermissionsPort,
} from "./permissions";

export type MediaApplicationServiceDeps = {
  media: MediaService;
  permissions: MediaPermissionsPort;
};

export type SurfaceUploadInput = {
  actorUserId: string;
  ownerId: string;
  fileMeta: UploadFileMeta;
  idempotencyKey: string;
};

export type GenericUploadInput = SurfaceUploadInput & {
  ownerType: MediaOwnerType;
  purpose: MediaPurpose;
};

export type CompleteUploadInput = {
  actorUserId: string;
  intentId: string;
  assetId: string;
};

export interface MediaApplicationService {
  // ---------- profile ----------
  createProfileAvatarUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createProfileBannerUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createProfileBioMediaUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createProfilePresentationMediaUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createImportantEventMediaUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;

  // ---------- friend feed ----------
  createFriendFeedPostMediaUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;

  // ---------- communities ----------
  createCommunityAvatarUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createCommunityBannerUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createCommunityPostMediaUploadIntent(
    input: SurfaceUploadInput & { communityId: string },
  ): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createCommunityStaffPostMediaUploadIntent(
    input: SurfaceUploadInput & { communityId: string },
  ): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createCommunityRelationalPostMediaUploadIntent(
    input: SurfaceUploadInput & { communityId: string },
  ): Promise<MediaApplicationResult<UploadIntentDTO>>;

  // ---------- channels ----------
  createChannelAvatarUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createChannelBannerUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createChannelPostMediaUploadIntent(
    input: SurfaceUploadInput & { channelId: string },
  ): Promise<MediaApplicationResult<UploadIntentDTO>>;

  // ---------- workplaces ----------
  createWorkplaceLogoUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createWorkplaceBannerUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createWorkplacePostMediaUploadIntent(
    input: SurfaceUploadInput & { workplaceId: string },
  ): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createWorkplaceTeaserMediaUploadIntent(
    input: SurfaceUploadInput & { workplaceId: string },
  ): Promise<MediaApplicationResult<UploadIntentDTO>>;

  // ---------- events ----------
  createEventCoverUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;
  createEventGalleryUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;

  // ---------- newsletter ----------
  createNewsletterMessageMediaUploadIntent(input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>>;

  // ---------- generic + completion ----------
  completeMediaUpload(input: CompleteUploadInput): Promise<MediaApplicationResult<MediaAssetDTO>>;
}

function unauth(): MediaApplicationError {
  return makeMediaAppError("UNAUTHENTICATED", "Wymagane zalogowanie.");
}

function denied(message = "Brak uprawnień do tego medium."): MediaApplicationError {
  return makeMediaAppError("PERMISSION_DENIED", message);
}

async function dispatchIntent(
  deps: MediaApplicationServiceDeps,
  intent: CreateUploadIntentInput,
): Promise<MediaApplicationResult<UploadIntentDTO>> {
  const result = await deps.media.createUploadIntent(intent);
  if (!result.ok) return { ok: false, error: mapMediaDomainError(result.error) };
  return { ok: true, value: result.value };
}

function profileOwnerGuard(input: SurfaceUploadInput): MediaApplicationError | null {
  if (!input.actorUserId) return unauth();
  // Profile-owned purposes: ownerId MUST equal the actor.
  if (input.actorUserId !== input.ownerId) return denied();
  return null;
}

async function communityAdminGuard(
  deps: MediaApplicationServiceDeps,
  actorUserId: string,
  communityId: string,
): Promise<MediaApplicationError | null> {
  if (!actorUserId) return unauth();
  const ok = await deps.permissions.isCommunityAdmin(actorUserId, communityId);
  return ok ? null : denied();
}

async function communityMemberGuard(
  deps: MediaApplicationServiceDeps,
  actorUserId: string,
  communityId: string,
): Promise<MediaApplicationError | null> {
  if (!actorUserId) return unauth();
  const ok = await deps.permissions.isCommunityMember(actorUserId, communityId);
  return ok ? null : denied();
}

async function channelLeadGuard(
  deps: MediaApplicationServiceDeps,
  actorUserId: string,
  channelId: string,
  permission: ChannelLeadPermission,
): Promise<MediaApplicationError | null> {
  if (!actorUserId) return unauth();
  const ok = await deps.permissions.isChannelLeadWith(actorUserId, channelId, permission);
  return ok ? null : denied();
}

async function workplaceOwnerGuard(
  deps: MediaApplicationServiceDeps,
  actorUserId: string,
  workplaceId: string,
): Promise<MediaApplicationError | null> {
  if (!actorUserId) return unauth();
  const ok = await deps.permissions.isWorkplaceOwner(actorUserId, workplaceId);
  return ok ? null : denied();
}

async function eventOwnerGuard(
  deps: MediaApplicationServiceDeps,
  actorUserId: string,
  eventId: string,
): Promise<MediaApplicationError | null> {
  if (!actorUserId) return unauth();
  const ok = await deps.permissions.isEventOwner(actorUserId, eventId);
  return ok ? null : denied();
}

function makeIntent(
  input: SurfaceUploadInput,
  ownerType: MediaOwnerType,
  purpose: MediaPurpose,
  overrideOwnerId?: string,
): CreateUploadIntentInput {
  return {
    actorUserId: input.actorUserId,
    ownerRef: { ownerType, ownerId: overrideOwnerId ?? input.ownerId },
    purpose,
    fileMeta: input.fileMeta,
    idempotencyKey: input.idempotencyKey,
  };
}

export function createMediaApplicationService(
  deps: MediaApplicationServiceDeps,
): MediaApplicationService {
  function profileFlow(purpose: MediaPurpose, ownerType: MediaOwnerType = "user_profile") {
    return async (input: SurfaceUploadInput): Promise<MediaApplicationResult<UploadIntentDTO>> => {
      const guard = profileOwnerGuard(input);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, ownerType, purpose));
    };
  }

  return {
    // ---------- profile ----------
    createProfileAvatarUploadIntent: profileFlow("profile_avatar"),
    createProfileBannerUploadIntent: profileFlow("profile_banner"),
    createProfileBioMediaUploadIntent: profileFlow("profile_bio_media"),
    createProfilePresentationMediaUploadIntent: profileFlow("profile_presentation_media"),
    createImportantEventMediaUploadIntent: profileFlow("profile_important_event_media"),

    // ---------- friend feed: actor authors the post ----------
    createFriendFeedPostMediaUploadIntent: async (input) => {
      if (!input.actorUserId) return { ok: false, error: unauth() };
      return dispatchIntent(deps, makeIntent(input, "post", "friend_feed_post_media"));
    },

    // ---------- communities ----------
    createCommunityAvatarUploadIntent: async (input) => {
      const guard = await communityAdminGuard(deps, input.actorUserId, input.ownerId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "community", "community_avatar"));
    },
    createCommunityBannerUploadIntent: async (input) => {
      const guard = await communityAdminGuard(deps, input.actorUserId, input.ownerId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "community", "community_banner"));
    },
    createCommunityPostMediaUploadIntent: async (input) => {
      const guard = await communityMemberGuard(deps, input.actorUserId, input.communityId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "post", "community_post_media"));
    },
    createCommunityStaffPostMediaUploadIntent: async (input) => {
      const guard = await communityAdminGuard(deps, input.actorUserId, input.communityId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "post", "community_staff_post_media"));
    },
    createCommunityRelationalPostMediaUploadIntent: async (input) => {
      const guard = await communityMemberGuard(deps, input.actorUserId, input.communityId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "post", "community_relational_post_media"));
    },

    // ---------- channels ----------
    createChannelAvatarUploadIntent: async (input) => {
      const guard = await channelLeadGuard(
        deps,
        input.actorUserId,
        input.ownerId,
        "manage_channel_profile",
      );
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "channel", "channel_avatar"));
    },
    createChannelBannerUploadIntent: async (input) => {
      const guard = await channelLeadGuard(
        deps,
        input.actorUserId,
        input.ownerId,
        "manage_channel_profile",
      );
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "channel", "channel_banner"));
    },
    createChannelPostMediaUploadIntent: async (input) => {
      const guard = await channelLeadGuard(
        deps,
        input.actorUserId,
        input.channelId,
        "publish_channel_content",
      );
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "post", "channel_post_media"));
    },

    // ---------- workplaces ----------
    createWorkplaceLogoUploadIntent: async (input) => {
      const guard = await workplaceOwnerGuard(deps, input.actorUserId, input.ownerId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "workplace", "workplace_logo"));
    },
    createWorkplaceBannerUploadIntent: async (input) => {
      const guard = await workplaceOwnerGuard(deps, input.actorUserId, input.ownerId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "workplace", "workplace_banner"));
    },
    createWorkplacePostMediaUploadIntent: async (input) => {
      const guard = await workplaceOwnerGuard(deps, input.actorUserId, input.workplaceId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "post", "workplace_post_media"));
    },
    createWorkplaceTeaserMediaUploadIntent: async (input) => {
      const guard = await workplaceOwnerGuard(deps, input.actorUserId, input.workplaceId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "post", "workplace_teaser_media"));
    },

    // ---------- events ----------
    createEventCoverUploadIntent: async (input) => {
      const guard = await eventOwnerGuard(deps, input.actorUserId, input.ownerId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "event", "event_cover"));
    },
    createEventGalleryUploadIntent: async (input) => {
      const guard = await eventOwnerGuard(deps, input.actorUserId, input.ownerId);
      if (guard) return { ok: false, error: guard };
      return dispatchIntent(deps, makeIntent(input, "event", "event_gallery"));
    },

    // ---------- newsletter ----------
    createNewsletterMessageMediaUploadIntent: async (input) => {
      if (!input.actorUserId) return { ok: false, error: unauth() };
      return dispatchIntent(deps, makeIntent(input, "post", "newsletter_message_media"));
    },

    // ---------- generic completion ----------
    async completeMediaUpload(input) {
      if (!input.actorUserId) return { ok: false, error: unauth() };
      const result = await deps.media.completeUpload({
        actorUserId: input.actorUserId,
        intentId: input.intentId,
        assetId: input.assetId,
      });
      if (!result.ok) return { ok: false, error: mapMediaDomainError(result.error) };
      return { ok: true, value: result.value };
    },
  };
}
