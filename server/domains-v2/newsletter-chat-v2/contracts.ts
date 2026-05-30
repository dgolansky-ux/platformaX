/**
 * newsletter-chat-v2 — cross-domain contracts.
 */
import type { NewsletterOwnerType } from "./dto";

export interface NewsletterAuthorityResolver {
  /** Can this actor publish on behalf of (ownerType, ownerId)? Owner or admin only. */
  canPublishForOwner(
    actorUserId: string,
    ownerType: NewsletterOwnerType,
    ownerId: string,
  ): Promise<boolean>;
}

export interface NewsletterModuleEnablementResolver {
  isNewsletterChatEnabled(ownerType: NewsletterOwnerType, ownerId: string): Promise<boolean>;
}
