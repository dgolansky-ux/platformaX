/**
 * application-v2/use-cases/publishing/targets/friend-feed — Slice 17 target.
 *
 * Thin orchestrator on top of the existing `FriendFeedUseCaseV2`. The
 * publishing dispatcher routes `targetType === "friend_feed"` here; the
 * actual record still lives in `content-v2/friend-posts`.
 *
 * No god-service: this file does nothing the friend-feed use-case can't
 * already do — its job is only to translate the unified `PublishingCommand`
 * into the friend-feed-specific call and to package the response into the
 * unified `PublishingResult` envelope.
 */
import type { FriendFeedUseCaseV2 } from "../../friend-feed/public-api";
import type { FriendPostVisibility } from "@server/domains-v2/content-v2/public-api";
import type {
  PublishingCommand,
  PublishingRequestContext,
  PublishingResult,
} from "../contracts";
import { buildEmptyFeedEffects } from "../contracts";

export interface PublishToFriendFeedDeps {
  readonly friendFeed: FriendFeedUseCaseV2;
}

export async function publishToFriendFeed(
  deps: PublishToFriendFeedDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  if (command.body.trim().length === 0) {
    return {
      status: "blocked",
      publishedEntity: null,
      feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
      warnings: [],
      errors: [{ code: "EMPTY_BODY", message: "Treść posta nie może być pusta." }],
    };
  }
  const visibility = mapVisibility(command);
  const res = await deps.friendFeed.createFriendFeedPost({
    viewerUserId: ctx.viewerUserId,
    body: command.body,
    mediaRefs: command.mediaRefs?.map((m) => m.refId),
    visibility,
  });
  if (!res.ok) {
    return {
      status: "blocked",
      publishedEntity: null,
      feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
      warnings: [],
      errors: [{ code: "PERMISSION_DENIED", message: res.error.message }],
    };
  }
  return {
    status: "published",
    publishedEntity: {
      domain: "content-v2",
      entityType: "friend_post",
      entityId: res.value.id,
      routeTarget: "/friends-feed",
    },
    feedEffects: buildEmptyFeedEffects({ createdFriendFeedItem: true }),
    warnings: [],
    errors: [],
  };
}

function mapVisibility(command: PublishingCommand): FriendPostVisibility {
  if (command.visibility === "public") return "public";
  if (command.visibility === "private") return "private";
  return "friends_only";
}
