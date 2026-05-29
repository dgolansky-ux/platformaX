/**
 * shared/contracts/communities — public frontend-facing community DTOs.
 *
 * privacy classification: Public DTO. Records contain only public community
 * metadata: no email/phone/PII. User ids are reference identifiers, not PII.
 *
 * Action input shapes and the action result envelope live in the sibling
 * module `communities-actions.ts` to keep the public-surface count bounded.
 */

declare const __communityBrand: unique symbol;

export type CommunityId = string & { readonly [__communityBrand]?: "CommunityId" };

export type CommunityVisibility = "public" | "private" | "unlisted";

export type CommunityRole = "founder" | "admin" | "moderator" | "member";

export type CommunityViewerRelation =
  | "founder"
  | "admin"
  | "moderator"
  | "member"
  | "requested"
  | "not_member";

export type CommunityCategoryDTO = {
  slug: string;
  name: string;
  emoji: string;
  sortOrder: number;
};

export type CommunityCardDTO = {
  id: CommunityId;
  slug: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  memberCount: number;
  viewerRole?: "founder" | "admin" | "member";
  viewerRelation?: CommunityViewerRelation;
  categorySlug?: string | null;
  bannerGradientIdx?: number;
  tags?: readonly string[];
};

export type CommunitiesShellData = {
  myCommunities: readonly CommunityCardDTO[];
  discoverCommunities: readonly CommunityCardDTO[];
  recommendedCommunities?: readonly CommunityCardDTO[];
  categories?: readonly CommunityCategoryDTO[];
};

export type CommunityProfileDTO = {
  id: CommunityId;
  slug: string;
  name: string;
  description: string;
  visibility: CommunityVisibility;
  memberCount: number;
  viewerRelation: CommunityViewerRelation;
  canManage: boolean;
};

export type CommunityMemberSummaryDTO = {
  userId: string;
  displayName: string;
  role: CommunityRole;
  joinedAt: string;
};

export type CommunityJoinRequestSummaryDTO = {
  id: string;
  requesterUserId: string;
  requesterDisplayName: string;
  createdAt: string;
};

export type CommunityModuleSummaryDTO = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
};

export type CommunityChannelSummaryDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  followerCount: number;
  viewerFollows: boolean;
};

export type CommunityHubViewDTO = {
  owner: {
    id: CommunityId;
    slug: string;
    name: string;
    visibility: CommunityVisibility;
  };
  modules: readonly CommunityModuleSummaryDTO[];
  channels: readonly CommunityChannelSummaryDTO[];
};

export function toCommunityId(id: string): CommunityId {
  return id as CommunityId;
}

// Re-export action shapes so existing `from "@shared/contracts/communities"`
// imports continue to compile without flooding the export count.
export type {
  CreateCommunityInput,
  UpdateCommunitySettingsInput,
  CreateCommunityChannelInput,
  DecideJoinRequestInput,
  ToggleCommunityModuleInput,
  ChangeCommunityMemberRoleInput,
  CommunityActionError,
  CommunityActionResult,
} from "./communities-actions";
