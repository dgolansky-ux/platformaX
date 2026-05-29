/**
 * public-hub — data transfer objects
 * privacy classification: Public DTO
 *
 * Composed, read-only view of a public profile or community hub. Carries only
 * already-public owner summary data (no email/phone/PII) plus the list of
 * enabled modules and the visible section keys. public-hub owns NO data — these
 * DTOs are assembled from other domains' public summaries.
 */

export type HubOwnerType = "profile" | "community";

export type HubSectionKey = "about" | "modules" | "channels" | "feed_preview";

/** Minimal already-public owner identity. No PII. */
export interface HubOwnerSummary {
  ownerType: HubOwnerType;
  ownerId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
  visibility: "public" | "private";
}

export interface HubModuleSummary {
  key: string;
  enabled: boolean;
}

/** The composed hub view returned to read clients. */
export interface HubViewModel {
  ownerType: HubOwnerType;
  ownerId: string;
  owner: HubOwnerSummary;
  modules: HubModuleSummary[];
  sections: HubSectionKey[];
}
