import { describe, expect, it } from "vitest";
import type {
  OwnerProfileView,
  PublicProfileView,
} from "../../../../features-v2/identity";
import {
  toOwnerPersonalProfileView,
  toPublicPersonalProfileView,
} from "../profile-view-model";

const ownerView: OwnerProfileView = {
  userId: "u-1",
  profileSlug: null,
  firstName: "Anna",
  lastName: "Kowalska",
  displayName: "Anna Kowalska",
  dateOfBirth: "1990-03-15",
  phone: "+48600999111",
  bio: "Hello world",
  location: null,
  civilStatus: null,
  socialLinks: null,
  personalStatus: null,
  visibility: "public",
  onboardingCompleted: true,
  avatar: { assetId: "asset-avatar", url: "https://cdn.example/avatar.jpg" },
  banner: { assetId: "asset-banner", url: "https://cdn.example/banner.jpg" },
  createdAt: "2026-05-25T12:00:00.000Z",
  updatedAt: "2026-05-25T12:00:00.000Z",
  isOwner: true,
};

const publicView: PublicProfileView = {
  userId: "u-1",
  profileSlug: null,
  displayName: "Anna Kowalska",
  bio: "Hello world",
  location: null,
  civilStatus: null,
  socialLinks: null,
  personalStatus: null,
  visibility: "public",
  onboardingCompleted: true,
  avatar: null,
  banner: null,
  isOwner: false,
};

describe("profile-view-model — owner view", () => {
  it("maps OwnerProfileView into the personal profile view with pre-resolved URLs", () => {
    const view = toOwnerPersonalProfileView(ownerView);
    expect(view.userId).toBe("u-1");
    expect(view.displayName).toBe("Anna Kowalska");
    expect(view.avatarInitial).toBe("A");
    expect(view.avatarUrl).toBe("https://cdn.example/avatar.jpg");
    expect(view.bannerUrl).toBe("https://cdn.example/banner.jpg");
    expect(view.bio).toBe("Hello world");
    expect(view.isOwner).toBe(true);
  });

  it("never leaks private fields into the owner view model", () => {
    const view = toOwnerPersonalProfileView({
      ...ownerView,
      avatar: null,
      banner: null,
    });
    const json = JSON.stringify(view);
    expect(json).not.toContain("+48600999111");
    expect(json).not.toContain("1990-03-15");
    expect(Object.keys(view)).not.toContain("phone");
    expect(Object.keys(view)).not.toContain("dateOfBirth");
  });

  it("falls back to a safe display name when first/last are empty", () => {
    const view = toOwnerPersonalProfileView({
      ...ownerView,
      firstName: null,
      lastName: null,
      displayName: "Użytkownik",
      avatar: null,
      banner: null,
    });
    expect(view.displayName).toBe("Użytkownik");
    expect(view.avatarInitial).toBe("U");
  });

  it("returns null avatar/banner URL when the application view has no ref", () => {
    const view = toOwnerPersonalProfileView({
      ...ownerView,
      avatar: null,
      banner: null,
    });
    expect(view.avatarUrl).toBeNull();
    expect(view.bannerUrl).toBeNull();
  });
});

describe("profile-view-model — public view", () => {
  it("maps PublicProfileView into a stranger-safe view (empty social/feed)", () => {
    const view = toPublicPersonalProfileView(publicView);
    expect(view.isOwner).toBe(false);
    expect(view.contacts.length).toBe(0);
    expect(view.quickFeed.length).toBe(0);
    expect(view.socialLinks.length).toBe(0);
  });

  it("never includes PII fields in the public view model", () => {
    const view = toPublicPersonalProfileView(publicView);
    expect(Object.keys(view)).not.toContain("phone");
    expect(Object.keys(view)).not.toContain("dateOfBirth");
  });
});
