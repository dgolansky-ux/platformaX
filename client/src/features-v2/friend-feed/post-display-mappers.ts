import type { PostDisplayViewModel } from "../content-display";
import type { FriendFeedItemUi, FriendFeedWorkplaceTeaserItemUi } from "./types";

function mediaRefs(refs: readonly string[]) {
  return refs.map((refId) => ({ refId, mediaType: "image" as const }));
}

export function friendFeedItemToPostDisplay(item: FriendFeedItemUi): PostDisplayViewModel {
  return {
    id: item.postId,
    displayType: "friend_post",
    author: item.author,
    sourceContext: { sourceLabel: "Feed znajomych", sourceHref: "/friends-feed" },
    title: null,
    bodyPreview: item.body,
    bodyFull: item.body,
    mediaRefs: mediaRefs(item.mediaRefs),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    badges: item.status === "edited" ? [{ label: "Edytowano", tone: "neutral" }] : [],
    visibility: item.visibility,
    routeTarget: "/friends-feed",
    interactionSummary: {
      likeCount: item.likeCount,
      commentCount: item.commentCount,
      viewerLiked: item.viewerLiked,
      viewerCanReact: item.viewerCanReact,
      viewerCanComment: item.viewerCanComment,
    },
    actions: { showReact: true, showComment: true, showShare: false, showOpen: false },
    status: item.status,
  };
}

export function workplaceTeaserToPostDisplay(item: FriendFeedWorkplaceTeaserItemUi): PostDisplayViewModel {
  const media = item.teaser.previewMediaRef
    ? [{ refId: item.teaser.previewMediaRef, mediaType: "image" as const }]
    : [];
  return {
    id: item.teaser.id,
    displayType: "workplace_teaser",
    author: item.owner,
    sourceContext: { sourceLabel: item.teaser.workplaceName, sourceHref: `/workplace/${item.teaser.workplaceSlug}` },
    title: item.teaser.workplaceName,
    bodyPreview: item.teaser.previewText,
    bodyFull: null,
    mediaRefs: media,
    createdAt: item.teaser.createdAt,
    updatedAt: item.teaser.createdAt,
    badges: [{ label: "Z miejsca pracy", tone: "info" }],
    visibility: item.teaser.visibility === "public" ? "workplace_public" : "workplace_friends_only",
    routeTarget: item.teaser.targetRoute,
    actions: { showReact: false, showComment: false, showShare: false, showOpen: true },
    status: "published",
  };
}
