// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * content-v2 — service (posts + friend-feed read query). No comments/reactions
 * runtime, no global feed, no ranking. Friendship is supplied by the caller;
 * content never imports social internals.
 */
import type {
  CreatePostInput,
  FriendFeedItemDTO,
  FriendFeedQuery,
  PostPublicDTO,
} from "./dto";
import type { PostRepository } from "./ports";
import { canSeePost } from "./policy";
import { toFriendFeedItemDTO, toPostPublicDTO } from "./mapper";

export type ContentClock = { now: () => Date };
export type ContentIdGenerator = { next: () => string };
export type ContentServiceDeps = { posts: PostRepository; clock: ContentClock; ids: ContentIdGenerator };

export type ContentErrorCode = "EMPTY_BODY";
export type ContentResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: ContentErrorCode; message: string } };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface ContentService {
  createPost(input: CreatePostInput): Promise<ContentResult<PostPublicDTO>>;
  /**
   * Friend-feed read query. Requires the viewer + an explicit set of author
   * ids (the viewer's friends, supplied by the application use-case from
   * social). Cursor-paginated, bounded — never the whole table.
   */
  listFriendFeed(query: FriendFeedQuery): Promise<{ items: FriendFeedItemDTO[]; nextCursor: string | null }>;
}

type Deps = ContentServiceDeps;

async function createPost(deps: Deps, input: CreatePostInput): Promise<ContentResult<PostPublicDTO>> {
  if (!input.body || input.body.trim().length === 0) {
    return { ok: false, error: { code: "EMPTY_BODY", message: "Post body must not be empty." } };
  }
  const now = deps.clock.now().toISOString();
  const record = await deps.posts.create({
    id: deps.ids.next(), authorUserId: input.authorUserId, contextType: input.contextType,
    contextId: input.contextId, visibility: input.visibility ?? "friends", body: input.body,
    mediaRefs: input.mediaRefs ?? [], status: "active", createdAt: now, updatedAt: now,
  });
  return { ok: true, value: toPostPublicDTO(record) };
}

async function listFriendFeed(deps: Deps, query: FriendFeedQuery) {
  const safe = Math.min(query.limit && query.limit > 0 ? query.limit : DEFAULT_LIMIT, MAX_LIMIT);
  // Scoped to explicit authors (viewer's friends) + stable order — no global feed.
  const records = await deps.posts.listByAuthors(query.authorUserIds, query.cursor ?? null, safe); // SCALABILITY_HOT_PATH_EXCEPTION: read model returns stable order (createdAt desc, id tiebreak)
  const items = records
    .filter((r) => canSeePost(r, query.viewerUserId, true))
    .map(toFriendFeedItemDTO);
  const nextCursor = records.length === safe ? records[records.length - 1].id : null;
  return { items, nextCursor };
}

export function createContentService(deps: Deps): ContentService {
  return {
    createPost: (input) => createPost(deps, input),
    listFriendFeed: (query) => listFriendFeed(deps, query),
  };
}
