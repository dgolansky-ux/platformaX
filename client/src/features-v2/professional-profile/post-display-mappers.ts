import type { PostDisplayViewModel } from "../content-display";
import type { WorkplaceMicroFeedItemUi, WorkplacePublicUi } from "./types";

export function workplacePostToDisplay(item: WorkplaceMicroFeedItemUi, workplace: WorkplacePublicUi): PostDisplayViewModel {
  const visibility = item.post.visibility === "friends_only"
    ? "workplace_friends_only"
    : item.post.visibility === "private"
      ? "workplace_private"
      : "workplace_public";
  return {
    id: item.post.id,
    displayType: "workplace_post",
    author: item.author,
    sourceContext: { sourceLabel: workplace.name, sourceHref: `/workplace/${workplace.slug}` },
    title: null,
    bodyPreview: item.post.body,
    bodyFull: item.post.body,
    mediaRefs: item.post.mediaRefs.map((refId) => ({ refId, mediaType: "image" as const })),
    createdAt: item.post.createdAt,
    updatedAt: item.post.updatedAt,
    badges: [{ label: item.post.postType, tone: "info" }],
    visibility,
    routeTarget: `/workplace/${workplace.slug}`,
    actions: { showReact: false, showComment: false, showShare: false, showOpen: true },
    status: item.post.status === "deactivated" ? "deactivated" : item.post.status,
  };
}
