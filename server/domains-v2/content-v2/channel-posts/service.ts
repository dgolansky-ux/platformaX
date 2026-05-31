// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

import type {
  ChannelPostDTO,
  CreateChannelPostInput,
  DeactivateChannelPostInput,
  ListChannelPostsInput,
  PinChannelPostInput,
  UpdateChannelPostInput,
} from "./dto";
import type {
  ChannelFeedPage,
  ChannelPostDeactivatedValue,
  ChannelPostResult,
} from "./contracts";
import type { ChannelPostRepository } from "./ports";
import { toChannelFeedItemDTO, toChannelPostDTO } from "./mapper";
import {
  canAuthorMutatePost,
  isChannelPostBodyTooLong,
  normalizeChannelPostBody,
} from "./policy";

export type ChannelPostClock = { now: () => Date };
export type ChannelPostIdGenerator = { next: () => string };
export type ChannelPostServiceDeps = {
  posts: ChannelPostRepository;
  clock: ChannelPostClock;
  ids: ChannelPostIdGenerator;
};

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface ChannelPostService {
  create(input: CreateChannelPostInput): Promise<ChannelPostResult<{ post: ChannelPostDTO }>>;
  update(input: UpdateChannelPostInput): Promise<ChannelPostResult<{ post: ChannelPostDTO }>>;
  deactivate(input: DeactivateChannelPostInput): Promise<ChannelPostResult<ChannelPostDeactivatedValue>>;
  /** Slice 20 — moderator-actor deactivate. Bypasses author/manage check; idempotent. */
  moderatorDeactivate(
    input: { postId: string; moderatorUserId: string; reasonNote?: string | null },
  ): Promise<ChannelPostResult<ChannelPostDeactivatedValue>>;
  pin(input: PinChannelPostInput): Promise<ChannelPostResult<{ post: ChannelPostDTO }>>;
  unpin(input: PinChannelPostInput): Promise<ChannelPostResult<{ post: ChannelPostDTO }>>;
  listFeed(input: ListChannelPostsInput): Promise<ChannelFeedPage>; // stable order: pinned, createdAt desc, id
  getById(postId: string): Promise<ChannelPostDTO | null>;
}

function fail<T>(code: "EMPTY_BODY" | "BODY_TOO_LONG" | "NOT_FOUND" | "FORBIDDEN" | "DEACTIVATED", message: string): ChannelPostResult<T> {
  return { ok: false, error: { code, message } };
}

function validBody(body: string): ChannelPostResult<string> {
  const normalized = normalizeChannelPostBody(body);
  if (!normalized) return fail("EMPTY_BODY", "Channel post body must not be empty.");
  if (isChannelPostBodyTooLong(normalized)) return fail("BODY_TOO_LONG", "Channel post body is too long.");
  return { ok: true, value: normalized };
}

async function moderatorDeactivate(
  deps: ChannelPostServiceDeps,
  input: { postId: string; moderatorUserId: string; reasonNote?: string | null },
): Promise<ChannelPostResult<ChannelPostDeactivatedValue>> {
  const cur = await deps.posts.getById(input.postId);
  if (!cur) return fail("NOT_FOUND", "Channel post not found.");
  if (cur.status === "deactivated") {
    return { ok: true, value: { postId: input.postId, deactivated: true } };
  }
  const ts = deps.clock.now().toISOString();
  await deps.posts.update({
    ...cur,
    body: "",
    status: "deactivated",
    pinned: false,
    pinnedAt: undefined,
    pinnedByUserId: undefined,
    updatedAt: ts,
    deletedAt: ts,
  });
  void input.moderatorUserId;
  void input.reasonNote;
  return { ok: true, value: { postId: input.postId, deactivated: true } };
}

async function listFeed(deps: ChannelPostServiceDeps, input: ListChannelPostsInput): Promise<ChannelFeedPage> {
  const safe = Math.min(input.limit && input.limit > 0 ? input.limit : DEFAULT_LIMIT, MAX_LIMIT);
  // stable order: repository returns pinned first, then createdAt desc + id.
  const records = await deps.posts.listForChannel(input.channelId, input.cursor ?? null, safe); // stable order: pinned + createdAt desc
  const pinned = await deps.posts.getPinnedForChannel(input.channelId);
  return {
    pinnedPost: pinned ? toChannelFeedItemDTO(pinned) : null,
    items: records.map(toChannelFeedItemDTO),
    nextCursor: records.length === safe ? records[records.length - 1].id : null,
  };
}

export function createChannelPostService(deps: ChannelPostServiceDeps): ChannelPostService {
  return {
    async create(input) {
      const body = validBody(input.body);
      if (!body.ok) return body;
      const now = deps.clock.now().toISOString();
      const post = await deps.posts.create({
        id: deps.ids.next(),
        channelId: input.channelId,
        authorUserId: input.authorUserId,
        body: body.value,
        mediaRefs: input.mediaRefs ?? [],
        status: "published",
        pinned: false,
        createdAt: now,
        updatedAt: now,
      });
      return { ok: true, value: { post: toChannelPostDTO(post) } };
    },
    async update(input) {
      const cur = await deps.posts.getById(input.postId);
      if (!cur) return fail("NOT_FOUND", "Channel post not found.");
      if (!canAuthorMutatePost({ actorUserId: input.actorUserId, authorUserId: cur.authorUserId, canManage: input.canManage })) {
        return fail("FORBIDDEN", "No permission to edit this channel post.");
      }
      const body = validBody(input.body);
      if (!body.ok) return body;
      const next = await deps.posts.update({
        ...cur,
        body: body.value,
        mediaRefs: input.mediaRefs ?? cur.mediaRefs,
        status: "edited",
        updatedAt: deps.clock.now().toISOString(),
      });
      return { ok: true, value: { post: toChannelPostDTO(next) } };
    },
    async deactivate(input) {
      const cur = await deps.posts.getById(input.postId);
      if (!cur) return fail("NOT_FOUND", "Channel post not found.");
      if (!canAuthorMutatePost({ actorUserId: input.actorUserId, authorUserId: cur.authorUserId, canManage: input.canManage })) {
        return fail("FORBIDDEN", "No permission to deactivate this channel post.");
      }
      await deps.posts.update({
        ...cur,
        body: "",
        status: "deactivated",
        pinned: false,
        pinnedAt: undefined,
        pinnedByUserId: undefined,
        updatedAt: deps.clock.now().toISOString(),
        deletedAt: deps.clock.now().toISOString(),
      });
      return { ok: true, value: { postId: input.postId, deactivated: true } };
    },
    moderatorDeactivate: (input) => moderatorDeactivate(deps, input),
    async pin(input) {
      const cur = await deps.posts.getById(input.postId);
      if (!cur) return fail("NOT_FOUND", "Channel post not found.");
      await deps.posts.clearPinnedForChannel(cur.channelId, cur.id);
      const now = deps.clock.now().toISOString();
      const next = await deps.posts.update({ ...cur, pinned: true, pinnedAt: now, pinnedByUserId: input.actorUserId, updatedAt: now });
      return { ok: true, value: { post: toChannelPostDTO(next) } };
    },
    async unpin(input) {
      const cur = await deps.posts.getById(input.postId);
      if (!cur) return fail("NOT_FOUND", "Channel post not found.");
      const next = await deps.posts.update({ ...cur, pinned: false, pinnedAt: undefined, pinnedByUserId: undefined, updatedAt: deps.clock.now().toISOString() });
      return { ok: true, value: { post: toChannelPostDTO(next) } };
    },
    listFeed: (input) => listFeed(deps, input),
    async getById(postId) {
      const post = await deps.posts.getById(postId);
      return post ? toChannelPostDTO(post) : null;
    },
  };
}
