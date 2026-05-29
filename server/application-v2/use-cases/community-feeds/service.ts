/**
 * application-v2/use-cases/community-feeds — orchestration for the three
 * community feeds + publishing down the structure (Slice 5).
 *
 * Composes communities-v2 (role + feed settings + policy + structure) with
 * content-v2 (posts + feed items). This layer owns NO data, never bypasses
 * domain policy, and imports ONLY each domain's public-api. Relational quota is
 * enforced here against content's backend count — never trusted from the client.
 */
import type {
  CommunitiesService,
  CommunityFeedSettingsDTO,
  CommunityFeedSettingsService,
  CommunityRole,
  CommunityStructureService,
  UpdateCommunityFeedSettingsInput,
} from "@server/domains-v2/communities-v2/public-api";
import {
  canPostRelational,
  canPostStaffOnly,
  canPostToCommunityAll,
  canPublishToDescendants,
  canViewCommunityAll,
  canViewRelational,
  canViewStaffOnly,
} from "@server/domains-v2/communities-v2/public-api";
import type {
  CommunityFeedItemDTO,
  CommunityFeedService,
  CommunityFeedType,
} from "@server/domains-v2/content-v2/public-api";
import { resolveDescendantTargets } from "./distribution";
import type {
  CommunityFeedErrorCode,
  CommunityFeedResult,
  CommunityFeedTabsStateDTO,
  ListCommunityFeedResult,
  PublishCommunityPostCommand,
  PublishCommunityPostValue,
} from "./types";

export type CommunityFeedsUseCaseDeps = {
  communities: CommunitiesService;
  feedSettings: CommunityFeedSettingsService;
  structure: CommunityStructureService;
  content: CommunityFeedService;
  clock: { now: () => Date };
  ids: { next: () => string };
};

export interface CommunityFeedsUseCase {
  publishCommunityPost(command: PublishCommunityPostCommand): Promise<CommunityFeedResult<PublishCommunityPostValue>>;
  listCommunityFeed(actorUserId: string, communityId: string, feedType: CommunityFeedType, cursor?: string | null, limit?: number): Promise<ListCommunityFeedResult>;
  getCommunityFeedTabsState(actorUserId: string, communityId: string): Promise<CommunityFeedResult<CommunityFeedTabsStateDTO>>;
  getCommunityFeedSettings(communityId: string): ReturnType<CommunityFeedSettingsService["getCommunityFeedSettings"]>;
  updateCommunityFeedSettings(input: UpdateCommunityFeedSettingsInput): ReturnType<CommunityFeedSettingsService["updateCommunityFeedSettings"]>;
}

type Deps = CommunityFeedsUseCaseDeps;
type Role = CommunityRole | null;

function fail<T>(code: CommunityFeedErrorCode, message: string): CommunityFeedResult<T> {
  return { ok: false, error: { code, message } };
}

async function loadRoleAndSettings(
  deps: Deps,
  communityId: string,
  actorUserId: string,
): Promise<CommunityFeedResult<{ role: Role; settings: CommunityFeedSettingsDTO }>> {
  const roleRes = await deps.communities.getViewerRole(communityId, actorUserId);
  if (!roleRes.ok) return fail("NOT_FOUND", "Community not found.");
  const settingsRes = await deps.feedSettings.getCommunityFeedSettings(communityId);
  if (!settingsRes.ok) return fail("NOT_FOUND", "Community not found.");
  return { ok: true, value: { role: roleRes.value, settings: settingsRes.value } };
}

function checkPosting(role: Role, settings: CommunityFeedSettingsDTO, feedType: CommunityFeedType): CommunityFeedResult<true> {
  if (feedType === "community_all") {
    if (!settings.communityAllEnabled) return fail("FEED_DISABLED", "Main feed is disabled.");
    return canPostToCommunityAll(role, settings) ? { ok: true, value: true } : fail("FORBIDDEN", "You cannot post to the main feed.");
  }
  if (feedType === "relational") {
    if (!settings.relationalEnabled) return fail("FEED_DISABLED", "Relational feed is disabled.");
    return canPostRelational(role, settings) ? { ok: true, value: true } : fail("FORBIDDEN", "You cannot post to the relational feed.");
  }
  if (!settings.staffOnlyEnabled) return fail("FEED_DISABLED", "Staff feed is disabled.");
  return canPostStaffOnly(role, settings) ? { ok: true, value: true } : fail("FORBIDDEN", "Only staff may post to the staff feed.");
}

function checkViewing(role: Role, settings: CommunityFeedSettingsDTO, feedType: CommunityFeedType): boolean {
  if (feedType === "community_all") return canViewCommunityAll(role, settings);
  if (feedType === "relational") return canViewRelational(role, settings);
  return canViewStaffOnly(role, settings);
}

async function resolveTargets(
  deps: Deps,
  command: PublishCommunityPostCommand,
  role: Role,
  settings: CommunityFeedSettingsDTO,
): Promise<CommunityFeedResult<string[]>> {
  if (command.scope === "current_community_only") return { ok: true, value: [] };
  if (command.feedType === "relational") return fail("RELATIONAL_NO_PROPAGATION", "Relational posts cannot be distributed down the structure.");
  if (!canPublishToDescendants(role, settings, command.feedType)) {
    return fail("FORBIDDEN", "You cannot publish to descendant communities.");
  }
  const structureRes = await deps.structure.getCommunityStructure(command.communityId, command.actorUserId);
  if (!structureRes.ok) return fail("NOT_FOUND", "Community structure not found.");
  return resolveDescendantTargets(structureRes.value, command.communityId, command.scope, command.selectedDescendantCommunityIds ?? []);
}

async function publishCommunityPost(deps: Deps, command: PublishCommunityPostCommand): Promise<CommunityFeedResult<PublishCommunityPostValue>> {
  if (!command.body || command.body.trim().length === 0) return fail("EMPTY_BODY", "Post body must not be empty.");
  const ctx = await loadRoleAndSettings(deps, command.communityId, command.actorUserId);
  if (!ctx.ok) return ctx;
  const { role, settings } = ctx.value;

  const posting = checkPosting(role, settings, command.feedType);
  if (!posting.ok) return posting;

  if (command.feedType === "relational") {
    if (command.scope !== "current_community_only") return fail("RELATIONAL_NO_PROPAGATION", "Relational posts cannot be distributed down the structure.");
    const monthKey = deps.clock.now().toISOString().slice(0, 7);
    const used = await deps.content.countRelationalForAuthorMonth({ communityId: command.communityId, authorUserId: command.actorUserId, monthKey });
    if (used >= settings.relationalMonthlyLimit) return fail("QUOTA_EXCEEDED", `Relational monthly limit (${settings.relationalMonthlyLimit}) reached.`);
  }

  const targets = await resolveTargets(deps, command, role, settings);
  if (!targets.ok) return targets;
  const distributionId = targets.value.length > 0 ? deps.ids.next() : null;

  const created = await deps.content.createCommunityPost({
    authorUserId: command.actorUserId, publishedByUserId: command.actorUserId, body: command.body,
    mediaRefs: command.mediaRefs, sourceCommunityId: command.communityId, feedType: command.feedType, distributionId,
  });
  if (!created.ok) return fail(created.error.code === "EMPTY_BODY" ? "EMPTY_BODY" : "INVALID_FEED_TYPE", created.error.message);

  let distributedCount = 0;
  const reachedTargets: string[] = [];
  for (const targetId of targets.value) {
    const dist = await deps.content.distributeCommunityPost({
      postId: created.value.post.id, authorUserId: command.actorUserId, publishedByUserId: command.actorUserId,
      body: command.body, mediaRefs: command.mediaRefs, targetCommunityId: targetId,
      feedType: command.feedType, sourceCommunityId: command.communityId, distributionId: distributionId as string,
    });
    if (dist.ok) {
      distributedCount += 1;
      reachedTargets.push(targetId);
    }
  }

  return {
    ok: true,
    value: {
      post: created.value.post,
      sourceItem: created.value.item,
      distributionId,
      distributedCount,
      targetCommunityIds: reachedTargets,
    },
  };
}

async function listCommunityFeed(deps: Deps, actorUserId: string, communityId: string, feedType: CommunityFeedType, cursor?: string | null, limit?: number): Promise<ListCommunityFeedResult> {
  const ctx = await loadRoleAndSettings(deps, communityId, actorUserId);
  if (!ctx.ok) return ctx;
  if (!checkViewing(ctx.value.role, ctx.value.settings, feedType)) {
    return fail("FORBIDDEN", "You cannot view this feed.");
  }
  const page = await deps.content.listCommunityFeed({ communityId, feedType, cursor, limit });
  return { ok: true, value: { items: page.items, nextCursor: page.nextCursor } };
}

async function getCommunityFeedTabsState(deps: Deps, actorUserId: string, communityId: string): Promise<CommunityFeedResult<CommunityFeedTabsStateDTO>> {
  const ctx = await loadRoleAndSettings(deps, communityId, actorUserId);
  if (!ctx.ok) return ctx;
  const { role, settings } = ctx.value;
  const monthKey = deps.clock.now().toISOString().slice(0, 7);
  const usedThisMonth = settings.relationalEnabled
    ? await deps.content.countRelationalForAuthorMonth({ communityId, authorUserId: actorUserId, monthKey })
    : 0;
  return {
    ok: true,
    value: {
      communityId,
      communityAll: { visible: canViewCommunityAll(role, settings), canPost: canPostToCommunityAll(role, settings) },
      relational: {
        visible: canViewRelational(role, settings),
        canPost: canPostRelational(role, settings) && usedThisMonth < settings.relationalMonthlyLimit,
        monthlyLimit: settings.relationalMonthlyLimit,
        usedThisMonth,
        remaining: Math.max(0, settings.relationalMonthlyLimit - usedThisMonth),
      },
      staffOnly: { visible: canViewStaffOnly(role, settings), canPost: canPostStaffOnly(role, settings) },
      canPublishToDescendants:
        canPublishToDescendants(role, settings, "community_all") || canPublishToDescendants(role, settings, "staff_only"),
    },
  };
}

export function createCommunityFeedsUseCase(deps: Deps): CommunityFeedsUseCase {
  return {
    publishCommunityPost: (command) => publishCommunityPost(deps, command),
    listCommunityFeed: (actorUserId, communityId, feedType, cursor, limit) =>
      listCommunityFeed(deps, actorUserId, communityId, feedType, cursor, limit),
    getCommunityFeedTabsState: (actorUserId, communityId) => getCommunityFeedTabsState(deps, actorUserId, communityId),
    getCommunityFeedSettings: (communityId) => deps.feedSettings.getCommunityFeedSettings(communityId),
    updateCommunityFeedSettings: (input) => deps.feedSettings.updateCommunityFeedSettings(input),
  };
}

export type { CommunityFeedItemDTO };
