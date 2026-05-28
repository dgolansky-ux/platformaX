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
  profileUserId: "u-1",
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
  profileUserId: "u-1",
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
    // PersonalProfileView (client shell) keeps `userId` as the auth-resolved
    // user; the application-view's `profileUserId` is mapped 1:1 here.
    expect(view.userId).toBe("u-1");
    expect(view.displayName).toBe("Anna Kowalska");
    expect(view.avatarInitial).toBe("A");
    expect(view.avatarUrl).toBe("https://cdn.example/avatar.jpg");
    expect(view.bannerUrl).toBe("https://cdn.example/banner.jpg");
    expect(view.bio).toBe("Hello world");
    expect(view.isOwner).toBe(true);
  });

  it("maps location, personal status and social links from the real view", () => {
    const view = toOwnerPersonalProfileView({
      ...ownerView,
      location: "Kraków",
      personalStatus: {
        text: "produktywny",
        emoji: "🚀",
        description: "skupiona na release",
        visibility: "friends_only",
        photo: null,
      },
      socialLinks: {
        linkedin: "https://linkedin.com/in/anna",
        github: "https://github.com/anna",
        instagram: null,
        website: null,
      },
    });
    expect(view.location).toBe("Kraków");
    expect(view.status).toEqual({
      emoji: "🚀",
      state: "produktywny",
      description: "skupiona na release",
      visibility: "friends",
    });
    expect(view.socialLinks.map((l) => l.kind)).toEqual(["linkedin", "github"]);
    expect(view.socialLinks[0]!.url).toBe("https://linkedin.com/in/anna");
  });

  it("maps a private personal-status visibility without lying (private stays private)", () => {
    const view = toOwnerPersonalProfileView({
      ...ownerView,
      personalStatus: {
        text: "cisza",
        emoji: null,
        description: null,
        visibility: "private",
        photo: null,
      },
    });
    expect(view.status?.visibility).toBe("private");
    expect(view.status?.emoji).toBe("");
  });

  it("projects null status/empty social links when the owner has none set", () => {
    const view = toOwnerPersonalProfileView({
      ...ownerView,
      location: null,
      personalStatus: null,
      socialLinks: null,
    });
    expect(view.status).toBeNull();
    expect(view.socialLinks).toEqual([]);
    expect(view.location).toBeNull();
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

  it("maps public-safe location, status and social links the viewer is allowed to see", () => {
    const view = toPublicPersonalProfileView({
      ...publicView,
      location: "Kraków",
      personalStatus: {
        text: "otwarty na współpracę",
        emoji: "🤝",
        description: null,
        visibility: "public",
        photo: null,
      },
      socialLinks: { linkedin: "https://linkedin.com/in/anna" },
    });
    expect(view.location).toBe("Kraków");
    expect(view.status?.state).toBe("otwarty na współpracę");
    expect(view.status?.visibility).toBe("public");
    expect(view.socialLinks.map((l) => l.kind)).toEqual(["linkedin"]);
  });

  it("never includes PII fields in the public view model", () => {
    const view = toPublicPersonalProfileView(publicView);
    expect(Object.keys(view)).not.toContain("phone");
    expect(Object.keys(view)).not.toContain("dateOfBirth");
    expect(Object.keys(view)).not.toContain("civilStatus");
  });
});
