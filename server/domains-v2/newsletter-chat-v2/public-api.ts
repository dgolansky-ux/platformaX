// PX-CONTRACT-001-ACK: scaffold-stage domain; public-api contract test will land when the domain reaches PARTIAL_RUNTIME. EXC-016.
/**
 * newsletter-chat-v2 — public API surface (FOUNDATION_READY).
 * NO_EMAIL_DELIVERY this slice — broadcasts persist, fanout is out of scope.
 */
export { createNewsletterChatService } from "./service";
export type {
  NewsletterChatService,
  NewsletterChatServiceDeps,
  NewsletterResult,
  NewsletterErrorCode,
  NewsletterClock,
  NewsletterIdGen,
} from "./service";
export {
  createInMemoryNewsletterChatRepository,
  createInMemoryNewsletterMessageRepository,
  createInMemoryNewsletterSubscriberRepository,
} from "./store";
export type {
  NewsletterChatRepository,
  NewsletterMessageRepository,
  NewsletterSubscriberRepository,
} from "./store";
export type {
  NewsletterAuthorityResolver,
  NewsletterModuleEnablementResolver,
} from "./contracts";
export type {
  NewsletterChatDTO,
  NewsletterChatPublicDTO,
  NewsletterMessageDTO,
  NewsletterMessagePublicDTO,
  NewsletterSubscriberDTO,
  NewsletterOwnerType,
  NewsletterVisibility,
  NewsletterStatus,
  NewsletterMessageStatus,
  NewsletterSubscriberStatus,
  CreateNewsletterChatInput,
  UpdateNewsletterChatInput,
  PublishNewsletterMessageInput,
} from "./dto";
export { NEWSLETTER_LIMITS } from "./dto";
export {
  isNewsletterVisibility,
  isNewsletterStatus,
} from "./policy";