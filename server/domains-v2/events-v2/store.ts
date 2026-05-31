/**
 * events-v2 — in-memory store. FOUNDATION_READY. Persistence is deferred.
 */
import type { EventDTO } from "./dto";

export interface EventRepository {
  insert(event: EventDTO): Promise<void>;
  update(event: EventDTO): Promise<void>;
  getById(id: string): Promise<EventDTO | null>;
  listForOwner(ownerType: string, ownerId: string): Promise<EventDTO[]>;
}

export function createInMemoryEventRepository(): EventRepository {
  const byId = new Map<string, EventDTO>();
  return {
    async insert(event) {
      byId.set(event.id, event);
    },
    async update(event) {
      byId.set(event.id, event);
    },
    async getById(id) {
      return byId.get(id) ?? null;
    },
    async listForOwner(ownerType, ownerId) {
      return [...byId.values()]
        .filter((e) => e.ownerType === ownerType && e.ownerId === ownerId)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
    },
  };
}
