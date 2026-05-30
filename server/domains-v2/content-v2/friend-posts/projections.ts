/**
 * content-v2/friend-posts — record → DTO. No PII; deleted comment bodies are
 * stripped at this boundary.
 */
import type {
  FriendPostCommentDTO,
  FriendPostCommentPublicDTO,
  FriendPostAuthorSummary,
  FriendPostDTO,
  FriendPostPublicDTO,
} from "./dto";

export function toFriendPostPublic(post: FriendPostDTO): FriendPostPublicDTO {
  const status: FriendPostPublicDTO["status"] =
    post.status === "draft" ? "published" : post.status;
  return {
    id: post.id,
    authorUserId: post.authorUserId,
    body: post.body,
    mediaRefs: post.mediaRefs,
    visibility: post.visibility,
    status,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function toFriendPostCommentPublic(
  comment: FriendPostCommentDTO,
  author: FriendPostAuthorSummary,
): FriendPostCommentPublicDTO {
  return {
    id: comment.id,
    friendPostId: comment.friendPostId,
    author,
    body: comment.status === "deleted" ? "" : comment.body,
    status: comment.status,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}
