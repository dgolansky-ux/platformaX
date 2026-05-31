import type { ChannelPostDTO } from "@shared/contracts/channel-posts";
import type { PostDisplayViewModel } from "../content-display";

export function channelPostToDisplay(channelSlug: string, post: ChannelPostDTO): PostDisplayViewModel {
  return {
    id: post.id,
    displayType: "channel_post",
    author: post.author ?? {
      userId: "channel-lead",
      displayName: "Prowadzący kanału",
      handle: null,
      avatarRef: null,
    },
    sourceContext: { sourceLabel: "Kanał", sourceHref: `/channels/${channelSlug}` },
    title: null,
    bodyPreview: post.body,
    bodyFull: post.body,
    mediaRefs: post.mediaRefs.map((refId) => ({ refId, mediaType: "image" as const })),
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    badges: post.pinned ? [{ label: "Przypięte", tone: "info" }] : [],
    visibility: "channel_followers",
    routeTarget: `/channels/${channelSlug}`,
    interactionSummary: {
      likeCount: post.interactions.reactionCount,
      commentCount: post.interactions.commentCount,
      viewerLiked: post.interactions.viewerLiked,
      viewerCanReact: post.interactions.canReact,
      viewerCanComment: post.interactions.canComment,
    },
    actions: {
      showReact: post.interactions.reactionsEnabled,
      showComment: post.interactions.commentsEnabled,
      showShare: false,
      showOpen: false,
    },
    status: "published",
  };
}
