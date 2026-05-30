import type { PublishingAdapter, PublishingCommandUi, PublishingPreviewUi, PublishingResultUi, PublishingTargetDefinitionUi } from "../publishing";
import { channelsMockAdapter } from "./channels-mock-adapter";

function resultError(message: string): PublishingResultUi {
  return {
    status: "blocked",
    publishedEntity: null,
    feedEffects: { createdFriendFeedItem: false, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: true },
    warnings: [],
    errors: [{ code: "INTERNAL_ERROR", message }],
  };
}

export function channelPublishingTarget(channelSlug: string, channelName: string, canPublish: boolean): PublishingTargetDefinitionUi {
  return {
    targetType: "channel",
    targetId: channelSlug,
    label: `Kanał: ${channelName}`,
    description: "Publikacja pojawi się na feedzie kanału.",
    allowedContentTypes: ["channel_post"],
    allowedMediaTypes: ["image", "video", "document", "link"],
    visibilityOptions: ["channel_followers"],
    defaultVisibility: "channel_followers",
    maxBodyLength: 8000,
    maxMediaCount: 8,
    permissionsRequired: ["publish_channel_content"],
    status: canPublish ? "available" : "blocked",
    blockedReason: canPublish ? undefined : "channel_not_a_lead",
    routeTarget: `/channels/${channelSlug}`,
  };
}

export function createChannelPublishingAdapter(target: PublishingTargetDefinitionUi): PublishingAdapter {
  return {
    async listAvailableTargets() {
      return [target];
    },
    async buildPreview(_viewerUserId, command: PublishingCommandUi): Promise<PublishingPreviewUi> {
      return {
        targetType: "channel",
        targetId: target.targetId,
        targetLabel: target.label,
        contentPreview: command.body.slice(0, 400),
        mediaPreviewRefs: command.mediaRefs ?? [],
        visibilityLabel: "Obserwujący kanał",
        expectedDestinations: target.routeTarget ? [target.routeTarget] : [],
        warnings: target.status === "available" ? [] : ["Tylko prowadzący kanał mogą publikować."],
        disabledReason: target.blockedReason,
      };
    },
    async publish(_viewerUserId, command) {
      if (!target.targetId) return resultError("Brak kanału docelowego.");
      const res = await channelsMockAdapter.createChannelPost({
        channelSlug: target.targetId,
        body: command.body,
        mediaRefs: command.mediaRefs?.map((m) => m.refId),
      });
      if (!res.ok) return resultError(res.error.message);
      return {
        status: "published",
        publishedEntity: {
          domain: "content-v2",
          entityType: "channel_post",
          entityId: res.value.id,
          routeTarget: `/channels/${target.targetId}`,
        },
        feedEffects: { createdFriendFeedItem: false, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: true },
        warnings: [],
        errors: [],
      };
    },
  };
}
