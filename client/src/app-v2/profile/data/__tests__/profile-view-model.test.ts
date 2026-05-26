import { describe, expect, it } from "vitest";
import type {
  PrivateProfileDTO,
  PublicProfileDTO,
} from "@server/domains-v2/identity/public-api";
import type { MediaUploadAdapter } from "../../../../features-v2/media";
import {
  resolveMediaUrl,
  resolveProfileMediaUrls,
  toOwnerPersonalProfileView,
  toPublicPersonalProfileView,
} from "../profile-view-model";

function fakeMediaAdapter(
  resolve: (id: string) => string | null = () => null,
): MediaUploadAdapter {
  return {
    isStorageConnected: () => false,
    createAvatarUploadIntent: async () => {
      throw new Error("not used in tests");
    },
    createBannerUploadIntent: async () => {
      throw new Error("not used in tests");
    },
    confirmProfileMediaUpload: async () => {
      throw new Error("not used in tests");
    },
    getPublicMediaUrl: async (ref) => {
      const url = resolve(ref.assetId);
      return {
        ok: true,
        value: {
          assetId: ref.assetId,
          purpose: "avatar",
          status: url ? "ready" : "pending",
          url,
          mimeType: "image/jpeg",
          width: null,
          height: null,
        },
      };
    },
  };
}

const privateDto: PrivateProfileDTO = {
  userId: "u-1",
  firstName: "Anna",
  lastName: "Kowalska",
  dateOfBirth: "1990-03-15",
  phone: "+48600999111",
  avatarMediaRef: { assetId: "asset-avatar" },
  bannerMediaRef: { assetId: "asset-banner" },
  bio: "Hello world",
  visibility: "public",
  onboardingCompleted: true,
  createdAt: "2026-05-25T12:00:00.000Z",
  updatedAt: "2026-05-25T12:00:00.000Z",
};

const publicDto: PublicProfileDTO = {
  userId: "u-1",
  displayName: "Anna Kowalska",
  avatarMediaRef: { assetId: "asset-avatar" },
  bannerMediaRef: { assetId: "asset-banner" },
  bio: "Hello world",
  visibility: "public",
  onboardingCompleted: true,
};

describe("profile-view-model — owner view", () => {
  it("maps private DTO + media URLs into the personal profile view", () => {
    const view = toOwnerPersonalProfileView(privateDto, {
      avatarUrl: "https://cdn.example/avatar.jpg",
      bannerUrl: "https://cdn.example/banner.jpg",
    });
    expect(view.userId).toBe("u-1");
    expect(view.displayName).toBe("Anna Kowalska");
    expect(view.avatarInitial).toBe("A");
    expect(view.avatarUrl).toBe("https://cdn.example/avatar.jpg");
    expect(view.bannerUrl).toBe("https://cdn.example/banner.jpg");
    expect(view.bio).toBe("Hello world");
    expect(view.isOwner).toBe(true);
  });

  it("never leaks private fields into the owner view model", () => {
    const view = toOwnerPersonalProfileView(privateDto, { avatarUrl: null, bannerUrl: null });
    const json = JSON.stringify(view);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
    expect(Object.keys(view)).not.toContain("phone");
    expect(Object.keys(view)).not.toContain("dateOfBirth");
  });

  it("falls back to a safe display name when first/last are empty", () => {
    const empty: PrivateProfileDTO = {
      ...privateDto,
      firstName: null,
      lastName: null,
    };
    const view = toOwnerPersonalProfileView(empty, { avatarUrl: null, bannerUrl: null });
    expect(view.displayName).toBe("Użytkownik");
    expect(view.avatarInitial).toBe("U");
  });
});

describe("profile-view-model — public view", () => {
  it("maps public DTO into a stranger-safe view (empty social/feed)", () => {
    const view = toPublicPersonalProfileView(publicDto, {
      avatarUrl: null,
      bannerUrl: null,
    });
    expect(view.isOwner).toBe(false);
    expect(view.contacts.length).toBe(0);
    expect(view.quickFeed.length).toBe(0);
    expect(view.socialLinks.length).toBe(0);
  });
});

describe("profile-view-model — media url resolution", () => {
  it("returns null when there is no asset ref", async () => {
    const url = await resolveMediaUrl(fakeMediaAdapter(), null);
    expect(url).toBeNull();
  });

  it("returns null when storage is env-required (no public URL yet)", async () => {
    const url = await resolveMediaUrl(fakeMediaAdapter(() => null), {
      assetId: "asset-x",
    });
    expect(url).toBeNull();
  });

  it("resolves both avatar and banner refs in parallel", async () => {
    const adapter = fakeMediaAdapter((id) =>
      id === "asset-avatar"
        ? "https://cdn.example/avatar.jpg"
        : id === "asset-banner"
          ? "https://cdn.example/banner.jpg"
          : null,
    );
    const urls = await resolveProfileMediaUrls(adapter, {
      avatarMediaRef: { assetId: "asset-avatar" },
      bannerMediaRef: { assetId: "asset-banner" },
    });
    expect(urls.avatarUrl).toBe("https://cdn.example/avatar.jpg");
    expect(urls.bannerUrl).toBe("https://cdn.example/banner.jpg");
  });
});
