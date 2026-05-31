/**
 * application-v2/use-cases/workplace-feed — view DTOs.
 *
 * UI consumes these shapes. Owner public summary is enriched here from
 * identity.public-api so the workplace UI never needs to call identity
 * directly. NO PII: only displayName / handle / avatarRef from the public
 * profile projection.
 */
import type {
  WorkplacePostPublicDTO,
  WorkplaceTeaserPublicDTO,
} from "@server/domains-v2/content-v2/public-api";
import type {
  WorkplaceContactViewDTO,
  WorkplacePublicDTO,
  WorkplaceViewerStateDTO,
} from "@server/domains-v2/identity/workplaces/public-api";

export interface WorkplaceOwnerPublicSummary {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
}

export interface WorkplaceProfessionalLayerItemViewDTO {
  workplaceId: string;
  ownerUserId: string;
  name: string;
  slug: string;
  headline: string;
  logoRef: string | null;
  status: "draft" | "active" | "archived";
  visibility: "public" | "friends_only" | "private";
}

export interface WorkplaceProfessionalLayerViewDTO {
  profileOwnerId: string;
  viewerRelation: "owner" | "friend" | "stranger";
  workplaces: readonly WorkplaceProfessionalLayerItemViewDTO[];
  canAddWorkplace: boolean;
}

export interface WorkplacePageViewDTO {
  workplace: WorkplacePublicDTO;
  owner: WorkplaceOwnerPublicSummary;
  contact: WorkplaceContactViewDTO;
  viewerState: WorkplaceViewerStateDTO;
}

export interface WorkplaceMicroFeedItemViewDTO {
  post: WorkplacePostPublicDTO;
  author: WorkplaceOwnerPublicSummary;
}

export interface WorkplaceMicroFeedPageViewDTO {
  workplaceId: string;
  items: readonly WorkplaceMicroFeedItemViewDTO[];
  nextCursor: string | null;
}

export interface FriendFeedWorkplaceTeaserItemViewDTO {
  teaser: WorkplaceTeaserPublicDTO;
  owner: WorkplaceOwnerPublicSummary;
}

export interface FriendFeedWorkplaceTeaserPageViewDTO {
  items: readonly FriendFeedWorkplaceTeaserItemViewDTO[];
  nextCursor: string | null;
}
