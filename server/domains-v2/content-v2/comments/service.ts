// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * content-v2 / comments — service. Owns comments under feed items. NO role
 * checks (application-v2 enforces visibility/uprawnienia against communities
 * policy before calling here). Author-only edit/delete; soft-delete keeps the
 * row but strips body via the mapper. Lists are scoped to one feed item and
 * use a cursor + stable order.
 */
import type {
  CommentDeletedValue,
  CommentCreatedValue,
  CommentErrorCode,
  CommentListValue,
  CommentResult,
  CommentUpdatedValue,
} from "./contracts";
import type {
  CountCommentsQuery,
  CreateCommentInput,
  DeleteCommentInput,
  ListCommentsQuery,
  UpdateCommentInput,
} from "./dto";
import { toCommentDTO } from "./mapper";
import type { CommentRecord, CommentRepository } from "./ports";
import { COMMENT_BODY_MAX, isAuthor, isNonEmptyBody, isWithinLength } from "./policy";

export type CommentClock = { now: () => Date };
export type CommentIdGenerator = { next: () => string };

export type CommentServiceDeps = {
  repo: CommentRepository;
  clock: CommentClock;
  ids: CommentIdGenerator;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface CommentService {
  createComment(input: CreateCommentInput): Promise<CommentResult<CommentCreatedValue>>;
  updateOwnComment(input: UpdateCommentInput): Promise<CommentResult<CommentUpdatedValue>>;
  deleteOwnComment(input: DeleteCommentInput): Promise<CommentResult<CommentDeletedValue>>;
  /** Slice 20 P3 — moderator-actor soft-delete. Idempotent. */
  moderatorDeleteComment(
    input: { commentId: string; moderatorUserId: string; reasonNote?: string | null },
  ): Promise<CommentResult<CommentDeletedValue>>;
  listComments(query: ListCommentsQuery): Promise<CommentListValue>;
  countActive(query: CountCommentsQuery): Promise<number>;
  countActiveBatch(feedItemIds: readonly string[]): Promise<Map<string, number>>;
}

async function moderatorDeleteComment(
  deps: CommentServiceDeps,
  input: { commentId: string; moderatorUserId: string; reasonNote?: string | null },
): Promise<CommentResult<CommentDeletedValue>> {
  const existing = await deps.repo.getById(input.commentId);
  if (!existing) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
  if (existing.status === "deleted") {
    return { ok: true, value: { comment: toCommentDTO(existing) } };
  }
  const now = deps.clock.now().toISOString();
  const deleted = await deps.repo.softDelete(input.commentId, now);
  if (!deleted) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
  void input.moderatorUserId;
  void input.reasonNote;
  return { ok: true, value: { comment: toCommentDTO(deleted) } };
}

function fail<T>(code: CommentErrorCode, message: string): CommentResult<T> {
  return { ok: false, error: { code, message } };
}

function validateBody<T>(body: string): CommentResult<T> | null {
  if (!isNonEmptyBody(body)) return fail("EMPTY_BODY", "Treść komentarza nie może być pusta.");
  if (!isWithinLength(body)) return fail("BODY_TOO_LONG", `Komentarz nie może być dłuższy niż ${COMMENT_BODY_MAX} znaków.`);
  return null;
}

async function createComment(deps: CommentServiceDeps, input: CreateCommentInput): Promise<CommentResult<CommentCreatedValue>> {
  const err = validateBody<CommentCreatedValue>(input.body);
  if (err) return err;
  if (input.parentCommentId) {
    const parent = await deps.repo.getById(input.parentCommentId);
    if (!parent || parent.status === "deleted" || parent.feedItemId !== input.feedItemId) {
      return fail("PARENT_NOT_FOUND", "Komentarz nadrzędny nie istnieje w tym wątku.");
    }
  }
  const now = deps.clock.now().toISOString();
  const record: CommentRecord = {
    id: deps.ids.next(),
    feedItemId: input.feedItemId,
    parentCommentId: input.parentCommentId ?? null,
    authorUserId: input.authorUserId,
    body: input.body,
    status: "active",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  const saved = await deps.repo.create(record);
  return { ok: true, value: { comment: toCommentDTO(saved) } };
}

async function updateOwnComment(deps: CommentServiceDeps, input: UpdateCommentInput): Promise<CommentResult<CommentUpdatedValue>> {
  const err = validateBody<CommentUpdatedValue>(input.body);
  if (err) return err;
  const existing = await deps.repo.getById(input.commentId);
  if (!existing) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
  if (existing.status === "deleted") return fail("ALREADY_DELETED", "Komentarz został usunięty.");
  if (!isAuthor(existing.authorUserId, input.actorUserId)) {
    return fail("FORBIDDEN_AUTHOR_ONLY", "Tylko autor komentarza może go edytować.");
  }
  const now = deps.clock.now().toISOString();
  const updated = await deps.repo.update(input.commentId, { body: input.body, updatedAt: now });
  if (!updated) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
  return { ok: true, value: { comment: toCommentDTO(updated) } };
}

async function deleteOwnComment(deps: CommentServiceDeps, input: DeleteCommentInput): Promise<CommentResult<CommentDeletedValue>> {
  const existing = await deps.repo.getById(input.commentId);
  if (!existing) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
  if (existing.status === "deleted") return fail("ALREADY_DELETED", "Komentarz został już usunięty.");
  if (!isAuthor(existing.authorUserId, input.actorUserId)) {
    return fail("FORBIDDEN_AUTHOR_ONLY", "Tylko autor komentarza może go usunąć.");
  }
  const now = deps.clock.now().toISOString();
  const deleted = await deps.repo.softDelete(input.commentId, now);
  if (!deleted) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
  return { ok: true, value: { comment: toCommentDTO(deleted) } };
}

async function listComments(deps: CommentServiceDeps, query: ListCommentsQuery): Promise<CommentListValue> {
  const safe = Math.min(query.limit && query.limit > 0 ? query.limit : DEFAULT_LIMIT, MAX_LIMIT);
  const records = await deps.repo.list(query.feedItemId, query.cursor ?? null, safe); // SCALABILITY_HOT_PATH_EXCEPTION: scoped read model (feedItemId), stable order createdAt asc + id
  const items = records.map(toCommentDTO);
  const nextCursor = records.length === safe ? records[records.length - 1].id : null;
  return { items, nextCursor };
}

export function createCommentService(deps: CommentServiceDeps): CommentService {
  return {
    createComment: (input) => createComment(deps, input),
    updateOwnComment: (input) => updateOwnComment(deps, input),
    deleteOwnComment: (input) => deleteOwnComment(deps, input),
    moderatorDeleteComment: (input) => moderatorDeleteComment(deps, input),
    listComments: (query) => listComments(deps, query),
    countActive: (query) => deps.repo.countActive(query.feedItemId),
    countActiveBatch: (ids) => deps.repo.countActiveBatch(ids),
  };
}
