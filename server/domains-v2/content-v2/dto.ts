/**
 * content-v2 — DTOs (posts + friend-feed foundation).
 * Status: BACKEND_PARTIAL / READ_MODEL_SKELETON (in-memory).
 *
 * privacy classification: Public DTO — posts carry author userId references
 * only, never PII (no email/phone/dateOfBirth). The friend-feed item exposes a
 * body preview + media refs, no private contact data.
 */

export type PostVisibility = "private" | "friends" | "public";
export type PostStatus = "active" | "deleted";
export type PostContextType = "profile_presentation" | "friend_post";

export type PostPublicDTO = {
  id: string;
  authorUserId: string;
  contextType: PostContextType;
  contextId: string;
  visibility: PostVisibility;
  body: string;
  mediaRefs: readonly string[];
  status: PostStatus;
  createdAt: string;
};

/** One item in a viewer's friend feed. No PII; body is a preview only. */
export type FriendFeedItemDTO = {
  postId: string;
  authorUserId: string;
  bodyPreview: string;
  mediaRefs: readonly string[];
  visibility: PostVisibility;
  contextType: PostContextType;
  createdAt: string;
};

export type CreatePostInput = {
  authorUserId: string;
  contextType: PostContextType;
  contextId: string;
  body: string;
  visibility?: PostVisibility;
  mediaRefs?: readonly string[];
};

/** Friend-feed query — viewer-scoped, cursor-paginated, bounded. */
export type FriendFeedQuery = {
  viewerUserId: string;
  authorUserIds: readonly string[];
  cursor?: string | null;
  limit?: number;
};
