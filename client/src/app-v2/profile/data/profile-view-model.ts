/**
 * app-v2/profile/data — view-model translation
 *
 * Maps the application-layer view DTOs (`OwnerProfileView`, `PublicProfileView`)
 * into the shell's `PersonalProfileView`. Media URL resolution and identity
 * lookups already happen server-side inside the application service, so this
 * layer is a pure projection — no async, no domain composition.
 *
 * Identity-owned fields (location, personal status, social links) are mapped
 * from the real view. Social/contacts/quick-feed remain fixture-backed because
 * the social/content-v2 runtime is not wired yet. Private fields (phone,
 * dateOfBirth, civilStatus) are intentionally NOT projected into this shell.
 * Status photo (`personalStatus.photo`) is TODO_NOT_RENDERED — the shell has no
 * status-photo slot yet.
 */
import type {
  OwnerProfileView,
  PublicProfileView,
} from "../../../features-v2/identity";
import type {
  PersonalStatusView,
  SocialLinks,
} from "@shared/contracts/profile-view";
import {
  ownerPersonalProfile,
  publicPersonalProfile,
} from "../fixtures";
import type {
  PersonalProfileView,
  ProfileStatus,
  SocialLink,
  SocialLinkKind,
} from "../types";

/** First character of a display name; safe for empty/space-only input. */
function initialOf(name: string | null | undefined): string {
  if (!name) return "?";
  const trimmed = name.trim();
  if (trimmed.length === 0) return "?";
  return trimmed[0]!.toUpperCase();
}

const SOCIAL_LABELS: Record<SocialLinkKind, string> = {
  linkedin: "LinkedIn",
  github: "GitHub",
  instagram: "Instagram",
  website: "Strona WWW",
};

const SOCIAL_ORDER: ReadonlyArray<SocialLinkKind> = [
  "linkedin",
  "github",
  "instagram",
  "website",
];

/** Closed social-links map → ordered, render-ready array. */
function toSocialLinkArray(links: SocialLinks | null): SocialLink[] {
  if (!links) return [];
  return SOCIAL_ORDER.filter((kind) => {
    const url = links[kind];
    return typeof url === "string" && url.length > 0;
  }).map((kind) => ({
    id: kind,
    kind,
    label: SOCIAL_LABELS[kind],
    url: links[kind] as string,
  }));
}

/** Map identity status visibility 1:1 onto the shell's status visibility. */
function mapStatusVisibility(
  visibility: PersonalStatusView["visibility"],
): ProfileStatus["visibility"] {
  if (visibility === "friends_only") return "friends";
  return visibility; // "public" | "private"
}

function toProfileStatus(status: PersonalStatusView | null): ProfileStatus | null {
  if (!status) return null;
  return {
    emoji: status.emoji ?? "",
    state: status.text,
    description: status.description,
    visibility: mapStatusVisibility(status.visibility),
  };
}

/** Owner-facing view model — private fields are explicitly excluded. */
export function toOwnerPersonalProfileView(
  view: OwnerProfileView,
): PersonalProfileView {
  return {
    ...ownerPersonalProfile,
    userId: view.profileUserId,
    displayName: view.displayName,
    avatarInitial: initialOf(view.displayName),
    avatarUrl: view.avatar?.url ?? null,
    bannerUrl: view.banner?.url ?? null,
    location: view.location,
    bio: view.bio,
    status: toProfileStatus(view.personalStatus),
    socialLinks: toSocialLinkArray(view.socialLinks),
    isOwner: true,
  };
}

/** Public viewer view model — view DTO has no PII to begin with. */
export function toPublicPersonalProfileView(
  view: PublicProfileView,
): PersonalProfileView {
  return {
    ...publicPersonalProfile,
    userId: view.profileUserId,
    displayName: view.displayName,
    avatarInitial: initialOf(view.displayName),
    avatarUrl: view.avatar?.url ?? null,
    bannerUrl: view.banner?.url ?? null,
    location: view.location,
    bio: view.bio,
    status: toProfileStatus(view.personalStatus),
    socialLinks: toSocialLinkArray(view.socialLinks),
    isOwner: false,
  };
}
