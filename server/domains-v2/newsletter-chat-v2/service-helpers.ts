/**
 * newsletter-chat-v2 — service-local helpers (validation + update application).
 * Pure functions, no IO. Keep service.ts under the size guard limit.
 */
import type {
  CreateNewsletterChatInput,
  NewsletterChatDTO,
  NewsletterStatus,
  NewsletterVisibility,
  UpdateNewsletterChatInput,
} from "./dto";
import {
  isNewsletterStatus,
  isNewsletterVisibility,
  validateNewsletterDescription,
  validateNewsletterTitle,
} from "./policy";

export type NewsletterErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "MODULE_NOT_ENABLED"
  | "VALIDATION_FAILED"
  | "INACTIVE";

export type HelperResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: NewsletterErrorCode; message: string } };

export function fail<T>(code: NewsletterErrorCode, message: string): HelperResult<T> {
  return { ok: false, error: { code, message } };
}

export function validateCreate(input: CreateNewsletterChatInput) {
  const t = validateNewsletterTitle(input.title);
  if (t) return t;
  const d = validateNewsletterDescription(input.description);
  if (d) return d;
  if (!isNewsletterVisibility(input.visibility)) return "VISIBILITY_INVALID";
  return null;
}

export type UpdateApplication = {
  title: string;
  description: string;
  visibility: NewsletterVisibility;
  status: NewsletterStatus;
};

export function applyChatUpdate(
  existing: NewsletterChatDTO,
  input: UpdateNewsletterChatInput,
): HelperResult<UpdateApplication> {
  let nextTitle = existing.title;
  if (input.title !== undefined) {
    const e = validateNewsletterTitle(input.title);
    if (e) return fail("VALIDATION_FAILED", e);
    nextTitle = input.title.trim();
  }
  let nextDesc = existing.description;
  if (input.description !== undefined) {
    const e = validateNewsletterDescription(input.description);
    if (e) return fail("VALIDATION_FAILED", e);
    nextDesc = input.description;
  }
  let nextVisibility: NewsletterVisibility = existing.visibility;
  if (input.visibility !== undefined) {
    if (!isNewsletterVisibility(input.visibility)) return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");
    nextVisibility = input.visibility;
  }
  let nextStatus: NewsletterStatus = existing.status;
  if (input.status !== undefined) {
    if (!isNewsletterStatus(input.status)) return fail("VALIDATION_FAILED", "STATUS_INVALID");
    nextStatus = input.status;
  }
  return {
    ok: true,
    value: { title: nextTitle, description: nextDesc, visibility: nextVisibility, status: nextStatus },
  };
}
