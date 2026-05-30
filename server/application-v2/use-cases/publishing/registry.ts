/**
 * application-v2/use-cases/publishing — Target Publishing Registry (Slice 17).
 *
 * Returns the list of publishing targets the viewer *could* attempt to publish
 * to, with per-target permission/availability already resolved from the
 * source-of-truth domains (communities-v2 / channels / identity/workplaces).
 * The registry never publishes — it only enumerates.
 *
 * The UI's `TargetSelector` uses this directly to render the picker. A
 * disabled/partial/blocked target stays visible WITH a truthful
 * `blockedReason` so we don't pretend a target exists when it does not.
 */
import type {
  CommunitiesService,
  CommunityFeedSettingsService,
  CommunityFeedSettingsDTO,
  CommunityPublicDTO,
  CommunityRole,
} from "@server/domains-v2/communities-v2/public-api";
import {
  canPostRelational,
  canPostStaffOnly,
  canPostToCommunityAll,
} from "@server/domains-v2/communities-v2/public-api";
import type { ChannelsService, ChannelPublicDTO } from "@server/domains-v2/channels/public-api";
import { canPublishChannelContent } from "@server/domains-v2/channels/public-api";
import type { WorkplacesService } from "@server/domains-v2/identity/workplaces/public-api";
import type {
  PublishingTargetDefinition,
  PublishingMediaType,
  PublishingRequestContext,
} from "./contracts";
import { PUBLISHING_LIMITS } from "./contracts";

const ALL_MEDIA: readonly PublishingMediaType[] = ["image", "video", "document", "link"];

export interface PublishingTargetRegistryDeps {
  readonly communities: CommunitiesService;
  readonly feedSettings: CommunityFeedSettingsService;
  readonly channels: ChannelsService;
  readonly workplaces: WorkplacesService;
}

export interface PublishingTargetRegistry {
  /**
   * Returns every target the viewer can see, available + disabled (with
   * truthful reason). Order is stable: personal feed first, then
   * communities the viewer belongs to, then channels they lead, then
   * workplaces they own, then profile-scoped targets.
   */
  getAvailablePublishingTargets(ctx: PublishingRequestContext): Promise<readonly PublishingTargetDefinition[]>;
}

export function createPublishingTargetRegistry(deps: PublishingTargetRegistryDeps): PublishingTargetRegistry {
  return {
    async getAvailablePublishingTargets(ctx) {
      const items: PublishingTargetDefinition[] = [];
      items.push(buildFriendFeedTarget(ctx));
      items.push(...(await buildCommunityTargets(deps, ctx)));
      items.push(...(await buildChannelTargets(deps, ctx)));
      items.push(...(await buildWorkplaceTargets(deps, ctx)));
      items.push(buildImportantEventTarget(ctx));
      items.push(buildProfilePresentationTarget(ctx));
      return items;
    },
  };
}

function buildFriendFeedTarget(ctx: PublishingRequestContext): PublishingTargetDefinition {
  const limits = PUBLISHING_LIMITS.friend_feed;
  return {
    targetType: "friend_feed",
    targetId: ctx.viewerUserId,
    ownerType: "user",
    label: "Twój feed znajomych",
    description: "Publikacja widoczna dla znajomych z Twojej sieci.",
    allowedContentTypes: ["text_post", "media_post"],
    allowedMediaTypes: ALL_MEDIA,
    visibilityOptions: ["friends_only", "public", "private"],
    defaultVisibility: "friends_only",
    maxBodyLength: limits.maxBodyLength,
    maxMediaCount: limits.maxMediaCount,
    permissionsRequired: [],
    status: "available",
    routeTarget: "/friends-feed",
  };
}

async function buildCommunityTargets(
  deps: PublishingTargetRegistryDeps,
  ctx: PublishingRequestContext,
): Promise<readonly PublishingTargetDefinition[]> {
  const result: PublishingTargetDefinition[] = [];
  const myCommunities: readonly CommunityPublicDTO[] = await deps.communities.listMyCommunities(ctx.viewerUserId);
  for (const community of myCommunities) {
    const settingsRes = await deps.feedSettings.getCommunityFeedSettings(community.id);
    if (!settingsRes.ok) continue;
    const settings: CommunityFeedSettingsDTO = settingsRes.value;
    const roleRes = await deps.communities.getViewerRole(community.id, ctx.viewerUserId);
    const role: CommunityRole | null = roleRes.ok ? roleRes.value : null;

    result.push(makeCommunityTarget("community_feed", community.id, community.name, settings.communityAllEnabled, canPostToCommunityAll(role, settings)));
    result.push(makeCommunityTarget("community_staff_feed", community.id, community.name, settings.staffOnlyEnabled, canPostStaffOnly(role, settings)));
    result.push(makeCommunityTarget("community_relational_feed", community.id, community.name, settings.relationalEnabled, canPostRelational(role, settings)));
  }
  return result;
}

function makeCommunityTarget(
  targetType: "community_feed" | "community_staff_feed" | "community_relational_feed",
  communityId: string,
  baseLabel: string,
  feedEnabled: boolean,
  canPost: boolean,
): PublishingTargetDefinition {
  const limits = PUBLISHING_LIMITS[targetType];
  const labels: Record<typeof targetType, string> = {
    community_feed: `${baseLabel} · Feed społeczności`,
    community_staff_feed: `${baseLabel} · Feed kadry`,
    community_relational_feed: `${baseLabel} · Feed relacyjny`,
  };
  const visibility = targetType === "community_staff_feed"
    ? "community_staff"
    : targetType === "community_relational_feed"
    ? "community_relational"
    : "community_all";
  const status: PublishingTargetDefinition["status"] = !feedEnabled
    ? "disabled"
    : canPost
    ? "available"
    : "blocked";
  return {
    targetType,
    targetId: communityId,
    ownerType: "community",
    label: labels[targetType],
    description: descriptionFor(targetType),
    allowedContentTypes: ["text_post", "media_post", "community_post"],
    allowedMediaTypes: ALL_MEDIA,
    visibilityOptions: [visibility],
    defaultVisibility: visibility,
    maxBodyLength: limits.maxBodyLength,
    maxMediaCount: limits.maxMediaCount,
    permissionsRequired: targetType === "community_staff_feed" ? ["community_staff"] : [],
    status,
    blockedReason: !feedEnabled
      ? "feed_disabled_for_community"
      : !canPost
      ? "permission_denied"
      : undefined,
    routeTarget: `/communities/${communityId}/${segmentFor(targetType)}`,
  };
}

function descriptionFor(t: "community_feed" | "community_staff_feed" | "community_relational_feed"): string {
  if (t === "community_feed") return "Wpis widoczny dla całej społeczności.";
  if (t === "community_staff_feed") return "Wpis widoczny tylko dla kadry społeczności.";
  return "Wpis relacyjny — z miesięcznym limitem.";
}

function segmentFor(t: "community_feed" | "community_staff_feed" | "community_relational_feed"): string {
  if (t === "community_feed") return "feed";
  if (t === "community_staff_feed") return "staff-feed";
  return "relational-feed";
}

async function buildChannelTargets(
  deps: PublishingTargetRegistryDeps,
  ctx: PublishingRequestContext,
): Promise<readonly PublishingTargetDefinition[]> {
  const result: PublishingTargetDefinition[] = [];
  const ledChannels: readonly ChannelPublicDTO[] = await deps.channels.listLedByUser(ctx.viewerUserId);
  for (const c of ledChannels) {
    const leadsRes = await deps.channels.listChannelLeads(c.id);
    const perms = leadsRes.ok
      ? leadsRes.value.find((l) => l.userId === ctx.viewerUserId && l.status === "active")?.permissions ?? []
      : [];
    const canPublish = canPublishChannelContent(perms);
    const limits = PUBLISHING_LIMITS.channel;
    result.push({
      targetType: "channel",
      targetId: c.id,
      ownerType: "channel",
      label: `Kanał: ${c.name}`,
      description: "Wpis kanału — widoczny dla obserwujących.",
      allowedContentTypes: ["text_post", "media_post", "channel_post"],
      allowedMediaTypes: ALL_MEDIA,
      visibilityOptions: ["channel_followers"],
      defaultVisibility: "channel_followers",
      maxBodyLength: limits.maxBodyLength,
      maxMediaCount: limits.maxMediaCount,
      permissionsRequired: ["publish_channel_content"],
      status: canPublish ? "available" : "blocked",
      blockedReason: canPublish ? undefined : "channel_not_a_lead",
      routeTarget: `/channels/${c.slug ?? c.id}`,
    });
  }
  return result;
}

async function buildWorkplaceTargets(
  deps: PublishingTargetRegistryDeps,
  ctx: PublishingRequestContext,
): Promise<readonly PublishingTargetDefinition[]> {
  const result: PublishingTargetDefinition[] = [];
  const res = await deps.workplaces.listWorkplacesForOwner({
    ownerUserId: ctx.viewerUserId,
    viewerUserId: ctx.viewerUserId,
  });
  if (!res.ok) return result;
  const limits = PUBLISHING_LIMITS.workplace;
  for (const wp of res.value) {
    if (wp.status !== "active") continue;
    result.push({
      targetType: "workplace",
      targetId: wp.id,
      ownerType: "workplace",
      label: `Miejsce pracy: ${wp.name}`,
      description: "Wpis miejsca pracy — pełny post zostaje na stronie miejsca, na feedzie znajomych pojawia się zajawka.",
      allowedContentTypes: ["text_post", "media_post", "workplace_update"],
      allowedMediaTypes: ALL_MEDIA,
      visibilityOptions: ["workplace_public", "workplace_friends_only", "workplace_private"],
      defaultVisibility: "workplace_public",
      maxBodyLength: limits.maxBodyLength,
      maxMediaCount: limits.maxMediaCount,
      permissionsRequired: ["workplace_owner"],
      status: "available",
      routeTarget: `/workplace/${wp.slug ?? wp.id}`,
    });
  }
  return result;
}

function buildImportantEventTarget(ctx: PublishingRequestContext): PublishingTargetDefinition {
  const limits = PUBLISHING_LIMITS.important_event;
  return {
    targetType: "important_event",
    targetId: ctx.viewerUserId,
    ownerType: "profile",
    label: "Ważne wydarzenie",
    description: "Specjalna karta na profilu — tytuł, data i opis.",
    allowedContentTypes: ["important_event"],
    allowedMediaTypes: ["image", "link"],
    visibilityOptions: ["public", "friends_only", "private"],
    defaultVisibility: "public",
    maxBodyLength: limits.maxBodyLength,
    maxMediaCount: limits.maxMediaCount,
    permissionsRequired: ["profile_owner"],
    status: "partial",
    blockedReason: "backend_not_ready_v2",
    routeTarget: "/profile/me/important-events",
  };
}

function buildProfilePresentationTarget(ctx: PublishingRequestContext): PublishingTargetDefinition {
  const limits = PUBLISHING_LIMITS.profile_presentation;
  return {
    targetType: "profile_presentation",
    targetId: ctx.viewerUserId,
    ownerType: "profile",
    label: "Prezentacja profilu",
    description: "Edytorska sekcja na profilu — opis, media, widoczność.",
    allowedContentTypes: ["profile_presentation_item"],
    allowedMediaTypes: ["image", "video", "document", "link"],
    visibilityOptions: ["public", "friends_only", "private", "profile_owner_chosen"],
    defaultVisibility: "public",
    maxBodyLength: limits.maxBodyLength,
    maxMediaCount: limits.maxMediaCount,
    permissionsRequired: ["profile_owner"],
    status: "partial",
    blockedReason: "backend_not_ready_v2",
    routeTarget: "/profile/me/presentation",
  };
}
