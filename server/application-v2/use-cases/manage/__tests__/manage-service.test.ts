/**
 * application-v2/use-cases/manage — service tests (Slice 21).
 *
 * Verifies owner-only access, no PII leak, truthful section statuses.
 */
import { describe, expect, it, vi } from "vitest";
import { createManageApplicationService, type ManageDashboardPort } from "../service";
import type {
  ManageChannelsSnapshot,
  ManageCommunitiesSnapshot,
  ManageContactSnapshot,
  ManageFriendsSnapshot,
  ManageMediaSnapshot,
  ManageModulesSnapshot,
  ManageNotificationsSnapshot,
  ManageOwnerSummary,
  ManagePrivacySnapshot,
  ManageProfessionalSnapshot,
  ManageSecuritySnapshot,
  ManageWorkplacesSnapshot,
} from "../service";

const OWNER_ID = "u-owner-1";
const OTHER_ID = "u-other-2";

function makeOwner(): ManageOwnerSummary {
  return {
    userId: OWNER_ID,
    displayName: "Demo Owner",
    handle: "owner",
    avatarInitial: "O",
    accountEmailMasked: "owner@example.com",
    accountStatus: "active",
    bioSummary: "Bio test",
    visibility: "friends_only",
  };
}

function makePort(overrides: Partial<ManageDashboardPort> = {}): ManageDashboardPort {
  const privacy: ManagePrivacySnapshot = {
    profileVisibility: "friends_only",
    professionalLayerVisibility: "public",
    publicHubVisibility: "public",
    feedPreviewVisibility: "friends_only",
    workplaceVisibility: "public",
  };
  const contact: ManageContactSnapshot = {
    approvedConsentsCount: 2,
    pendingRequestsCount: 1,
    revokedAccessCount: 0,
    fieldsAvailable: ["email", "phone"],
    defaultFieldVisibilityLabel: "Tylko po zgodzie",
  };
  const friends: ManageFriendsSnapshot = {
    friendsCount: 12,
    invitesSentCount: 3,
    invitesReceivedCount: 2,
    blockedCount: 0,
  };
  const notifications: ManageNotificationsSnapshot = {
    categories: [
      { key: "friend_feed", label: "Feed znajomych", inAppEnabled: true, transportPartial: false },
      { key: "system", label: "System", inAppEnabled: true, transportPartial: true },
    ],
    unreadTotal: 4,
  };
  const media: ManageMediaSnapshot = {
    hasAvatar: true,
    hasBanner: false,
    profileMediaCount: 3,
    uploadPipelineStatus: "partial",
  };
  const professional: ManageProfessionalSnapshot = {
    selectedCategoriesCount: 1,
    selectedProfessionsCount: 0,
    selectedSpecializationsCount: 0,
  };
  const workplaces: ManageWorkplacesSnapshot = {
    activeWorkplacesCount: 1,
    archivedWorkplacesCount: 0,
  };
  const modules: ManageModulesSnapshot = {
    enabledModulesCount: 2,
    publicHubVisibilityLabel: "Publiczne",
  };
  const channels: ManageChannelsSnapshot = {
    leadOfCount: 1,
    followingCount: 5,
  };
  const communities: ManageCommunitiesSnapshot = {
    founderOfCount: 1,
    adminOfCount: 0,
    moderatorOfCount: 1,
  };
  const security: ManageSecuritySnapshot = {
    activeSessionsCount: 1,
    lastSignInAt: "2026-05-30T10:00:00.000Z",
    twoFactorEnabled: false,
    featureReadiness: "future_ready",
  };
  return {
    async loadOwnerSummary(uid) {
      return uid === OWNER_ID ? makeOwner() : null;
    },
    async loadPrivacySnapshot() {
      return privacy;
    },
    async loadContactSnapshot() {
      return contact;
    },
    async loadFriendsSnapshot() {
      return friends;
    },
    async loadNotificationsSnapshot() {
      return notifications;
    },
    async loadMediaSnapshot() {
      return media;
    },
    async loadProfessionalSnapshot() {
      return professional;
    },
    async loadWorkplacesSnapshot() {
      return workplaces;
    },
    async loadModulesSnapshot() {
      return modules;
    },
    async loadChannelsSnapshot() {
      return channels;
    },
    async loadCommunitiesSnapshot() {
      return communities;
    },
    async loadSecuritySnapshot() {
      return security;
    },
    ...overrides,
  };
}

describe("ManageApplicationService.getManageDashboardView", () => {
  it("returns 13 sections for owner", async () => {
    const port = makePort();
    const svc = createManageApplicationService({
      port,
      clock: () => new Date("2026-05-30T18:00:00.000Z"),
    });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.sections).toHaveLength(13);
    const keys = res.value.sections.map((s) => s.key);
    expect(keys).toEqual([
      "account",
      "profile",
      "privacy",
      "contact",
      "friends",
      "notifications",
      "media",
      "professional",
      "workplaces",
      "modules",
      "channels",
      "communities",
      "security",
    ]);
  });

  it("rejects unauthenticated", async () => {
    const port = makePort();
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView("", OWNER_ID);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("UNAUTHENTICATED");
  });

  it("rejects owner mismatch (cannot read another user's manage view)", async () => {
    const port = makePort();
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OTHER_ID);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("OWNER_MISMATCH");
  });

  it("masks account email — never returns raw address", async () => {
    const port = makePort();
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const account = res.value.sections.find((s) => s.key === "account");
    expect(account).toBeDefined();
    if (account?.key !== "account") return;
    expect(account.accountEmailMasked).not.toBe("owner@example.com");
    expect(account.accountEmailMasked).toMatch(/\*\*\*/);
  });

  it("marks notifications partial when any category has transportPartial=true", async () => {
    const port = makePort();
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const notif = res.value.sections.find((s) => s.key === "notifications");
    expect(notif?.status).toBe("partial");
  });

  it("marks professional needs_setup when nothing selected", async () => {
    const port = makePort({
      async loadProfessionalSnapshot() {
        return {
          selectedCategoriesCount: 0,
          selectedProfessionsCount: 0,
          selectedSpecializationsCount: 0,
        };
      },
    });
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const prof = res.value.sections.find((s) => s.key === "professional");
    expect(prof?.status).toBe("needs_setup");
    expect(prof?.warnings.length).toBeGreaterThan(0);
  });

  it("marks security partial when feature is future_ready", async () => {
    const port = makePort();
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const sec = res.value.sections.find((s) => s.key === "security");
    expect(sec?.status).toBe("partial");
    if (sec?.key !== "security") return;
    expect(sec.featureReadiness).toBe("future_ready");
    expect(sec.primaryAction.disabled).toBe(true);
  });

  it("does not leak PII (phone/raw email) anywhere in the DTO", async () => {
    const port = makePort();
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    const json = JSON.stringify(res.value);
    expect(json).not.toContain("owner@example.com");
    expect(json).not.toMatch(/\+?\d{9,}/);
  });

  it("returns generatedAt and runtimeBackend from deps", async () => {
    const port = makePort();
    const fixed = new Date("2026-01-01T00:00:00.000Z");
    const svc = createManageApplicationService({
      port,
      clock: () => fixed,
      runtimeBackend: "mock",
    });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.value.header.generatedAt).toBe(fixed.toISOString());
    expect(res.value.header.runtimeBackend).toBe("mock");
  });

  it("returns INTERNAL when owner summary is missing", async () => {
    const port = makePort({
      async loadOwnerSummary() {
        return null;
      },
    });
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(false);
    if (res.ok) return;
    expect(res.error.code).toBe("INTERNAL");
  });

  it("collects sectionStatuses keyed by section.key", async () => {
    const port = makePort();
    const svc = createManageApplicationService({ port });
    const res = await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(Object.keys(res.value.sectionStatuses).sort()).toEqual([
      "account",
      "channels",
      "communities",
      "contact",
      "friends",
      "media",
      "modules",
      "notifications",
      "privacy",
      "professional",
      "profile",
      "security",
      "workplaces",
    ]);
  });
});

// Smoke: make sure each port method is awaited (Promise.all path).
describe("ManageApplicationService — Promise.all dispatch", () => {
  it("calls every loader exactly once", async () => {
    const calls: string[] = [];
    const port: ManageDashboardPort = {
      async loadOwnerSummary() {
        calls.push("owner");
        return makeOwner();
      },
      async loadPrivacySnapshot() {
        calls.push("privacy");
        return {
          profileVisibility: "public",
          professionalLayerVisibility: "public",
          publicHubVisibility: "public",
          feedPreviewVisibility: "public",
          workplaceVisibility: "public",
        };
      },
      async loadContactSnapshot() {
        calls.push("contact");
        return {
          approvedConsentsCount: 0,
          pendingRequestsCount: 0,
          revokedAccessCount: 0,
          fieldsAvailable: [],
          defaultFieldVisibilityLabel: "Tylko po zgodzie",
        };
      },
      async loadFriendsSnapshot() {
        calls.push("friends");
        return { friendsCount: 0, invitesSentCount: 0, invitesReceivedCount: 0, blockedCount: 0 };
      },
      async loadNotificationsSnapshot() {
        calls.push("notifications");
        return { categories: [], unreadTotal: 0 };
      },
      async loadMediaSnapshot() {
        calls.push("media");
        return {
          hasAvatar: false,
          hasBanner: false,
          profileMediaCount: 0,
          uploadPipelineStatus: "ready",
        };
      },
      async loadProfessionalSnapshot() {
        calls.push("professional");
        return {
          selectedCategoriesCount: 0,
          selectedProfessionsCount: 0,
          selectedSpecializationsCount: 0,
        };
      },
      async loadWorkplacesSnapshot() {
        calls.push("workplaces");
        return { activeWorkplacesCount: 0, archivedWorkplacesCount: 0 };
      },
      async loadModulesSnapshot() {
        calls.push("modules");
        return { enabledModulesCount: 0, publicHubVisibilityLabel: "Prywatne" };
      },
      async loadChannelsSnapshot() {
        calls.push("channels");
        return { leadOfCount: 0, followingCount: 0 };
      },
      async loadCommunitiesSnapshot() {
        calls.push("communities");
        return { founderOfCount: 0, adminOfCount: 0, moderatorOfCount: 0 };
      },
      async loadSecuritySnapshot() {
        calls.push("security");
        return {
          activeSessionsCount: 0,
          lastSignInAt: null,
          twoFactorEnabled: false,
          featureReadiness: "future_ready",
        };
      },
    };
    const svc = createManageApplicationService({ port });
    const spy = vi.spyOn(port, "loadPrivacySnapshot");
    await svc.getManageDashboardView(OWNER_ID, OWNER_ID);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(calls).toContain("owner");
    expect(calls).toContain("privacy");
    expect(calls.length).toBe(12); // owner + 11 snapshots
  });
});
