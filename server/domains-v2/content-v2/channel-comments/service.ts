import type {
  ChannelCommentCreatedValue,
  ChannelCommentDeactivatedValue,
  ChannelCommentErrorCode,
  ChannelCommentListValue,
  ChannelCommentResult,
  ChannelCommentUpdatedValue,
} from "./contracts";
import type {
  CreateChannelCommentInput,
  DeactivateChannelCommentInput,
  ListChannelCommentsQuery,
  UpdateChannelCommentInput,
} from "./dto";
import { toChannelCommentDTO } from "./mapper";
import type { ChannelCommentRecord, ChannelCommentRepository } from "./repository";
import {
  canMutateChannelComment,
  CHANNEL_COMMENT_BODY_MAX,
  isChannelCommentBodyTooLong,
  normalizeChannelCommentBody,
} from "./policy";

export type ChannelCommentClock = { now: () => Date };
export type ChannelCommentIdGenerator = { next: () => string };

export type ChannelCommentServiceDeps = {
  comments: ChannelCommentRepository;
  clock: ChannelCommentClock;
  ids: ChannelCommentIdGenerator;
};

export interface ChannelCommentService {
  create(input: CreateChannelCommentInput): Promise<ChannelCommentResult<ChannelCommentCreatedValue>>;
  update(input: UpdateChannelCommentInput): Promise<ChannelCommentResult<ChannelCommentUpdatedValue>>;
  deactivate(input: DeactivateChannelCommentInput): Promise<ChannelCommentResult<ChannelCommentDeactivatedValue>>;
  getById(commentId: string): Promise<import("./dto").ChannelCommentDTO | null>;
  list(input: ListChannelCommentsQuery): Promise<ChannelCommentListValue>;
  countActive(channelPostId: string): Promise<number>;
  countActiveBatch(channelPostIds: readonly string[]): Promise<Map<string, number>>;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function fail<T>(code: ChannelCommentErrorCode, message: string): ChannelCommentResult<T> {
  return { ok: false, error: { code, message } };
}

function validateBody(body: string): ChannelCommentResult<string> {
  const normalized = normalizeChannelCommentBody(body);
  if (normalized.length === 0) return fail("EMPTY_BODY", "Komentarz nie może być pusty.");
  if (isChannelCommentBodyTooLong(normalized)) return fail("BODY_TOO_LONG", `Komentarz nie może być dłuższy niż ${CHANNEL_COMMENT_BODY_MAX} znaków.`);
  return { ok: true, value: normalized };
}

export function createChannelCommentService(deps: ChannelCommentServiceDeps): ChannelCommentService {
  return {
    async create(input) {
      const body = validateBody(input.body);
      if (!body.ok) return body;
      if (input.parentCommentId) {
        const parent = await deps.comments.getById(input.parentCommentId);
        if (!parent || parent.channelPostId !== input.channelPostId || parent.status === "deactivated") {
          return fail("PARENT_NOT_FOUND", "Komentarz nadrzędny nie istnieje pod tym wpisem.");
        }
      }
      const now = deps.clock.now().toISOString();
      const record: ChannelCommentRecord = {
        id: deps.ids.next(),
        channelPostId: input.channelPostId,
        parentCommentId: input.parentCommentId ?? null,
        authorUserId: input.authorUserId,
        body: body.value,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };
      const saved = await deps.comments.create(record);
      return { ok: true, value: { comment: toChannelCommentDTO(saved) } };
    },
    async update(input) {
      const body = validateBody(input.body);
      if (!body.ok) return body;
      const cur = await deps.comments.getById(input.commentId);
      if (!cur) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
      if (cur.status === "deactivated") return fail("ALREADY_DEACTIVATED", "Komentarz został dezaktywowany.");
      if (!canMutateChannelComment({ actorUserId: input.actorUserId, authorUserId: cur.authorUserId, canModerate: input.canModerate ?? false })) {
        return fail("FORBIDDEN", "Brak uprawnień do edycji komentarza.");
      }
      const updated = await deps.comments.update({
        ...cur,
        body: body.value,
        status: "edited",
        updatedAt: deps.clock.now().toISOString(),
      });
      return { ok: true, value: { comment: toChannelCommentDTO(updated) } };
    },
    async deactivate(input) {
      const cur = await deps.comments.getById(input.commentId);
      if (!cur) return fail("COMMENT_NOT_FOUND", "Komentarz nie istnieje.");
      if (cur.status === "deactivated") return fail("ALREADY_DEACTIVATED", "Komentarz został już dezaktywowany.");
      const canModerate = input.canModerate ?? false;
      if (!canMutateChannelComment({ actorUserId: input.actorUserId, authorUserId: cur.authorUserId, canModerate })) {
        return fail("FORBIDDEN", "Brak uprawnień do usunięcia komentarza.");
      }
      const now = deps.clock.now().toISOString();
      const updated = await deps.comments.update({
        ...cur,
        body: "",
        status: "deactivated",
        moderationReason: canModerate && input.actorUserId !== cur.authorUserId ? input.moderationReason ?? "moderated" : undefined,
        moderatedByUserId: canModerate && input.actorUserId !== cur.authorUserId ? input.actorUserId : undefined,
        updatedAt: now,
        deletedAt: now,
      });
      return { ok: true, value: { comment: toChannelCommentDTO(updated) } };
    },
    async getById(commentId) {
      const comment = await deps.comments.getById(commentId);
      return comment ? toChannelCommentDTO(comment) : null;
    },
    async list(input) {
      const safe = Math.min(input.limit && input.limit > 0 ? input.limit : DEFAULT_LIMIT, MAX_LIMIT);
      const records = await deps.comments.list(input.channelPostId, input.cursor ?? null, safe); // stable order: createdAt asc + id
      return {
        items: records.map(toChannelCommentDTO),
        nextCursor: records.length === safe ? records[records.length - 1].id : null,
      };
    },
    countActive: (channelPostId) => deps.comments.countActive(channelPostId),
    countActiveBatch: (channelPostIds) => deps.comments.countActiveBatch(channelPostIds),
  };
}
