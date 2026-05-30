/**
 * newsletter-chat-v2 — DTOs. Status: FOUNDATION_READY (in-memory).
 *
 * privacy classification: Public DTO — newsletter metadata + messages. No PII.
 * Subscriber lists are NOT public — only counts are exposed publicly.
 *
 * NO email delivery. NO push notifications. NO 1:1 chat. Newsletter chat is a
 * one-way broadcast surface from the owner to subscribers, presented in a
 * chat-like layout.
 */

export type NewsletterOwnerType = "profile" | "community";
export type NewsletterVisibility = "public_preview" | "subscribers_only" | "members_only";
export type NewsletterStatus = "active" | "paused" | "archived";
export type NewsletterMessageStatus = "published" | "edited" | "deleted";
export type NewsletterSubscriberStatus = "active" | "muted" | "unsubscribed";

export interface NewsletterChatDTO {
  id: string;
  ownerType: NewsletterOwnerType;
  ownerId: string;
  title: string;
  description: string;
  visibility: NewsletterVisibility;
  status: NewsletterStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterChatPublicDTO {
  id: string;
  ownerType: NewsletterOwnerType;
  ownerId: string;
  title: string;
  description: string;
  visibility: NewsletterVisibility;
  status: NewsletterStatus;
  updatedAt: string;
  subscriberCount: number;
}

export interface NewsletterMessageDTO {
  id: string;
  newsletterChatId: string;
  authorUserId: string;
  body: string;
  status: NewsletterMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterMessagePublicDTO {
  id: string;
  newsletterChatId: string;
  body: string;
  status: NewsletterMessageStatus;
  createdAt: string;
  updatedAt: string;
}

export interface NewsletterSubscriberDTO {
  newsletterChatId: string;
  subscriberUserId: string;
  status: NewsletterSubscriberStatus;
  createdAt: string;
}

export interface CreateNewsletterChatInput {
  ownerType: NewsletterOwnerType;
  ownerId: string;
  title: string;
  description: string;
  visibility: NewsletterVisibility;
  createdByUserId: string;
}

export interface UpdateNewsletterChatInput {
  newsletterChatId: string;
  actorUserId: string;
  title?: string;
  description?: string;
  visibility?: NewsletterVisibility;
  status?: NewsletterStatus;
}

export interface PublishNewsletterMessageInput {
  newsletterChatId: string;
  authorUserId: string;
  body: string;
}

export const NEWSLETTER_LIMITS = {
  TITLE_MAX: 80,
  DESCRIPTION_MAX: 500,
  MESSAGE_BODY_MAX: 4000,
} as const;
