import type { CommunityFeedItemDTO } from "@shared/contracts/community-feeds";
import type { PostDisplayViewModel } from "../../content-display";

export function communityFeedItemToDisplay(item: CommunityFeedItemDTO, canComment: boolean, canReact: boolean): PostDisplayViewModel {
  const displayType = item.feedType === "staff_only"
    ? "staff_post"
    : item.feedType === "relational"
      ? "relational_post"
      : "community_post";
  const visibility = item.feedType === "staff_only"
    ? "community_staff"
    : item.feedType === "relational"
      ? "community_relational"
      : "community_all";
  return {
    id: item.id,
    displayType,
    author: {
      userId: item.authorUserId,
      displayName: item.authorDisplayName,
      handle: null,
      avatarRef: null,
    },
    sourceContext: {
      sourceLabel: item.sourceCommunityName ?? "Społeczność",
    },
    title: null,
    bodyPreview: item.body,
    bodyFull: item.body,
    mediaRefs: item.mediaRefs.map((refId) => ({ refId, mediaType: "image" as const })),
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    badges: item.isDistributed && item.sourceCommunityName
      ? [{ label: `Opublikowano z: ${item.sourceCommunityName}`, tone: "info" }]
      : [],
    visibility,
    routeTarget: `/communities/${item.communityId}/feed`,
    interactionSummary: {
      likeCount: 0,
      commentCount: 0,
      viewerLiked: false,
      viewerCanReact: canReact,
      viewerCanComment: canComment,
    },
    actions: { showReact: true, showComment: true, showShare: false, showOpen: false },
    status: "published",
  };
}
