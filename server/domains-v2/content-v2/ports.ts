/**
 * content-v2 — repository ports (internal). In-memory impl in store.ts.
 */
import type { PostContextType, PostStatus, PostVisibility } from "./dto";

export type PostRecord = {
  id: string;
  authorUserId: string;
  contextType: PostContextType;
  contextId: string;
  visibility: PostVisibility;
  body: string;
  mediaRefs: readonly string[];
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
};

export interface PostRepository {
  create(record: PostRecord): Promise<PostRecord>;
  getById(id: string): Promise<PostRecord | null>;
  /**
   * Read-model query for the friend feed. Returns active posts by the given
   * authors only (never the whole table — no global feed), newest-first with a
   * stable id tie-breaker, bounded by `limit`, starting after `cursor`.
   */
  listByAuthors(
    authorUserIds: readonly string[],
    cursor: string | null,
    limit: number,
  ): Promise<PostRecord[]>;
}
