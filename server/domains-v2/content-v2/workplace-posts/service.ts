// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * content-v2/workplace-posts — service (BACKEND_PARTIAL).
 *
 * Only the workplace owner may publish into the micro-feed. The application
 * layer is responsible for resolving ownership against
 * `identity/workplaces.public-api` and friendship against `social.public-api`
 * — this service never imports either domain's internals.
 */
import {
  WORKPLACE_POST_DEFAULT_LIMIT,
  WORKPLACE_POST_MAX_LIMIT,
  type CreateWorkplacePostCommand,
  type DeactivateWorkplacePostCommand,
  type ListWorkplacePostsQuery,
  type WorkplacePostListDTO,
  type WorkplacePostPublicDTO,
  type WorkplacePostRecord,
  type WorkplacePostVisibility,
} from "./dto";
import type {
  WorkplaceOwnershipResolver,
  WorkplacePostFriendshipResolver,
} from "./contracts";
import type { WorkplacePostRepository } from "./ports";
import type { WorkplacePostEventPublisher } from "./events";
import { toWorkplacePostPublic } from "./projections";
import {
  canViewWorkplacePost,
  isWorkplacePostType,
  isWorkplacePostVisibility,
  validateWorkplacePostBody,
  validateWorkplacePostMediaRefs,
} from "./policy";

export type WorkplacePostClock = { now: () => Date };
export type WorkplacePostIdGen = { next: () => string };

export interface WorkplacePostsServiceDeps {
  posts: WorkplacePostRepository;
  ownership: WorkplaceOwnershipResolver;
  friendship: WorkplacePostFriendshipResolver;
  events: WorkplacePostEventPublisher;
  clock: WorkplacePostClock;
  ids: WorkplacePostIdGen;
}

export type WorkplacePostsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_FAILED";

export type WorkplacePostsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: WorkplacePostsErrorCode; message: string } };

export interface WorkplacePostsService {
  createPost(input: CreateWorkplacePostCommand): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>>;
  deactivatePost(input: DeactivateWorkplacePostCommand): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>>;
  /** Slice 20 — moderator-actor deactivate. Idempotent. */
  moderatorDeactivatePost(
    input: { postId: string; moderatorUserId: string; reasonNote?: string | null },
  ): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>>;
  getPostForViewer(
    postId: string,
    viewerUserId: string,
  ): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>>;
  listForWorkplace(
    query: ListWorkplacePostsQuery,
    viewerUserId: string,
  ): Promise<WorkplacePostsResult<WorkplacePostListDTO>>;
}

type Deps = WorkplacePostsServiceDeps;

function fail<T>(code: WorkplacePostsErrorCode, message: string): WorkplacePostsResult<T> {
  return { ok: false, error: { code, message } };
}

function defaultVisibility(input: CreateWorkplacePostCommand): WorkplacePostVisibility {
  if (input.visibility !== undefined) return input.visibility;
  return "workplace_public";
}

function clampLimit(requested: number | undefined): number {
  const n = requested && requested > 0 ? requested : WORKPLACE_POST_DEFAULT_LIMIT;
  return Math.min(n, WORKPLACE_POST_MAX_LIMIT);
}

async function createPost(deps: Deps, input: CreateWorkplacePostCommand): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>> {
  const isOwner = await deps.ownership.isWorkplaceOwner(input.actorUserId, input.workplaceId);
  if (!isOwner) return fail("FORBIDDEN", "Only the workplace owner can publish.");

  const bodyErr = validateWorkplacePostBody(input.body);
  if (bodyErr) return fail("VALIDATION_FAILED", bodyErr);
  const mediaErr = validateWorkplacePostMediaRefs(input.mediaRefs);
  if (mediaErr) return fail("VALIDATION_FAILED", mediaErr);
  if (input.postType !== undefined && !isWorkplacePostType(input.postType)) {
    return fail("VALIDATION_FAILED", "POST_TYPE_INVALID");
  }
  const visibility = defaultVisibility(input);
  if (!isWorkplacePostVisibility(visibility)) return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");

  const now = deps.clock.now().toISOString();
  const record: WorkplacePostRecord = {
    id: deps.ids.next(),
    workplaceId: input.workplaceId,
    authorUserId: input.actorUserId,
    body: input.body.trim(),
    mediaRefs: input.mediaRefs ?? [],
    postType: input.postType ?? "update",
    status: "published",
    visibility,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await deps.posts.insert(record);
  await deps.events.publish({
    type: "WorkplacePostCreated",
    eventId: `evt-${deps.ids.next()}`,
    workplaceId: record.workplaceId,
    postId: record.id,
    authorUserId: record.authorUserId,
    postType: record.postType,
    visibility: record.visibility,
    occurredAt: now,
    correlationId: null,
  });
  return { ok: true, value: toWorkplacePostPublic(record) };
}

async function deactivatePost(deps: Deps, input: DeactivateWorkplacePostCommand): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>> {
  const existing = await deps.posts.getById(input.postId);
  if (!existing) return fail("NOT_FOUND", "Post not found.");
  const isOwner = await deps.ownership.isWorkplaceOwner(input.actorUserId, existing.workplaceId);
  if (!isOwner && existing.authorUserId !== input.actorUserId) {
    return fail("FORBIDDEN", "Only the workplace owner can deactivate.");
  }
  if (existing.status === "deactivated") {
    return { ok: true, value: toWorkplacePostPublic(existing) };
  }
  const now = deps.clock.now().toISOString();
  const updated: WorkplacePostRecord = {
    ...existing,
    status: "deactivated",
    updatedAt: now,
    deletedAt: now,
  };
  await deps.posts.update(updated);
  return { ok: true, value: toWorkplacePostPublic(updated) };
}

async function moderatorDeactivatePost(
  deps: Deps,
  input: { postId: string; moderatorUserId: string; reasonNote?: string | null },
): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>> {
  const existing = await deps.posts.getById(input.postId);
  if (!existing) return fail("NOT_FOUND", "Post not found.");
  if (existing.status === "deactivated") {
    return { ok: true, value: toWorkplacePostPublic(existing) };
  }
  const now = deps.clock.now().toISOString();
  const updated: WorkplacePostRecord = {
    ...existing,
    status: "deactivated",
    updatedAt: now,
    deletedAt: now,
  };
  await deps.posts.update(updated);
  void input.moderatorUserId;
  void input.reasonNote;
  return { ok: true, value: toWorkplacePostPublic(updated) };
}

async function getPostForViewer(
  deps: Deps,
  postId: string,
  viewerUserId: string,
): Promise<WorkplacePostsResult<WorkplacePostPublicDTO>> {
  const post = await deps.posts.getById(postId);
  if (!post) return fail("NOT_FOUND", "Post not found.");
  const ownerUserId = await deps.ownership.getWorkplaceOwner(post.workplaceId);
  if (!ownerUserId) return fail("NOT_FOUND", "Post not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, ownerUserId);
  if (!canViewWorkplacePost(post, ownerUserId, viewerUserId, isFriend)) {
    return fail("NOT_FOUND", "Post not found.");
  }
  return { ok: true, value: toWorkplacePostPublic(post) };
}

// SCALABILITY_HOT_PATH_EXCEPTION: store returns stable order (createdAt desc + id) with cursor + bounded limit.
async function listForWorkplace(
  // SCALABILITY_HOT_PATH_EXCEPTION: signature uses cursor + limit; ordering pinned by store.
  deps: Deps,
  query: ListWorkplacePostsQuery,
  viewerUserId: string,
): Promise<WorkplacePostsResult<WorkplacePostListDTO>> {
  const ownerUserId = await deps.ownership.getWorkplaceOwner(query.workplaceId);
  if (!ownerUserId) return fail("NOT_FOUND", "Workplace not found.");
  const limit = clampLimit(query.limit);
  const isFriend = await deps.friendship.areFriends(viewerUserId, ownerUserId);
  // SCALABILITY_HOT_PATH_EXCEPTION: store returns stable order (createdAt desc + id tie-break) with cursor + bounded limit.
  const records = await deps.posts.listForWorkplace(query.workplaceId, query.cursor ?? null, limit);
  const visible = records.filter((p) => canViewWorkplacePost(p, ownerUserId, viewerUserId, isFriend));
  const items = visible.map(toWorkplacePostPublic);
  const nextCursor = records.length === limit ? records[records.length - 1].id : null;
  return { ok: true, value: { items, nextCursor } };
}

export function createWorkplacePostsService(deps: WorkplacePostsServiceDeps): WorkplacePostsService {
  return {
    createPost: (input) => createPost(deps, input),
    deactivatePost: (input) => deactivatePost(deps, input),
    moderatorDeactivatePost: (input) => moderatorDeactivatePost(deps, input),
    getPostForViewer: (id, viewerId) => getPostForViewer(deps, id, viewerId),
    listForWorkplace: (query, viewerId) => listForWorkplace(deps, query, viewerId),
  };
}
