// === Slice 24 PRE-runtime ACK marker (EXC-016) ======================
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK marker =======================================

// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * newsletter-chat-v2 — service. FOUNDATION_READY (in-memory).
 *
 * Owner/admin publishes broadcasts. Subscribers receive only — no inbound.
 * NO email delivery, NO push, NO 1:1 chat. The domain stores messages once;
 * fanout/delivery is an outbox concern that lives outside this slice.
 */
import type {
  CreateNewsletterChatInput,
  NewsletterChatDTO,
  NewsletterChatPublicDTO,
  NewsletterMessageDTO,
  NewsletterMessagePublicDTO,
  NewsletterOwnerType,
  NewsletterSubscriberDTO,
  PublishNewsletterMessageInput,
  UpdateNewsletterChatInput,
} from "./dto";
import { toNewsletterChatPublic, toNewsletterMessagePublic } from "./mapper";
import { validateNewsletterMessageBody } from "./policy";
import type {
  NewsletterAuthorityResolver,
  NewsletterModuleEnablementResolver,
} from "./contracts";
import type {
  NewsletterChatRepository,
  NewsletterMessageRepository,
  NewsletterSubscriberRepository,
} from "./store";
import {
  applyChatUpdate,
  fail,
  validateCreate,
  type NewsletterErrorCode,
} from "./service-helpers";

export type NewsletterClock = { now: () => Date };
export type NewsletterIdGen = { next: () => string };

export type NewsletterChatServiceDeps = {
  chats: NewsletterChatRepository;
  messages: NewsletterMessageRepository;
  subscribers: NewsletterSubscriberRepository;
  authority: NewsletterAuthorityResolver;
  moduleEnablement: NewsletterModuleEnablementResolver;
  clock: NewsletterClock;
  ids: NewsletterIdGen;
};

export type { NewsletterErrorCode };

export type NewsletterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: NewsletterErrorCode; message: string } };

export interface NewsletterChatService {
  createNewsletterChatForOwner(
    input: CreateNewsletterChatInput,
  ): Promise<NewsletterResult<NewsletterChatDTO>>;
  updateNewsletterChat(input: UpdateNewsletterChatInput): Promise<NewsletterResult<NewsletterChatDTO>>;
  publishNewsletterMessage(
    input: PublishNewsletterMessageInput,
  ): Promise<NewsletterResult<NewsletterMessageDTO>>;
  listNewsletterMessages(newsletterChatId: string): Promise<NewsletterMessagePublicDTO[]>;
  listNewsletterChatsForOwner(
    ownerType: NewsletterOwnerType,
    ownerId: string,
  ): Promise<NewsletterChatPublicDTO[]>;
  getNewsletterChatPublicView(
    newsletterChatId: string,
  ): Promise<NewsletterResult<NewsletterChatPublicDTO>>;
  subscribeToNewsletterChat(input: {
    newsletterChatId: string;
    subscriberUserId: string;
  }): Promise<NewsletterResult<NewsletterSubscriberDTO>>;
  unsubscribeFromNewsletterChat(input: {
    newsletterChatId: string;
    subscriberUserId: string;
  }): Promise<NewsletterResult<NewsletterSubscriberDTO>>;
}

type Deps = NewsletterChatServiceDeps;

async function createChat(deps: Deps, input: CreateNewsletterChatInput): Promise<NewsletterResult<NewsletterChatDTO>> {
  const can = await deps.authority.canPublishForOwner(input.createdByUserId, input.ownerType, input.ownerId);
  if (!can) return fail("FORBIDDEN", "Actor cannot create a newsletter chat for this owner.");
  const vErr = validateCreate(input);
  if (vErr) return fail("VALIDATION_FAILED", vErr);
  const now = deps.clock.now().toISOString();
  const chat: NewsletterChatDTO = {
    id: deps.ids.next(),
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: input.description,
    visibility: input.visibility,
    status: "active",
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  };
  await deps.chats.insert(chat);
  return { ok: true, value: chat };
}

async function updateChat(deps: Deps, input: UpdateNewsletterChatInput): Promise<NewsletterResult<NewsletterChatDTO>> {
  const existing = await deps.chats.getById(input.newsletterChatId);
  if (!existing) return fail("NOT_FOUND", "Newsletter chat not found.");
  const can = await deps.authority.canPublishForOwner(input.actorUserId, existing.ownerType, existing.ownerId);
  if (!can) return fail("FORBIDDEN", "Actor cannot update this newsletter chat.");
  const applied = applyChatUpdate(existing, input);
  if (!applied.ok) return applied;
  const updated: NewsletterChatDTO = { ...existing, ...applied.value, updatedAt: deps.clock.now().toISOString() };
  await deps.chats.update(updated);
  return { ok: true, value: updated };
}

async function publishMessage(deps: Deps, input: PublishNewsletterMessageInput): Promise<NewsletterResult<NewsletterMessageDTO>> {
  const chat = await deps.chats.getById(input.newsletterChatId);
  if (!chat) return fail("NOT_FOUND", "Newsletter chat not found.");
  if (chat.status !== "active") return fail("INACTIVE", "Newsletter chat is not active.");
  const can = await deps.authority.canPublishForOwner(input.authorUserId, chat.ownerType, chat.ownerId);
  if (!can) return fail("FORBIDDEN", "Only the owner/admin can publish broadcasts.");
  const bodyErr = validateNewsletterMessageBody(input.body);
  if (bodyErr) return fail("VALIDATION_FAILED", bodyErr);
  const now = deps.clock.now().toISOString();
  const message: NewsletterMessageDTO = {
    id: deps.ids.next(),
    newsletterChatId: chat.id,
    authorUserId: input.authorUserId,
    body: input.body.trim(),
    status: "published",
    createdAt: now,
    updatedAt: now,
  };
  await deps.messages.insert(message);
  return { ok: true, value: message };
}

async function listMessages(deps: Deps, newsletterChatId: string): Promise<NewsletterMessagePublicDTO[]> {
  const chat = await deps.chats.getById(newsletterChatId);
  if (!chat || chat.status === "archived") return [];
  const enabled = await deps.moduleEnablement.isNewsletterChatEnabled(chat.ownerType, chat.ownerId);
  if (!enabled) return [];
  const messages = await deps.messages.listForChat(newsletterChatId);
  return messages.filter((m) => m.status !== "deleted").map(toNewsletterMessagePublic);
}

async function listChatsForOwner(deps: Deps, ownerType: NewsletterOwnerType, ownerId: string): Promise<NewsletterChatPublicDTO[]> {
  const enabled = await deps.moduleEnablement.isNewsletterChatEnabled(ownerType, ownerId);
  if (!enabled) return [];
  const chats = await deps.chats.listForOwner(ownerType, ownerId);
  const result: NewsletterChatPublicDTO[] = [];
  for (const chat of chats) {
    if (chat.status === "archived") continue;
    const subscriberCount = await deps.subscribers.countActive(chat.id);
    result.push(toNewsletterChatPublic(chat, subscriberCount));
  }
  return result;
}

async function getChatPublicView(deps: Deps, newsletterChatId: string): Promise<NewsletterResult<NewsletterChatPublicDTO>> {
  const chat = await deps.chats.getById(newsletterChatId);
  if (!chat) return fail("NOT_FOUND", "Newsletter chat not found.");
  if (chat.status === "archived") return fail("NOT_FOUND", "Newsletter chat archived.");
  const enabled = await deps.moduleEnablement.isNewsletterChatEnabled(chat.ownerType, chat.ownerId);
  if (!enabled) return fail("MODULE_NOT_ENABLED", "Newsletter chat module disabled for owner.");
  const subscriberCount = await deps.subscribers.countActive(chat.id);
  return { ok: true, value: toNewsletterChatPublic(chat, subscriberCount) };
}

async function subscribe(deps: Deps, args: { newsletterChatId: string; subscriberUserId: string }): Promise<NewsletterResult<NewsletterSubscriberDTO>> {
  const chat = await deps.chats.getById(args.newsletterChatId);
  if (!chat) return fail("NOT_FOUND", "Newsletter chat not found.");
  if (chat.status !== "active") return fail("INACTIVE", "Newsletter chat is not active.");
  const enabled = await deps.moduleEnablement.isNewsletterChatEnabled(chat.ownerType, chat.ownerId);
  if (!enabled) return fail("MODULE_NOT_ENABLED", "Newsletter chat module disabled for owner.");
  const subscriber: NewsletterSubscriberDTO = {
    newsletterChatId: chat.id,
    subscriberUserId: args.subscriberUserId,
    status: "active",
    createdAt: deps.clock.now().toISOString(),
  };
  const stored = await deps.subscribers.upsert(subscriber);
  return { ok: true, value: stored };
}

async function unsubscribe(deps: Deps, args: { newsletterChatId: string; subscriberUserId: string }): Promise<NewsletterResult<NewsletterSubscriberDTO>> {
  const updated = await deps.subscribers.setStatus(args.newsletterChatId, args.subscriberUserId, "unsubscribed");
  if (!updated) return fail("NOT_FOUND", "Subscription not found.");
  return { ok: true, value: updated };
}

export function createNewsletterChatService(deps: NewsletterChatServiceDeps): NewsletterChatService {
  return {
    createNewsletterChatForOwner: (input) => createChat(deps, input),
    updateNewsletterChat: (input) => updateChat(deps, input),
    publishNewsletterMessage: (input) => publishMessage(deps, input),
    listNewsletterMessages: (id) => listMessages(deps, id),
    listNewsletterChatsForOwner: (ownerType, ownerId) => listChatsForOwner(deps, ownerType, ownerId),
    getNewsletterChatPublicView: (id) => getChatPublicView(deps, id),
    subscribeToNewsletterChat: (args) => subscribe(deps, args),
    unsubscribeFromNewsletterChat: (args) => unsubscribe(deps, args),
  };
}