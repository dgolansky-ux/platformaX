/**
 * identity — domain events
 *
 * Events published by identity. Other domains may subscribe to these to react
 * to profile lifecycle changes (e.g. search reindex, public summary refresh).
 *
 * Payloads carry only stable, PII-free fields. PII never leaves the domain via
 * events — consumers must call identity public API if they need private data.
 */
import type { UserId } from "./contracts";

export type OnboardingCompletedEvent = {
  type: "identity.onboarding.completed";
  userId: UserId;
  at: string;
};

export type ProfilePublicSummaryChangedEvent = {
  type: "identity.profile.public_summary_changed";
  userId: UserId;
  at: string;
};

export type IdentityEvent =
  | OnboardingCompletedEvent
  | ProfilePublicSummaryChangedEvent;
