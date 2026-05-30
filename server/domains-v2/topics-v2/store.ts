/**
 * topics-v2 — in-memory store. (FOUNDATION_READY) Persistence is deferred.
 *
 * Unique constraint: (ownerType, ownerId, slug). The repository enforces this
 * because the slice has no DB layer yet.
 */
import type { TopicDTO } from "./dto";

export interface TopicRepository {
  insert(topic: TopicDTO): Promise<void>;
  update(topic: TopicDTO): Promise<void>;
  getById(id: string): Promise<TopicDTO | null>;
  findBySlug(ownerType: string, ownerId: string, slug: string): Promise<TopicDTO | null>;
  listForOwner(ownerType: string, ownerId: string): Promise<TopicDTO[]>;
}

export function createInMemoryTopicRepository(): TopicRepository {
  const byId = new Map<string, TopicDTO>();
  const slugKey = (t: string, id: string, slug: string) => `${t}|${id}|${slug}`;
  const bySlug = new Map<string, string>();
  return {
    async insert(topic) {
      byId.set(topic.id, topic);
      bySlug.set(slugKey(topic.ownerType, topic.ownerId, topic.slug), topic.id);
    },
    async update(topic) {
      byId.set(topic.id, topic);
    },
    async getById(id) {
      return byId.get(id) ?? null;
    },
    async findBySlug(ownerType, ownerId, slug) {
      const id = bySlug.get(slugKey(ownerType, ownerId, slug));
      return id ? (byId.get(id) ?? null) : null;
    },
    async listForOwner(ownerType, ownerId) {
      return [...byId.values()]
        .filter((t) => t.ownerType === ownerType && t.ownerId === ownerId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  };
}
