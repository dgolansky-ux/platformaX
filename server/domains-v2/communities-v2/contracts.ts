/**
 * communities-v2 — cross-domain contracts. Other domains (channels,
 * public-hub) may import ONLY these types — never the repository/service.
 *
 * No PII: a community summary is public reference data.
 */
import type { CommunityVisibility } from "./dto";

/** Minimal public community reference for cross-domain composition. */
export type CommunityPublicSummary = {
  id: string;
  slug: string;
  name: string;
  visibility: CommunityVisibility;
};

/**
 * Authority probe other domains/use-cases call to check whether a user may
 * act for a community (e.g. channels creating a channel). Implemented by the
 * communities service; consumed via public-api.
 */
export interface CommunityAuthorityResolver {
  canManageCommunity(communityId: string, userId: string): Promise<boolean>;
  getPublicSummary(communityId: string): Promise<CommunityPublicSummary | null>;
}
