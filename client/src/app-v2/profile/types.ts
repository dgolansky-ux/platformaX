/**
 * Personal profile mobile shell — view models.
 *
 * UI_SHELL_ONLY / MOCK_LOCAL_ONLY. These shapes are deliberately limited to
 * what a personal profile renders publicly. Private PII (phone, dateOfBirth,
 * private contact email) is intentionally NOT part of this view model — it
 * belongs to a private identity contract, never to this shell.
 */

export type ProfileViewMode = "personal" | "professional";

export type ProfilePreviewKind = "none" | "friend" | "stranger";

export type SocialLinkKind = "linkedin" | "github" | "instagram" | "website";

export type SocialLink = {
  id: string;
  kind: SocialLinkKind;
  label: string;
  url: string;
};

export type ProfileStatus = {
  emoji: string;
  state: string;
  description: string | null;
  /** Mirrors identity PersonalStatusVisibility 1:1 (no UI lie): public/friends/private. */
  visibility: "public" | "friends" | "private";
};

export type ContactCategory =
  | "all"
  | "close"
  | "family_close"
  | "family_extended";

export type ProfileContact = {
  id: string;
  firstName: string;
  lastName: string;
  initial: string;
  online: boolean;
  category: Exclude<ContactCategory, "all">;
};

export type QuickFeedItem = {
  id: string;
  authorInitial: string;
  authorName: string;
};

/**
 * Auth-gated state machine surfaced by the profile data layer and consumed by
 * presentational sections (e.g. ProfileRuntimeBanner). Lives in the shell types
 * so presentational components never import the data layer.
 */
export type ProfileDataState =
  | { kind: "loading" }
  | { kind: "anonymous" }
  | {
      kind: "ready";
      userId: string;
      view: PersonalProfileView;
      isPersistent: boolean;
    }
  | { kind: "empty"; userId: string }
  | { kind: "error"; message: string };

/** Owner's personal profile, as rendered in the mobile shell. No private PII. */
export type PersonalProfileView = {
  /** Identity user id, when this view was hydrated from the identity boundary. */
  userId: string | null;
  displayName: string;
  avatarInitial: string;
  /** Public media URL for the avatar asset, or null if no asset / storage not ready. */
  avatarUrl: string | null;
  /** Public media URL for the banner asset, or null if no asset / storage not ready. */
  bannerUrl: string | null;
  location: string | null;
  bio: string | null;
  status: ProfileStatus | null;
  socialLinks: ReadonlyArray<SocialLink>;
  contacts: ReadonlyArray<ProfileContact>;
  quickFeed: ReadonlyArray<QuickFeedItem>;
  presentationPostCount: number;
  milestoneCount: number;
  isOwner: boolean;
};
