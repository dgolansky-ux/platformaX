/**
 * application-v2/use-cases/media — service tests
 *
 * Validates surface-specific permission gating. The media domain itself
 * (purpose/owner/file validation) is exercised in
 * `server/domains-v2/media/__tests__` — this layer only verifies that the
 * cross-domain permission port is asked for the right authority before any
 * upload intent is created.
 */
import { describe, it, expect } from "vitest";
import {
  createMediaService,
  type MediaService,
  type MediaStoragePort,
} from "@server/domains-v2/media/public-api";
import {
  createInMemoryMediaRepository,
  createInMemoryUploadIntentRepository,
} from "@server/domains-v2/media/repository";
import {
  createMediaApplicationService,
  createDenyAllMediaPermissionsPort,
  type MediaApplicationService,
  type MediaPermissionsPort,
} from "../public-api";

function connectedStorage(): MediaStoragePort {
  return {
    provider: "test-storage",
    isConnected: () => true,
    async createUploadTarget(req) {
      return {
        provider: "test-storage",
        uploadUrl: `https://storage.test/${req.storageKey}?sig=x`,
        publicUrl: `https://cdn.test/${req.storageKey}`,
        cdnUrl: null,
        transport: "READY",
        expiresAt: null,
      };
    },
  };
}

function build(
  permissions: MediaPermissionsPort = createDenyAllMediaPermissionsPort(),
): { app: MediaApplicationService; media: MediaService } {
  let n = 0;
  const media = createMediaService({
    repository: createInMemoryMediaRepository(),
    intentRepository: createInMemoryUploadIntentRepository(),
    storage: connectedStorage(),
    clock: () => "2026-05-25T00:00:00.000Z",
    idGen: () => `gen-${++n}`,
  });
  return { app: createMediaApplicationService({ media, permissions }), media };
}

const meta = { mimeType: "image/png", sizeBytes: 1024 };

describe("profile media use-cases", () => {
  it("createProfileAvatarUploadIntent succeeds when actor owns the profile", async () => {
    const { app } = build();
    const res = await app.createProfileAvatarUploadIntent({
      actorUserId: "user-1",
      ownerId: "user-1",
      fileMeta: meta,
      idempotencyKey: "k-profile-avatar-1",
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.purpose).toBe("profile_avatar");
  });

  it("createProfileAvatarUploadIntent denies a foreign actor", async () => {
    const { app } = build();
    const res = await app.createProfileAvatarUploadIntent({
      actorUserId: "intruder",
      ownerId: "user-1",
      fileMeta: meta,
      idempotencyKey: "k-profile-avatar-2",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("PERMISSION_DENIED");
  });

  it("createImportantEventMediaUploadIntent requires the profile owner", async () => {
    const { app } = build();
    const ok = await app.createImportantEventMediaUploadIntent({
      actorUserId: "user-1",
      ownerId: "user-1",
      fileMeta: meta,
      idempotencyKey: "k-imp-1",
    });
    expect(ok.ok).toBe(true);
    const denied = await app.createImportantEventMediaUploadIntent({
      actorUserId: "intruder",
      ownerId: "user-1",
      fileMeta: meta,
      idempotencyKey: "k-imp-2",
    });
    expect(denied.ok).toBe(false);
  });
});

describe("community media use-cases", () => {
  it("createCommunityBannerUploadIntent denies non-admin", async () => {
    const { app } = build();
    const res = await app.createCommunityBannerUploadIntent({
      actorUserId: "user-1",
      ownerId: "comm-1",
      fileMeta: meta,
      idempotencyKey: "k-cb-1",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("PERMISSION_DENIED");
  });

  it("createCommunityBannerUploadIntent allows community admin", async () => {
    const permissions: MediaPermissionsPort = {
      ...createDenyAllMediaPermissionsPort(),
      async isCommunityAdmin(actor, comm) {
        return actor === "admin-1" && comm === "comm-1";
      },
    };
    const { app } = build(permissions);
    const res = await app.createCommunityBannerUploadIntent({
      actorUserId: "admin-1",
      ownerId: "comm-1",
      fileMeta: meta,
      idempotencyKey: "k-cb-ok",
    });
    expect(res.ok).toBe(true);
  });

  it("createCommunityPostMediaUploadIntent requires community membership", async () => {
    const permissions: MediaPermissionsPort = {
      ...createDenyAllMediaPermissionsPort(),
      async isCommunityMember(actor, comm) {
        return actor === "member-1" && comm === "comm-1";
      },
    };
    const { app } = build(permissions);
    const ok = await app.createCommunityPostMediaUploadIntent({
      actorUserId: "member-1",
      ownerId: "draft-post-1",
      communityId: "comm-1",
      fileMeta: meta,
      idempotencyKey: "k-cpm-ok",
    });
    expect(ok.ok).toBe(true);
    const denied = await app.createCommunityPostMediaUploadIntent({
      actorUserId: "outsider",
      ownerId: "draft-post-2",
      communityId: "comm-1",
      fileMeta: meta,
      idempotencyKey: "k-cpm-no",
    });
    expect(denied.ok).toBe(false);
  });
});

describe("channel media use-cases", () => {
  it("createChannelBannerUploadIntent requires manage_channel_profile permission", async () => {
    const permissions: MediaPermissionsPort = {
      ...createDenyAllMediaPermissionsPort(),
      async isChannelLeadWith(actor, channel, permission) {
        return (
          actor === "lead-1" &&
          channel === "ch-1" &&
          permission === "manage_channel_profile"
        );
      },
    };
    const { app } = build(permissions);
    const ok = await app.createChannelBannerUploadIntent({
      actorUserId: "lead-1",
      ownerId: "ch-1",
      fileMeta: meta,
      idempotencyKey: "k-chb-ok",
    });
    expect(ok.ok).toBe(true);
    const denied = await app.createChannelBannerUploadIntent({
      actorUserId: "follower",
      ownerId: "ch-1",
      fileMeta: meta,
      idempotencyKey: "k-chb-no",
    });
    expect(denied.ok).toBe(false);
  });

  it("createChannelPostMediaUploadIntent requires publish_channel_content permission", async () => {
    const permissions: MediaPermissionsPort = {
      ...createDenyAllMediaPermissionsPort(),
      async isChannelLeadWith(actor, channel, permission) {
        return (
          actor === "publisher" &&
          channel === "ch-1" &&
          permission === "publish_channel_content"
        );
      },
    };
    const { app } = build(permissions);
    const ok = await app.createChannelPostMediaUploadIntent({
      actorUserId: "publisher",
      ownerId: "draft-post",
      channelId: "ch-1",
      fileMeta: meta,
      idempotencyKey: "k-cpm-ok",
    });
    expect(ok.ok).toBe(true);
  });
});

describe("workplace media use-cases", () => {
  it("createWorkplaceLogoUploadIntent requires workplace ownership", async () => {
    const permissions: MediaPermissionsPort = {
      ...createDenyAllMediaPermissionsPort(),
      async isWorkplaceOwner(actor, workplace) {
        return actor === "wp-owner" && workplace === "wp-1";
      },
    };
    const { app } = build(permissions);
    const ok = await app.createWorkplaceLogoUploadIntent({
      actorUserId: "wp-owner",
      ownerId: "wp-1",
      fileMeta: meta,
      idempotencyKey: "k-wp-ok",
    });
    expect(ok.ok).toBe(true);
    const denied = await app.createWorkplaceLogoUploadIntent({
      actorUserId: "stranger",
      ownerId: "wp-1",
      fileMeta: meta,
      idempotencyKey: "k-wp-no",
    });
    expect(denied.ok).toBe(false);
  });
});

describe("event + newsletter media use-cases", () => {
  it("createEventCoverUploadIntent requires event ownership", async () => {
    const permissions: MediaPermissionsPort = {
      ...createDenyAllMediaPermissionsPort(),
      async isEventOwner(actor, eventId) {
        return actor === "host" && eventId === "event-1";
      },
    };
    const { app } = build(permissions);
    const ok = await app.createEventCoverUploadIntent({
      actorUserId: "host",
      ownerId: "event-1",
      fileMeta: meta,
      idempotencyKey: "k-ev-ok",
    });
    expect(ok.ok).toBe(true);
  });

  it("createNewsletterMessageMediaUploadIntent only requires authentication", async () => {
    const { app } = build();
    const ok = await app.createNewsletterMessageMediaUploadIntent({
      actorUserId: "user-1",
      ownerId: "draft-newsletter",
      fileMeta: meta,
      idempotencyKey: "k-nl-ok",
    });
    expect(ok.ok).toBe(true);
    const denied = await app.createNewsletterMessageMediaUploadIntent({
      actorUserId: "",
      ownerId: "draft-newsletter",
      fileMeta: meta,
      idempotencyKey: "k-nl-no",
    });
    expect(denied.ok).toBe(false);
  });
});

describe("completeMediaUpload", () => {
  it("requires actor", async () => {
    const { app } = build();
    const res = await app.completeMediaUpload({
      actorUserId: "",
      intentId: "x",
      assetId: "y",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe("UNAUTHENTICATED");
  });
});
