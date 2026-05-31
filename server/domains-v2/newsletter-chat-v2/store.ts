/**
 * newsletter-chat-v2 — in-memory stores. FOUNDATION_READY.
 */
import type {
  NewsletterChatDTO,
  NewsletterMessageDTO,
  NewsletterSubscriberDTO,
  NewsletterSubscriberStatus,
} from "./dto";

export interface NewsletterChatRepository {
  insert(chat: NewsletterChatDTO): Promise<void>;
  update(chat: NewsletterChatDTO): Promise<void>;
  getById(id: string): Promise<NewsletterChatDTO | null>;
  listForOwner(ownerType: string, ownerId: string): Promise<NewsletterChatDTO[]>;
}

export interface NewsletterMessageRepository {
  insert(message: NewsletterMessageDTO): Promise<void>;
  listForChat(newsletterChatId: string): Promise<NewsletterMessageDTO[]>;
}

export interface NewsletterSubscriberRepository {
  upsert(subscriber: NewsletterSubscriberDTO): Promise<NewsletterSubscriberDTO>;
  setStatus(
    newsletterChatId: string,
    subscriberUserId: string,
    status: NewsletterSubscriberStatus,
  ): Promise<NewsletterSubscriberDTO | null>;
  get(newsletterChatId: string, subscriberUserId: string): Promise<NewsletterSubscriberDTO | null>;
  countActive(newsletterChatId: string): Promise<number>;
}

export function createInMemoryNewsletterChatRepository(): NewsletterChatRepository {
  const byId = new Map<string, NewsletterChatDTO>();
  return {
    async insert(chat) {
      byId.set(chat.id, chat);
    },
    async update(chat) {
      byId.set(chat.id, chat);
    },
    async getById(id) {
      return byId.get(id) ?? null;
    },
    async listForOwner(ownerType, ownerId) {
      return [...byId.values()]
        .filter((c) => c.ownerType === ownerType && c.ownerId === ownerId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  };
}

export function createInMemoryNewsletterMessageRepository(): NewsletterMessageRepository {
  const rows: NewsletterMessageDTO[] = [];
  return {
    async insert(message) {
      rows.push(message);
    },
    async listForChat(newsletterChatId) {
      return rows
        .filter((m) => m.newsletterChatId === newsletterChatId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
  };
}

export function createInMemoryNewsletterSubscriberRepository(): NewsletterSubscriberRepository {
  const rows = new Map<string, NewsletterSubscriberDTO>();
  const key = (cId: string, uId: string) => `${cId}|${uId}`;
  return {
    async upsert(subscriber) {
      const existing = rows.get(key(subscriber.newsletterChatId, subscriber.subscriberUserId));
      const merged: NewsletterSubscriberDTO = existing
        ? { ...subscriber, createdAt: existing.createdAt }
        : subscriber;
      rows.set(key(subscriber.newsletterChatId, subscriber.subscriberUserId), merged);
      return merged;
    },
    async setStatus(newsletterChatId, subscriberUserId, status) {
      const existing = rows.get(key(newsletterChatId, subscriberUserId));
      if (!existing) return null;
      const updated: NewsletterSubscriberDTO = { ...existing, status };
      rows.set(key(newsletterChatId, subscriberUserId), updated);
      return updated;
    },
    async get(newsletterChatId, subscriberUserId) {
      return rows.get(key(newsletterChatId, subscriberUserId)) ?? null;
    },
    async countActive(newsletterChatId) {
      return [...rows.values()].filter(
        (r) => r.newsletterChatId === newsletterChatId && r.status === "active",
      ).length;
    },
  };
}
