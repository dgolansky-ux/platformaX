import type { PublishingAdapter, PublishingCommandUi, PublishingPreviewUi, PublishingResultUi, PublishingTargetDefinitionUi } from "../publishing";
import { friendFeedMockAdapter } from "./mock-adapter";
import type { FriendFeedComposerStateUi, FriendFeedVisibility } from "./types";

const TARGET_ID = "friend-feed";

function visibilityOptions(state: FriendFeedComposerStateUi): readonly FriendFeedVisibility[] {
  return state.supportedVisibilities;
}

function targetFromState(state: FriendFeedComposerStateUi): PublishingTargetDefinitionUi {
  return {
    targetType: "friend_feed",
    targetId: TARGET_ID,
    label: "Twój feed znajomych",
    description: state.disabledReason === "no_friends"
      ? "Dodaj znajomych, aby Twoje wpisy ich osiągnęły."
      : "Publikacja widoczna zgodnie z wybraną widocznością.",
    allowedContentTypes: ["text_post", "media_post"],
    allowedMediaTypes: ["image", "video", "document", "link"],
    visibilityOptions: visibilityOptions(state),
    defaultVisibility: state.defaultVisibility,
    maxBodyLength: 4000,
    maxMediaCount: 4,
    permissionsRequired: [],
    status: state.canPublish && state.disabledReason !== "transport_not_ready" ? "available" : "disabled",
    blockedReason: state.disabledReason === "transport_not_ready" ? "backend_not_ready_v2" : undefined,
    routeTarget: "/friends-feed",
  };
}

function resultError(message: string): PublishingResultUi {
  return {
    status: "blocked",
    publishedEntity: null,
    feedEffects: { createdFriendFeedItem: false, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: true },
    warnings: [],
    errors: [{ code: "INTERNAL_ERROR", message }],
  };
}

export function createFriendFeedPublishingAdapter(): PublishingAdapter {
  return {
    async listAvailableTargets(viewerUserId) {
      const state = await friendFeedMockAdapter.getComposerState(viewerUserId);
      if (!state.ok) throw new Error(state.error.message);
      return [targetFromState(state.value)];
    },
    async buildPreview(viewerUserId, command: PublishingCommandUi): Promise<PublishingPreviewUi> {
      const targets = await this.listAvailableTargets(viewerUserId);
      const target = targets[0];
      return {
        targetType: "friend_feed",
        targetId: target.targetId,
        targetLabel: target.label,
        contentPreview: command.body.slice(0, 400),
        mediaPreviewRefs: command.mediaRefs ?? [],
        visibilityLabel: command.visibility === "public" ? "Publiczne" : command.visibility === "private" ? "Prywatne" : "Tylko znajomi",
        expectedDestinations: ["/friends-feed"],
        warnings: target.status === "available" ? [] : [target.description],
        disabledReason: target.blockedReason,
      };
    },
    async publish(viewerUserId, command) {
      const visibility = command.visibility;
      if (visibility !== "friends_only" && visibility !== "private" && visibility !== "public") {
        return resultError("Widoczność nie jest obsługiwana przez feed znajomych.");
      }
      const res = await friendFeedMockAdapter.createPost({
        viewerUserId,
        body: command.body,
        visibility,
      });
      if (!res.ok) return resultError(res.error.message);
      return {
        status: "published",
        publishedEntity: {
          domain: "content-v2",
          entityType: "friend_feed_post",
          entityId: res.value.postId,
          routeTarget: "/friends-feed",
        },
        feedEffects: { createdFriendFeedItem: true, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: false },
        warnings: [],
        errors: [],
      };
    },
  };
}
