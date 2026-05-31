/**
 * features-v2/communities-v2 / community-interactions-mock-adapter —
 * MOCK_LOCAL_ONLY transport for Communities Slice 6 (comments + reactions on
 * community feed items).
 *
 * No HTTP transport yet (TRANSPORT_PARTIAL). The adapter holds in-memory
 * state seeded for the demo viewer and enforces the SAME rules the backend
 * orchestrator enforces (community-interactions use-case):
 *   - viewer must be able to see the feed item (community_all → members,
 *     relational → members, staff_only → founder/admin/moderator);
 *   - only the author can update/delete their own comment;
 *   - soft-delete strips the body in DTO;
 *   - reactions are unique per (target, user, reactionType) and toggleable;
 *   - interactions are anchored to feedItemId, NOT to the source post — so
 *     a distributed copy in a child community has its OWN comments/reactions
 *     that never leak back up.
 *
 * NO `@server/*` imports. Mutations actually mutate this store — the adapter
 * is the local source of truth for the demo fixture.
 */
import type {
  CommunityCommentDTO,
  CommunityCommentsPageDTO,
  CommunityInteractionActionResult,
  CommunityPostInteractionDTO,
  CommunityReactionSummaryDTO,
  CommunityReactionType,
  CreateCommunityCommentFrontendInput,
  DeleteCommunityCommentFrontendInput,
  ReactToCommunityCommentFrontendInput,
  ReactToCommunityPostFrontendInput,
  UpdateCommunityCommentFrontendInput,
} from "@shared/contracts/community-interactions";
import { COMMUNITY_REACTION_TYPES } from "@shared/contracts/community-interactions";
import type { CommunityFeedType } from "@shared/contracts/community-feeds";

const VIEWER_ID = "u-viewer-demo";
const VIEWER_NAME = "Demo użytkownik";
const COMMENT_BODY_MAX = 2000;

type Role = "founder" | "admin" | "moderator" | "member" | null;

type FeedItemMeta = {
  id: string;
  communityId: string;
  feedType: CommunityFeedType;
  viewerRole: Role;
};

type Comment = {
  id: string;
  feedItemId: string;
  parentCommentId: string | null;
  authorUserId: string;
  authorDisplayName: string;
  body: string;
  status: "active" | "deleted";
  createdAt: string;
  updatedAt: string;
};

type Reaction = {
  id: string;
  targetType: "post" | "comment";
  targetId: string;
  userId: string;
  reactionType: CommunityReactionType;
  createdAt: string;
};

type State = {
  items: Map<string, FeedItemMeta>;
  comments: Comment[];
  reactions: Reaction[];
  failure: string | null;
  seq: number;
  now: Date;
};

function makeInitialState(): State {
  // Two demo feed items mirroring community-feeds-mock-adapter seed:
  // a community_all post and a staff_only post in product-builders.
  // IDs match the seed (`fi-1`, `fi-2`).
  const items = new Map<string, FeedItemMeta>();
  items.set("fi-1", { id: "fi-1", communityId: "pb", feedType: "community_all", viewerRole: "founder" });
  items.set("fi-2", { id: "fi-2", communityId: "pb", feedType: "staff_only", viewerRole: "founder" });
  return { items, comments: [], reactions: [], failure: null, seq: 0, now: new Date("2026-05-29T10:00:00.000Z") };
}

let state: State = makeInitialState();

function canViewFeed(role: Role, feedType: CommunityFeedType): boolean {
  if (role === null) return false;
  if (feedType === "staff_only") return role === "founder" || role === "admin" || role === "moderator";
  return true;
}

function fail<T>(): CommunityInteractionActionResult<T> | null {
  return state.failure ? { ok: false, error: { code: "UNKNOWN", message: state.failure } } : null;
}

function nextId(prefix: string): string {
  state.seq += 1;
  return `${prefix}-${state.seq}`;
}

function nowIso(): string {
  state.seq += 1;
  return new Date(state.now.getTime() + state.seq * 1000).toISOString();
}

function findItem(feedItemId: string): FeedItemMeta | null {
  return state.items.get(feedItemId) ?? null;
}

function zeroCounts(): Record<CommunityReactionType, number> {
  const out = {} as Record<CommunityReactionType, number>;
  for (const t of COMMUNITY_REACTION_TYPES) out[t] = 0;
  return out;
}

function summarize(targetType: "post" | "comment", targetId: string): CommunityReactionSummaryDTO {
  const counts = zeroCounts();
  let total = 0;
  const viewerActive: CommunityReactionType[] = [];
  for (const r of state.reactions) {
    if (r.targetType !== targetType || r.targetId !== targetId) continue;
    counts[r.reactionType] = (counts[r.reactionType] ?? 0) + 1;
    total += 1;
    if (r.userId === VIEWER_ID) viewerActive.push(r.reactionType);
  }
  return { counts, total, viewerActive };
}

function mapComment(c: Comment): CommunityCommentDTO {
  return {
    id: c.id,
    feedItemId: c.feedItemId,
    parentCommentId: c.parentCommentId,
    authorUserId: c.authorUserId,
    authorDisplayName: c.authorDisplayName,
    body: c.status === "deleted" ? "" : c.body,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    viewerIsAuthor: c.authorUserId === VIEWER_ID,
  };
}

/**
 * Tell the adapter about a feed item the demo has just shown — keeps the
 * interactions store aligned with the feeds store without coupling the two
 * adapters at construction time. Calling this with the same id is idempotent.
 */
export function registerFeedItemForInteractions(meta: FeedItemMeta): void {
  state.items.set(meta.id, meta);
}

async function listComments(feedItemId: string): Promise<CommunityInteractionActionResult<CommunityCommentsPageDTO>> {
  const f = fail<CommunityCommentsPageDTO>(); if (f) return f;
  const item = findItem(feedItemId);
  if (!item) return { ok: false, error: { code: "NOT_FOUND", message: "Post nie istnieje." } };
  if (!canViewFeed(item.viewerRole, item.feedType)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Nie masz dostępu do tego feedu." } };
  }
  const items = state.comments
    .filter((c) => c.feedItemId === feedItemId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : a.createdAt > b.createdAt ? 1 : a.id < b.id ? -1 : 1))
    .map(mapComment);
  const reactions = items.map((c) => ({ commentId: c.id, reactions: summarize("comment", c.id) }));
  return { ok: true, value: { items, nextCursor: null, reactions } };
}

async function createComment(input: CreateCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityCommentDTO>> {
  const f = fail<CommunityCommentDTO>(); if (f) return f;
  const item = findItem(input.feedItemId);
  if (!item) return { ok: false, error: { code: "NOT_FOUND", message: "Post nie istnieje." } };
  if (!canViewFeed(item.viewerRole, item.feedType)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Nie możesz komentować w tym feedzie." } };
  }
  if (input.body.trim().length === 0) {
    return { ok: false, error: { code: "VALIDATION", field: "body", message: "Treść komentarza nie może być pusta." } };
  }
  if (input.body.length > COMMENT_BODY_MAX) {
    return { ok: false, error: { code: "VALIDATION", field: "body", message: `Komentarz nie może być dłuższy niż ${COMMENT_BODY_MAX} znaków.` } };
  }
  if (input.parentCommentId) {
    const parent = state.comments.find((c) => c.id === input.parentCommentId && c.feedItemId === input.feedItemId && c.status === "active");
    if (!parent) return { ok: false, error: { code: "NOT_FOUND", message: "Komentarz nadrzędny nie istnieje w tym wątku." } };
  }
  const ts = nowIso();
  const comment: Comment = {
    id: nextId("c"), feedItemId: input.feedItemId, parentCommentId: input.parentCommentId ?? null,
    authorUserId: VIEWER_ID, authorDisplayName: VIEWER_NAME, body: input.body,
    status: "active", createdAt: ts, updatedAt: ts,
  };
  state.comments.push(comment);
  return { ok: true, value: mapComment(comment) };
}

async function updateComment(input: UpdateCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityCommentDTO>> {
  const f = fail<CommunityCommentDTO>(); if (f) return f;
  const c = state.comments.find((x) => x.id === input.commentId && x.feedItemId === input.feedItemId);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Komentarz nie istnieje." } };
  if (c.status === "deleted") return { ok: false, error: { code: "CONFLICT", message: "Komentarz został usunięty." } };
  if (c.authorUserId !== VIEWER_ID) return { ok: false, error: { code: "FORBIDDEN", message: "Tylko autor może edytować swój komentarz." } };
  if (input.body.trim().length === 0) {
    return { ok: false, error: { code: "VALIDATION", field: "body", message: "Treść komentarza nie może być pusta." } };
  }
  c.body = input.body;
  c.updatedAt = nowIso();
  return { ok: true, value: mapComment(c) };
}

async function deleteComment(input: DeleteCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityCommentDTO>> {
  const f = fail<CommunityCommentDTO>(); if (f) return f;
  const c = state.comments.find((x) => x.id === input.commentId && x.feedItemId === input.feedItemId);
  if (!c) return { ok: false, error: { code: "NOT_FOUND", message: "Komentarz nie istnieje." } };
  if (c.status === "deleted") return { ok: false, error: { code: "CONFLICT", message: "Komentarz został już usunięty." } };
  if (c.authorUserId !== VIEWER_ID) return { ok: false, error: { code: "FORBIDDEN", message: "Tylko autor może usunąć swój komentarz." } };
  c.status = "deleted";
  c.updatedAt = nowIso();
  return { ok: true, value: mapComment(c) };
}

async function reactToPost(input: ReactToCommunityPostFrontendInput): Promise<CommunityInteractionActionResult<CommunityPostInteractionDTO>> {
  const f = fail<CommunityPostInteractionDTO>(); if (f) return f;
  const item = findItem(input.feedItemId);
  if (!item) return { ok: false, error: { code: "NOT_FOUND", message: "Post nie istnieje." } };
  if (!canViewFeed(item.viewerRole, item.feedType)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Nie możesz reagować w tym feedzie." } };
  }
  applyReaction("post", input.feedItemId, input.reactionType, input.mode);
  const commentCount = state.comments.filter((c) => c.feedItemId === input.feedItemId && c.status === "active").length;
  return { ok: true, value: { feedItemId: input.feedItemId, commentCount, reactions: summarize("post", input.feedItemId) } };
}

async function reactToComment(input: ReactToCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityReactionSummaryDTO>> {
  const f = fail<CommunityReactionSummaryDTO>(); if (f) return f;
  const item = findItem(input.feedItemId);
  if (!item) return { ok: false, error: { code: "NOT_FOUND", message: "Post nie istnieje." } };
  if (!canViewFeed(item.viewerRole, item.feedType)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Nie możesz reagować w tym feedzie." } };
  }
  applyReaction("comment", input.commentId, input.reactionType, input.mode);
  return { ok: true, value: summarize("comment", input.commentId) };
}

function applyReaction(
  targetType: "post" | "comment",
  targetId: string,
  reactionType: CommunityReactionType,
  mode: "set" | "remove" | "toggle",
): void {
  const idx = state.reactions.findIndex(
    (r) => r.targetType === targetType && r.targetId === targetId && r.userId === VIEWER_ID && r.reactionType === reactionType,
  );
  if (mode === "remove") {
    if (idx !== -1) state.reactions.splice(idx, 1);
    return;
  }
  if (mode === "toggle") {
    if (idx !== -1) {
      state.reactions.splice(idx, 1);
      return;
    }
  } else if (mode === "set" && idx !== -1) {
    return;
  }
  state.reactions.push({
    id: nextId("r"), targetType, targetId, userId: VIEWER_ID, reactionType, createdAt: nowIso(),
  });
}

async function getPostInteractionSummaries(feedItemIds: readonly string[]): Promise<CommunityInteractionActionResult<readonly CommunityPostInteractionDTO[]>> {
  const f = fail<readonly CommunityPostInteractionDTO[]>(); if (f) return f;
  const out: CommunityPostInteractionDTO[] = [];
  for (const id of feedItemIds) {
    const item = findItem(id);
    if (!item || !canViewFeed(item.viewerRole, item.feedType)) continue;
    const commentCount = state.comments.filter((c) => c.feedItemId === id && c.status === "active").length;
    out.push({ feedItemId: id, commentCount, reactions: summarize("post", id) });
  }
  return { ok: true, value: out };
}

export type CommunityInteractionsMockAdapter = {
  registerFeedItem(meta: FeedItemMeta): void;
  listComments(feedItemId: string): Promise<CommunityInteractionActionResult<CommunityCommentsPageDTO>>;
  createComment(input: CreateCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityCommentDTO>>;
  updateComment(input: UpdateCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityCommentDTO>>;
  deleteComment(input: DeleteCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityCommentDTO>>;
  reactToPost(input: ReactToCommunityPostFrontendInput): Promise<CommunityInteractionActionResult<CommunityPostInteractionDTO>>;
  reactToComment(input: ReactToCommunityCommentFrontendInput): Promise<CommunityInteractionActionResult<CommunityReactionSummaryDTO>>;
  getPostInteractionSummaries(feedItemIds: readonly string[]): Promise<CommunityInteractionActionResult<readonly CommunityPostInteractionDTO[]>>;
  __setFailureForTests(message: string | null): void;
  __resetForTests(): void;
};

export const communityInteractionsMockAdapter: CommunityInteractionsMockAdapter = {
  registerFeedItem: registerFeedItemForInteractions,
  listComments,
  createComment,
  updateComment,
  deleteComment,
  reactToPost,
  reactToComment,
  getPostInteractionSummaries,
  __setFailureForTests(message) { state.failure = message; },
  __resetForTests() { state = makeInitialState(); },
};
