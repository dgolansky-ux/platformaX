/**
 * app-v2/profile/data — view-model translation
 *
 * Maps the application-layer view DTOs (`OwnerProfileView`, `PublicProfileView`)
 * into the shell's `PersonalProfileView`. Media URL resolution and identity
 * lookups already happen server-side inside the application service, so this
 * layer is now a pure projection — no async, no domain composition.
 */
import type {
  OwnerProfileView,
  PublicProfileView,
} from "../../../features-v2/identity";
import {
  ownerPersonalProfile,
  publicPersonalProfile,
} from "../fixtures";
import type { PersonalProfileView } from "../types";

/** First character of a display name; safe for empty/space-only input. */
function initialOf(name: string | null | undefined): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return trimmed[0]!.toUpperCase();
}

/** Owner-facing view model — private fields are explicitly excluded. */
export function toOwnerPersonalProfileView(
  view: OwnerProfileView,
): PersonalProfileView {
  return {
    ...ownerPersonalProfile,
    userId: view.userId,
    displayName: view.displayName,
    avatarInitial: initialOf(view.displayName),
    avatarUrl: view.avatar?.url ?? null,
    bannerUrl: view.banner?.url ?? null,
    bio: view.bio,
    isOwner: true,
  };
}

/** Public viewer view model — view DTO has no PII to begin with. */
export function toPublicPersonalProfileView(
  view: PublicProfileView,
): PersonalProfileView {
  return {
    ...publicPersonalProfile,
    userId: view.userId,
    displayName: view.displayName,
    avatarInitial: initialOf(view.displayName),
    avatarUrl: view.avatar?.url ?? null,
    bannerUrl: view.banner?.url ?? null,
    bio: view.bio,
    isOwner: false,
  };
}
