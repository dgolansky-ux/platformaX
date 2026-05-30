/**
 * newsletter-chat-v2 — mapper. Internal DTOs → public projections.
 *
 * Authors are NOT exposed publicly on individual messages (the owner identity
 * is already attached to the newsletter chat itself). Subscriber identities
 * are NEVER exposed publicly — only counts.
 */
import type {
  NewsletterChatDTO,
  NewsletterChatPublicDTO,
  NewsletterMessageDTO,
  NewsletterMessagePublicDTO,
} from "./dto";

export function toNewsletterChatPublic(
  chat: NewsletterChatDTO,
  subscriberCount: number,
): NewsletterChatPublicDTO {
  return {
    id: chat.id,
    ownerType: chat.ownerType,
    ownerId: chat.ownerId,
    title: chat.title,
    description: chat.description,
    visibility: chat.visibility,
    status: chat.status,
    updatedAt: chat.updatedAt,
    subscriberCount,
  };
}

export function toNewsletterMessagePublic(message: NewsletterMessageDTO): NewsletterMessagePublicDTO {
  return {
    id: message.id,
    newsletterChatId: message.newsletterChatId,
    body: message.body,
    status: message.status,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}
