/**
 * content-v2/workplace-posts — DTOs (Slice 12 / BACKEND_PARTIAL).
 *
 * Workplace posts power the workplace MICRO-FEED — they live on the workplace
 * page and may emit a mini-teaser on the friend feed. They are NOT full friend
 * feed posts; the teaser is a separate, smaller read-model (see
 * `workplace-teasers/`).
 *
 * Privacy: no PII in public DTO; only `authorUserId` and workplace ids.
 */

export type WorkplacePostType =
  | "update"
  | "realization"
  | "offer"
  | "photo_note"
  | "announcement";

export type WorkplacePostStatus = "draft" | "published" | "edited" | "deactivated";

export type WorkplacePostVisibility = "workplace_public" | "friends_only" | "private";

export interface WorkplacePostRecord {
  id: string;
  workplaceId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  postType: WorkplacePostType;
  status: WorkplacePostStatus;
  visibility: WorkplacePostVisibility;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface WorkplacePostPublicDTO {
  id: string;
  workplaceId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  postType: WorkplacePostType;
  visibility: WorkplacePostVisibility;
  status: "published" | "edited" | "deactivated";
  createdAt: string;
  updatedAt: string;
}

export interface WorkplacePostListDTO {
  items: readonly WorkplacePostPublicDTO[];
  nextCursor: string | null;
}

export interface CreateWorkplacePostCommand {
  workplaceId: string;
  actorUserId: string;
  body: string;
  mediaRefs?: readonly string[];
  postType?: WorkplacePostType;
  visibility?: WorkplacePostVisibility;
}

export interface DeactivateWorkplacePostCommand {
  postId: string;
  actorUserId: string;
}

export interface ListWorkplacePostsQuery {
  workplaceId: string;
  cursor?: string | null;
  limit?: number;
}

export const WORKPLACE_POST_BODY_MAX = 4000;
export const WORKPLACE_POST_MEDIA_REFS_MAX = 8;
export const WORKPLACE_POST_DEFAULT_LIMIT = 20;
export const WORKPLACE_POST_MAX_LIMIT = 50;
export const WORKPLACE_POST_TEASER_PREVIEW_MAX = 240;
