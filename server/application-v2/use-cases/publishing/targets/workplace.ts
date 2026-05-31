/**
 * application-v2/use-cases/publishing/targets/workplace — Slice 17.
 *
 * Routes a unified publishing command to the existing workplace-feed
 * use-case. The underlying use-case creates both the workplace post AND a
 * friend-feed teaser (visibility-permitting). We never re-implement the
 * teaser logic here.
 */
import type {
  WorkplaceFeedUseCaseV2,
} from "../../workplace-feed/public-api";
import type {
  CreateWorkplacePostCommand,
  WorkplacePostVisibility,
} from "@server/domains-v2/content-v2/public-api";
import type {
  PublishingCommand,
  PublishingErrorCode,
  PublishingRequestContext,
  PublishingResult,
} from "../contracts";
import { buildEmptyFeedEffects } from "../contracts";

export interface PublishToWorkplaceDeps {
  readonly workplaceFeed: WorkplaceFeedUseCaseV2;
}

export async function publishToWorkplace(
  deps: PublishToWorkplaceDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  if (command.targetType !== "workplace") {
    return errorResult("UNSUPPORTED_TARGET", "Niezgodny typ targetu publikacji.");
  }
  if (!command.targetId) {
    return errorResult("TARGET_NOT_FOUND", "Brak identyfikatora miejsca pracy.");
  }
  if (command.body.trim().length === 0) {
    return errorResult("EMPTY_BODY", "Treść wpisu nie może być pusta.");
  }
  const visibility = mapVisibility(command);
  const postType = mapPostType(command);
  const res = await deps.workplaceFeed.createWorkplacePostWithFriendFeedTeaser({
    viewerUserId: ctx.viewerUserId,
    workplaceId: command.targetId,
    body: command.body,
    mediaRefs: command.mediaRefs?.map((m) => m.refId),
    postType,
    visibility,
  });
  if (!res.ok) {
    return errorResult(mapErrorCode(res.error.code), res.error.message);
  }
  const value = res.value;
  return {
    status: "published",
    publishedEntity: {
      domain: "content-v2",
      entityType: "workplace_post",
      entityId: value.post.post.id,
      routeTarget: `/workplace/${command.targetId}`,
    },
    feedEffects: buildEmptyFeedEffects({
      createdTeaser: value.teaserCreated,
      createdFriendFeedItem: false,
    }),
    warnings: [],
    errors: [],
  };
}

function mapVisibility(command: PublishingCommand): WorkplacePostVisibility | undefined {
  switch (command.visibility) {
    case "workplace_public":
      return "workplace_public";
    case "workplace_friends_only":
      return "friends_only";
    case "workplace_private":
      return "private";
    default:
      return undefined;
  }
}

function mapPostType(command: PublishingCommand): CreateWorkplacePostCommand["postType"] | undefined {
  const raw = command.metadata?.workplacePostType;
  if (
    raw === "update" ||
    raw === "realization" ||
    raw === "offer" ||
    raw === "photo_note" ||
    raw === "announcement"
  ) {
    return raw;
  }
  return undefined;
}

function mapErrorCode(code: string): PublishingErrorCode {
  switch (code) {
    case "EMPTY_BODY":
      return "EMPTY_BODY";
    case "FORBIDDEN":
      return "PERMISSION_DENIED";
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
