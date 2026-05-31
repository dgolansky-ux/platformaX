/**
 * content-v2 — record → DTO. No PII; friend-feed item carries a body preview.
 */
import type { FriendFeedItemDTO, PostPublicDTO } from "./dto";
import type { PostRecord } from "./ports";
import { bodyPreview } from "./policy";

export function toPostPublicDTO(r: PostRecord): PostPublicDTO {
  return {
    id: r.id,
    authorUserId: r.authorUserId,
    contextType: r.contextType,
    contextId: r.contextId,
    visibility: r.visibility,
    body: r.body,
    mediaRefs: r.mediaRefs,
    status: r.status,
    createdAt: r.createdAt,
  };
}

export function toFriendFeedItemDTO(r: PostRecord): FriendFeedItemDTO {
  return {
    postId: r.id,
    authorUserId: r.authorUserId,
    bodyPreview: bodyPreview(r.body),
    mediaRefs: r.mediaRefs,
    visibility: r.visibility,
    contextType: r.contextType,
    createdAt: r.createdAt,
  };
}
