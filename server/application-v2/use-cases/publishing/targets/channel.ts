/**
 * application-v2/use-cases/publishing/targets/channel — Slice 17.
 *
 * Routes a unified publishing command to the existing channel-content
 * use-case. The underlying use-case checks lead permissions
 * (`canPublishChannelContent`); we never re-implement that policy.
 */
import type {
  ChannelContentUseCase,
  CreateChannelPostCommand,
} from "../../channel-content/public-api";
import type {
  PublishingCommand,
  PublishingErrorCode,
  PublishingRequestContext,
  PublishingResult,
} from "../contracts";
import { buildEmptyFeedEffects } from "../contracts";

export interface PublishToChannelDeps {
  readonly channelContent: ChannelContentUseCase;
}

export async function publishToChannel(
  deps: PublishToChannelDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  if (command.targetType !== "channel") {
    return errorResult("UNSUPPORTED_TARGET", "Niezgodny typ targetu publikacji.");
  }
  if (!command.targetId) {
    return errorResult("TARGET_NOT_FOUND", "Brak identyfikatora kanału.");
  }
  if (command.body.trim().length === 0) {
    return errorResult("EMPTY_BODY", "Treść wpisu nie może być pusta.");
  }
  const cmd: CreateChannelPostCommand = {
    channelId: command.targetId,
    actorUserId: ctx.viewerUserId,
    body: command.body,
    mediaRefs: command.mediaRefs?.map((m) => m.refId),
  };
  const res = await deps.channelContent.createChannelPost(cmd);
  if (!res.ok) {
    return errorResult(mapErrorCode(res.error.code), res.error.message);
  }
  return {
    status: "published",
    publishedEntity: {
      domain: "content-v2",
      entityType: "channel_post",
      entityId: res.value.id,
      routeTarget: `/channels/${command.targetId}`,
    },
    feedEffects: buildEmptyFeedEffects({ noFeedEffect: false }),
    warnings: [],
    errors: [],
  };
}

function mapErrorCode(code: string): PublishingErrorCode {
  switch (code) {
    case "EMPTY_BODY":
      return "EMPTY_BODY";
    case "BODY_TOO_LONG":
      return "TARGET_NOT_ALLOWED";
    case "FORBIDDEN":
      return "PERMISSION_DENIED";
    case "NOT_FOUND":
      return "TARGET_NOT_FOUND";
    case "DEACTIVATED":
      return "TARGET_NOT_ALLOWED";
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
