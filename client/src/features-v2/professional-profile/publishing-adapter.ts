import type { PublishingAdapter, PublishingCommandUi, PublishingPreviewUi, PublishingResultUi, PublishingTargetDefinitionUi } from "../publishing";
import { professionalProfileMockAdapter } from "./mock-adapter";
import type { WorkplacePostVisibilityUi } from "./types";

function resultError(message: string): PublishingResultUi {
  return {
    status: "blocked",
    publishedEntity: null,
    feedEffects: { createdFriendFeedItem: false, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: true },
    warnings: [],
    errors: [{ code: "INTERNAL_ERROR", message }],
  };
}

export function workplacePublishingTarget(workplaceId: string, workplaceName: string, canPublish: boolean): PublishingTargetDefinitionUi {
  return {
    targetType: "workplace",
    targetId: workplaceId,
    label: `Miejsce pracy: ${workplaceName}`,
    description: "Pełny wpis pojawi się na stronie miejsca pracy, a teaser na feedzie znajomych.",
    allowedContentTypes: ["workplace_update"],
    allowedMediaTypes: ["image", "video", "document", "link"],
    visibilityOptions: ["workplace_public", "workplace_friends_only", "workplace_private"],
    defaultVisibility: "workplace_public",
    maxBodyLength: 6000,
    maxMediaCount: 6,
    permissionsRequired: ["workplace_owner"],
    status: canPublish ? "available" : "blocked",
    blockedReason: canPublish ? undefined : "workplace_not_owner",
    routeTarget: `/workplace/${workplaceId}`,
  };
}

function toWorkplaceVisibility(visibility: PublishingCommandUi["visibility"]): WorkplacePostVisibilityUi | null {
  if (visibility === "workplace_public") return "workplace_public";
  if (visibility === "workplace_friends_only") return "friends_only";
  if (visibility === "workplace_private") return "private";
  return null;
}

export function createWorkplacePublishingAdapter(viewerUserId: string, target: PublishingTargetDefinitionUi): PublishingAdapter {
  return {
    async listAvailableTargets() {
      return [target];
    },
    async buildPreview(_viewerUserId, command: PublishingCommandUi): Promise<PublishingPreviewUi> {
      return {
        targetType: "workplace",
        targetId: target.targetId,
        targetLabel: target.label,
        contentPreview: command.body.slice(0, 400),
        mediaPreviewRefs: command.mediaRefs ?? [],
        visibilityLabel: command.visibility,
        expectedDestinations: target.routeTarget ? [target.routeTarget, "/friends-feed"] : ["/friends-feed"],
        warnings: ["Po publikacji zostanie utworzona zajawka na feedzie znajomych."],
        disabledReason: target.blockedReason,
      };
    },
    async publish(_viewerUserId, command) {
      if (!target.targetId) return resultError("Brak miejsca pracy docelowego.");
      const visibility = toWorkplaceVisibility(command.visibility);
      if (!visibility) return resultError("Widoczność nie jest obsługiwana przez mikro-feed miejsca pracy.");
      const res = await professionalProfileMockAdapter.createPost({
        viewerUserId,
        workplaceId: target.targetId,
        body: command.body,
        postType: "update",
        visibility,
      });
      if (!res.ok) return resultError(res.error.message);
      return {
        status: "published",
        publishedEntity: {
          domain: "content-v2",
          entityType: "workplace_post",
          entityId: res.value.post.id,
          routeTarget: `/workplace/${target.targetId}`,
        },
        feedEffects: { createdFriendFeedItem: false, createdTeaser: true, createdNotificationEvent: false, noFeedEffect: false },
        warnings: [],
        errors: [],
      };
    },
  };
}
