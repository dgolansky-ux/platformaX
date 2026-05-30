/**
 * QUALITY_STRUCTURE_EXCEPTION: Slice 12 canonical UI contract surface
 * (workplace + post + teaser + professional-layer view types) kept in one
 * file until the wire-format stabilizes past the foundation slice.
 *
 * features-v2/professional-profile — UI types. Mirrors the application-v2
 * view DTOs so the frontend never imports `@server/*`.
 *
 * Workplace is part of the professional layer of the personal profile. It is
 * NOT a community — no members, no roles, no join flow.
 */

export type WorkplaceStatusUi = "draft" | "active" | "archived";
export type WorkplaceVisibilityUi = "public" | "friends_only" | "private";
export type WorkplaceContactVisibilityUi =
  | "owner_only"
  | "friends"
  | "approved_contact_fields"
  | "public";
export type WorkplacePostTypeUi =
  | "update"
  | "realization"
  | "offer"
  | "photo_note"
  | "announcement";
export type WorkplacePostVisibilityUi = "workplace_public" | "friends_only" | "private";

export interface WorkplaceOwnerSummaryUi {
  userId: string;
  displayName: string;
  handle: string | null;
  avatarRef: string | null;
}

export interface WorkplaceCardUi {
  workplaceId: string;
  ownerUserId: string;
  name: string;
  slug: string;
  headline: string;
  logoRef: string | null;
  status: WorkplaceStatusUi;
  visibility: WorkplaceVisibilityUi;
}

export interface WorkplacePublicUi {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  professionCategorySlug: string | null;
  professionSlug: string | null;
  specializationSlugs: readonly string[];
  websiteUrl: string | null;
  locationText: string | null;
  onlineAvailable: boolean;
  logoRef: string | null;
  bannerRef: string | null;
  status: WorkplaceStatusUi;
  visibility: WorkplaceVisibilityUi;
  createdAt: string;
  updatedAt: string;
}

export interface WorkplaceContactViewUi {
  workplaceId: string;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  visibility: WorkplaceContactVisibilityUi;
  viewerCanContact: boolean;
}

export interface WorkplaceViewerStateUi {
  workplaceId: string;
  isOwner: boolean;
  viewerCanView: boolean;
  viewerCanEdit: boolean;
  viewerCanPostInMicroFeed: boolean;
  viewerCanContact: boolean;
}

export interface WorkplacePageUi {
  workplace: WorkplacePublicUi;
  owner: WorkplaceOwnerSummaryUi;
  contact: WorkplaceContactViewUi;
  viewerState: WorkplaceViewerStateUi;
}

export interface WorkplacePostUi {
  id: string;
  workplaceId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  postType: WorkplacePostTypeUi;
  visibility: WorkplacePostVisibilityUi;
  status: "published" | "edited" | "deactivated";
  createdAt: string;
  updatedAt: string;
}

export interface WorkplaceMicroFeedItemUi {
  post: WorkplacePostUi;
  author: WorkplaceOwnerSummaryUi;
}

export interface WorkplaceMicroFeedPageUi {
  workplaceId: string;
  items: readonly WorkplaceMicroFeedItemUi[];
  nextCursor: string | null;
}

export interface ProfessionalLayerItemUi {
  workplaceId: string;
  ownerUserId: string;
  name: string;
  slug: string;
  headline: string;
  logoRef: string | null;
  status: WorkplaceStatusUi;
  visibility: WorkplaceVisibilityUi;
}

export interface ProfessionalLayerUi {
  profileOwnerId: string;
  viewerRelation: "owner" | "friend" | "stranger";
  workplaces: readonly ProfessionalLayerItemUi[];
  canAddWorkplace: boolean;
}

export interface WorkplaceTeaserUi {
  id: string;
  sourcePostId: string;
  workplaceId: string;
  workplaceName: string;
  workplaceSlug: string;
  ownerUserId: string;
  previewText: string;
  previewMediaRef: string | null;
  visibility: "friends_only" | "public";
  createdAt: string;
  targetRoute: string;
}

export interface WorkplaceTeaserItemUi {
  teaser: WorkplaceTeaserUi;
  owner: WorkplaceOwnerSummaryUi;
}

export interface WorkplaceTeaserPageUi {
  items: readonly WorkplaceTeaserItemUi[];
  nextCursor: string | null;
}

export interface CreateWorkplaceInputUi {
  viewerUserId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  professionCategorySlug: string | null;
  professionSlug: string | null;
  websiteUrl: string;
  contactEmail: string;
  contactPhone: string;
  contactVisibility: WorkplaceContactVisibilityUi;
  locationText: string;
  onlineAvailable: boolean;
  visibility: WorkplaceVisibilityUi;
}

export interface CreateWorkplacePostInputUi {
  viewerUserId: string;
  workplaceId: string;
  body: string;
  postType: WorkplacePostTypeUi;
  visibility: WorkplacePostVisibilityUi;
}

export type ProfessionalProfileAdapterResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_FAILED" | "CONFLICT" | "LIMIT_REACHED" | "ADAPTER_FAILURE"; message: string } };
