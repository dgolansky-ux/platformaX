/**
 * application-v2/use-cases/publishing/targets/community-feed — Slice 17.
 *
 * Routes a unified publishing command to the existing community-feeds
 * use-case. Three target types map to the same backend
 * (`publishCommunityPost`) with a different `feedType`. Descendant publishing
 * stays on the underlying use-case; this layer never re-implements quota /
 * staff / relational policy.
 */
import type { CommunityFeedsUseCase } from "../../community-feeds/public-api";
import type {
  PublishCommunityPostCommand,
  PublishScope,
} from "../../community-feeds/public-api";
import type { CommunityFeedType } from "@server/domains-v2/content-v2/public-api";
import type {
  PublishingCommand,
  PublishingErrorCode,
  PublishingRequestContext,
  PublishingResult,
  PublishingTargetType,
} from "../contracts";
import { buildEmptyFeedEffects } from "../contracts";

export interface PublishToCommunityFeedDeps {
  readonly communityFeeds: CommunityFeedsUseCase;
}

export async function publishToCommunityFeed(
  deps: PublishToCommunityFeedDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  return runCommunityPublish(deps, ctx, command, "community_feed");
}

export async function publishToCommunityStaffFeed(
  deps: PublishToCommunityFeedDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  return runCommunityPublish(deps, ctx, command, "community_staff_feed");
}

export async function publishToCommunityRelationalFeed(
  deps: PublishToCommunityFeedDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  return runCommunityPublish(deps, ctx, command, "community_relational_feed");
}

async function runCommunityPublish(
  deps: PublishToCommunityFeedDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
  expected: PublishingTargetType,
): Promise<PublishingResult> {
  if (command.targetType !== expected) {
    return errorResult("UNSUPPORTED_TARGET", "Niezgodny typ targetu publikacji.");
  }
  if (!command.targetId) {
    return errorResult("TARGET_NOT_FOUND", "Brak identyfikatora społeczności.");
  }
  if (command.body.trim().length === 0) {
    return errorResult("EMPTY_BODY", "Treść posta nie może być pusta.");
  }
  const feedType = mapFeedType(expected);
  const scope = mapScope(command);
  const descendantIds = extractDescendantIds(command);

  const cmd: PublishCommunityPostCommand = {
    actorUserId: ctx.viewerUserId,
    communityId: command.targetId,
    feedType,
    body: command.body,
    mediaRefs: command.mediaRefs?.map((m) => m.refId),
    scope,
    selectedDescendantCommunityIds: descendantIds,
  };
  const res = await deps.communityFeeds.publishCommunityPost(cmd);
  if (!res.ok) {
    return errorResult(mapErrorCode(res.error.code), res.error.message);
  }
  return {
    status: "published",
    publishedEntity: {
      domain: "content-v2",
      entityType: "community_post",
      entityId: res.value.post.id,
      routeTarget: `/communities/${command.targetId}/${segmentFor(expected)}`,
    },
    feedEffects: buildEmptyFeedEffects({
      createdFriendFeedItem: false,
      createdTeaser: false,
      noFeedEffect: false,
    }),
    warnings: res.value.distributedCount > 0
      ? [`Rozdystrybuowano do ${res.value.distributedCount} pod-społeczności.`]
      : [],
    errors: [],
  };
}

function mapFeedType(t: PublishingTargetType): CommunityFeedType {
  if (t === "community_staff_feed") return "staff_only";
  if (t === "community_relational_feed") return "relational";
  return "community_all";
}

function segmentFor(t: PublishingTargetType): string {
  if (t === "community_staff_feed") return "staff-feed";
  if (t === "community_relational_feed") return "relational-feed";
  return "feed";
}

function mapScope(command: PublishingCommand): PublishScope {
  const raw = command.metadata?.publishScope;
  if (raw === "direct_children" || raw === "selected_descendants" || raw === "all_descendants") {
    return raw;
  }
  return "current_community_only";
}

function extractDescendantIds(command: PublishingCommand): readonly string[] {
  const raw = command.metadata?.selectedDescendantCommunityIds;
  if (typeof raw !== "string" || raw.length === 0) return [];
  return raw.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
}

function mapErrorCode(code: string): PublishingErrorCode {
  switch (code) {
    case "EMPTY_BODY":
      return "EMPTY_BODY";
    case "FORBIDDEN":
      return "PERMISSION_DENIED";
    case "FEED_DISABLED":
      return "TARGET_NOT_ALLOWED";
    case "QUOTA_EXCEEDED":
      return "QUOTA_EXCEEDED";
    case "RELATIONAL_NO_PROPAGATION":
    case "TARGET_NOT_DESCENDANT":
    case "TARGET_INACTIVE":
    case "TOO_MANY_TARGETS_REQUIRES_ASYNC_DISTRIBUTION":
    case "INVALID_FEED_TYPE":
      return "TARGET_NOT_ALLOWED";
    case "NOT_FOUND":
      return "TARGET_NOT_FOUND";
    default:
      return "INTERNAL_ERROR";
  }
}

function errorResult(code: PublishingErrorCode, message: string): PublishingResult {
  return {
    status: "blocked",
    publishedEntity: null,
    feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
    warnings: [],
    errors: [{ code, message }],
  };
}
