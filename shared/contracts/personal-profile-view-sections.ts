/**
 * shared/contracts/personal-profile-view-sections — per-section sub-DTOs.
 *
 * Pulled out of `personal-profile-view.ts` so the main file fits the
 * structural budget while the canonical contract for the unified profile
 * view stays in one cohesive module via re-exports.
 *
 * Privacy classification: Public DTO — these shapes carry only already-public
 * workplace / hub / channels summary data and friend-feed availability flags.
 */

export type ProfileWorkplaceVisibility = "public" | "friends_only" | "private";

export interface ProfileWorkplaceCardDTO {
  workplaceId: string;
  ownerUserId: string;
  name: string;
  slug: string;
  headline: string;
  logoRef: string | null;
  visibility: ProfileWorkplaceVisibility;
}

export interface ProfileWorkplacesPreviewDTO {
  items: readonly ProfileWorkplaceCardDTO[];
  canAddWorkplace: boolean;
  totalVisibleCount: number;
}

export interface ProfilePublicHubModuleDTO {
  key: string;
  enabled: boolean;
}

export type ProfilePublicHubSection =
  | "about"
  | "modules"
  | "channels"
  | "feed_preview";

export interface ProfilePublicHubDTO {
  modules: readonly ProfilePublicHubModuleDTO[];
  sections: readonly ProfilePublicHubSection[];
  canManageModules: boolean;
}

export interface ProfileChannelsEntryDTO {
  canOpen: boolean;
  targetRoute: string;
  channelCount: number | null;
}

export type ProfileFriendFeedAvailabilityReason =
  | "owner"
  | "friend"
  | "stranger"
  | "anonymous"
  | "none";

export interface ProfileFriendFeedPreviewAvailabilityDTO {
  canView: boolean;
  reason: ProfileFriendFeedAvailabilityReason;
  targetRoute: string;
}
