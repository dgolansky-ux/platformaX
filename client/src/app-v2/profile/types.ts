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
  visibility: "public" | "friends";
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

/** Owner's personal profile, as rendered in the mobile shell. No private PII. */
export type PersonalProfileView = {
  displayName: string;
  avatarInitial: string;
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
