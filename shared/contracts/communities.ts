/**
 * shared/contracts/communities — public frontend-facing community DTOs.
 *
 * privacy classification: Public DTO. These records intentionally contain only
 * public community metadata: no member identities, invites, join requests or PII.
 */

declare const __communityBrand: unique symbol;

export type CommunityId = string & { readonly [__communityBrand]?: "CommunityId" };

export type CommunityVisibility = "public" | "private" | "unlisted";

export type CommunityViewerRole = "founder" | "admin" | "member";

export type CommunityCardDTO = {
  id: CommunityId;
  slug: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  memberCount: number;
  viewerRole?: CommunityViewerRole;
};

export type CommunitiesShellData = {
  myCommunities: readonly CommunityCardDTO[];
  discoverCommunities: readonly CommunityCardDTO[];
};

export function toCommunityId(id: string): CommunityId {
  return id as CommunityId;
}
