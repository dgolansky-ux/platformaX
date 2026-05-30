/**
 * content-v2/friend-posts — in-memory store (FOUNDATION_READY).
 *
 * The friend posts store is the single owner of the read-path query for
 * the friend feed (newest-first + stable id tie-break + cursor + bounded
 * limit — no unbounded list, no global feed).
 */
import type {
  FriendFeedReactionTargetType,
  FriendPostCommentDTO,
  FriendPostDTO,
  FriendPostStatus,
  FriendPostVisibility,
} from "./dto";

export interface FriendPostRepository {
  insert(post: FriendPostDTO): Promise<void>;
  update(post: FriendPostDTO): Promise<void>;
  getById(id: string): Promise<FriendPostDTO | null>;
  listByAuthors(
    authorUserIds: readonly string[],
    cursor: string | null,
    limit: number,
    includeOwn: string | null,
  ): Promise<FriendPostDTO[]>;
  listByAuthor(
    authorUserId: string,
    cursor: string | null,
    limit: number,
  ): Promise<FriendPostDTO[]>;
}

export interface FriendPostCommentRepository {
  insert(comment: FriendPostCommentDTO): Promise<void>;
  update(comment: FriendPostCommentDTO): Promise<void>;
  getById(id: string): Promise<FriendPostCommentDTO | null>;
  listForPost(
    friendPostId: string,
    cursor: string | null,
    limit: number,
  ): Promise<FriendPostCommentDTO[]>;
  countForPost(friendPostId: string): Promise<number>;
  countForPosts(friendPostIds: readonly string[]): Promise<Map<string, number>>;
}

export interface FriendPostReactionRepository {
  setLike(targetType: FriendFeedReactionTargetType, targetId: string, userId: string): Promise<{ created: boolean }>;
  removeLike(targetType: FriendFeedReactionTargetType, targetId: string, userId: string): Promise<{ removed: boolean }>;
  toggleLike(targetType: FriendFeedReactionTargetType, targetId: string, userId: string): Promise<{ liked: boolean }>;
  hasViewerLiked(targetType: FriendFeedReactionTargetType, targetId: string, userId: string): Promise<boolean>;
  countLikes(targetType: FriendFeedReactionTargetType, targetId: string): Promise<number>;
  countLikesBatch(targets: readonly { targetType: FriendFeedReactionTargetType; targetId: string }[]): Promise<Map<string, number>>;
}

function postsSort(a: FriendPostDTO, b: FriendPostDTO): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? 1 : -1;
  return a.createdAt < b.createdAt ? 1 : -1;
}

function commentsSort(a: FriendPostCommentDTO, b: FriendPostCommentDTO): number {
  if (a.createdAt === b.createdAt) return a.id < b.id ? -1 : 1;
  return a.createdAt < b.createdAt ? -1 : 1;
}

export function createInMemoryFriendPostRepository(): FriendPostRepository {
  const rows = new Map<string, FriendPostDTO>();
  return {
    async insert(post) {
      rows.set(post.id, post);
    },
    async update(post) {
      rows.set(post.id, post);
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async listByAuthors(authorUserIds, cursor, limit, includeOwn) {
      const allow = new Set([...authorUserIds, ...(includeOwn ? [includeOwn] : [])]);
      const ACTIVE: ReadonlySet<FriendPostStatus> = new Set<FriendPostStatus>(["published", "edited"]);
      const all = [...rows.values()]
        .filter((r) => ACTIVE.has(r.status) && allow.has(r.authorUserId))
        .sort(postsSort);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
    async listByAuthor(authorUserId, cursor, limit) {
      const ACTIVE: ReadonlySet<FriendPostStatus> = new Set<FriendPostStatus>(["published", "edited"]);
      const all = [...rows.values()]
        .filter((r) => ACTIVE.has(r.status) && r.authorUserId === authorUserId)
        .sort(postsSort);
      const start = cursor ? all.findIndex((r) => r.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
  };
}

export function createInMemoryFriendPostCommentRepository(): FriendPostCommentRepository {
  const rows = new Map<string, FriendPostCommentDTO>();
  return {
    async insert(comment) {
      rows.set(comment.id, comment);
    },
    async update(comment) {
      rows.set(comment.id, comment);
    },
    async getById(id) {
      return rows.get(id) ?? null;
    },
    async listForPost(friendPostId, cursor, limit) {
      const all = [...rows.values()]
        .filter((c) => c.friendPostId === friendPostId)
        .sort(commentsSort);
      const start = cursor ? all.findIndex((c) => c.id === cursor) + 1 : 0;
      return all.slice(start, start + limit);
    },
    async countForPost(friendPostId) {
      return [...rows.values()].filter(
        (c) => c.friendPostId === friendPostId && c.status !== "deactivated",
      ).length;
    },
    async countForPosts(friendPostIds) {
      // READ_MODEL_SKELETON: DB adapter will replace this with GROUP BY post_id.
      const out = new Map<string, number>();
      for (const id of friendPostIds) out.set(id, 0);
      for (const c of rows.values()) {
        if (c.status === "deactivated") continue;
        if (out.has(c.friendPostId)) out.set(c.friendPostId, (out.get(c.friendPostId) ?? 0) + 1);
      }
      return out;
    },
  };
}

export function createInMemoryFriendPostReactionRepository(): FriendPostReactionRepository {
  const rows = new Map<string, Set<string>>();
  const key = (targetType: FriendFeedReactionTargetType, targetId: string) => `${targetType}:${targetId}`;
  const ensureSet = (targetType: FriendFeedReactionTargetType, targetId: string) => {
    const k = key(targetType, targetId);
    let set = rows.get(k);
    if (!set) {
      set = new Set();
      rows.set(k, set);
    }
    return set;
  };
  return {
    async setLike(targetType, targetId, userId) {
      const set = ensureSet(targetType, targetId);
      const created = !set.has(userId);
      set.add(userId);
      return { created };
    },
    async removeLike(targetType, targetId, userId) {
      return { removed: rows.get(key(targetType, targetId))?.delete(userId) ?? false };
    },
    async toggleLike(targetType, targetId, userId) {
      const set = ensureSet(targetType, targetId);
      if (set.has(userId)) {
        set.delete(userId);
        return { liked: false };
      }
      set.add(userId);
      return { liked: true };
    },
    async hasViewerLiked(targetType, targetId, userId) {
      return rows.get(key(targetType, targetId))?.has(userId) ?? false;
    },
    async countLikes(targetType, targetId) {
      return rows.get(key(targetType, targetId))?.size ?? 0;
    },
    async countLikesBatch(targets) {
      // READ_MODEL_SKELETON: DB adapter will replace this with GROUP BY target.
      const out = new Map<string, number>();
      for (const target of targets) {
        out.set(key(target.targetType, target.targetId), rows.get(key(target.targetType, target.targetId))?.size ?? 0);
      }
      return out;
    },
  };
}

// Re-export types so callers can `import { ... } from "./store"`.
export type { FriendPostVisibility, FriendPostStatus };
