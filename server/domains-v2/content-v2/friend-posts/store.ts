/**
 * content-v2/friend-posts — in-memory store (FOUNDATION_READY).
 *
 * The friend posts store is the single owner of the read-path query for
 * the friend feed (newest-first + stable id tie-break + cursor + bounded
 * limit — no unbounded list, no global feed).
 */
import type {
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
}

export interface FriendPostReactionRepository {
  toggleLike(friendPostId: string, userId: string): Promise<{ liked: boolean }>;
  hasViewerLiked(friendPostId: string, userId: string): Promise<boolean>;
  countLikes(friendPostId: string): Promise<number>;
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
        (c) => c.friendPostId === friendPostId && c.status === "active",
      ).length;
    },
  };
}

export function createInMemoryFriendPostReactionRepository(): FriendPostReactionRepository {
  const rows = new Map<string, Set<string>>();
  const ensureSet = (postId: string) => {
    let set = rows.get(postId);
    if (!set) {
      set = new Set();
      rows.set(postId, set);
    }
    return set;
  };
  return {
    async toggleLike(friendPostId, userId) {
      const set = ensureSet(friendPostId);
      if (set.has(userId)) {
        set.delete(userId);
        return { liked: false };
      }
      set.add(userId);
      return { liked: true };
    },
    async hasViewerLiked(friendPostId, userId) {
      return rows.get(friendPostId)?.has(userId) ?? false;
    },
    async countLikes(friendPostId) {
      return rows.get(friendPostId)?.size ?? 0;
    },
  };
}

// Re-export types so callers can `import { ... } from "./store"`.
export type { FriendPostVisibility, FriendPostStatus };
