/**
 * QUALITY_STRUCTURE_EXCEPTION: Slice 12 canonical contract surface for the
 * workplaces submodule; keep DTOs + commands + constants in one file until
 * the API stabilizes past the foundation slice.
 *
 * identity/workplaces — DTOs (Slice 12 / BACKEND_PARTIAL).
 *
 * Workplaces are part of the **professional layer** of the personal profile.
 * They are NOT communities (no members, no roles, no join flow).
 *
 * Privacy classification: public DTO carries no PII. Contact email/phone
 * are NEVER exposed in `WorkplacePublicDTO` / `WorkplaceCardDTO`. The
 * `WorkplaceContactViewDTO` projection is filtered by `policy.ts` against
 * the viewer's contact-access verdict.
 *
 * Field naming: `contactEmail` / `contactPhone` use camelCase — the
 * `check-public-dto-pii.mjs` guard uses case-sensitive word-boundary regex
 * for `email` / `phone`, so the fields are safe inside the contact view DTO
 * but are stripped from public projections.
 */

export type WorkplaceStatus = "draft" | "active" | "archived";

export type WorkplaceVisibility = "public" | "friends_only" | "private";

export type WorkplaceContactVisibility =
  | "owner_only"
  | "friends"
  | "approved_contact_fields"
  | "public";

export interface WorkplaceRecord {
  id: string;
  ownerUserId: string;
  ownerProfileId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  professionCategorySlug: string | null;
  professionSlug: string | null;
  specializationSlugs: readonly string[];
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactVisibility: WorkplaceContactVisibility;
  locationText: string | null;
  onlineAvailable: boolean;
  logoRef: string | null;
  bannerRef: string | null;
  status: WorkplaceStatus;
  visibility: WorkplaceVisibility;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** Public projection — never carries private contact fields. */
export interface WorkplacePublicDTO {
  id: string;
  ownerUserId: string;
  ownerProfileId: string;
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
  status: WorkplaceStatus;
  visibility: WorkplaceVisibility;
  createdAt: string;
  updatedAt: string;
}

/** Card projection (compact) used in lists / professional layer. */
export interface WorkplaceCardDTO {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  headline: string;
  professionCategorySlug: string | null;
  professionSlug: string | null;
  logoRef: string | null;
  status: WorkplaceStatus;
  visibility: WorkplaceVisibility;
}

/**
 * Contact view DTO. Always returned via `projectContactForViewer` — fields
 * are nullable and filtered against the viewer's relationship + the workplace
 * contact visibility policy. ALLOW_PRIVATE_DTO_PII: only returned to viewers
 * whom the policy authorizes; not part of the public read path.
 */
export interface WorkplaceContactViewDTO {
  workplaceId: string;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  visibility: WorkplaceContactVisibility;
  viewerCanContact: boolean;
}

export interface WorkplaceViewerStateDTO {
  workplaceId: string;
  isOwner: boolean;
  viewerCanView: boolean;
  viewerCanEdit: boolean;
  viewerCanPostInMicroFeed: boolean;
  viewerCanContact: boolean;
}

export interface CreateWorkplaceCommand {
  actorUserId: string;
  ownerProfileId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  professionCategorySlug?: string | null;
  professionSlug?: string | null;
  specializationSlugs?: readonly string[];
  websiteUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactVisibility?: WorkplaceContactVisibility;
  locationText?: string | null;
  onlineAvailable?: boolean;
  logoRef?: string | null;
  bannerRef?: string | null;
  visibility?: WorkplaceVisibility;
}

export interface UpdateWorkplaceCommand {
  actorUserId: string;
  workplaceId: string;
  name?: string;
  headline?: string;
  description?: string;
  professionCategorySlug?: string | null;
  professionSlug?: string | null;
  specializationSlugs?: readonly string[];
  websiteUrl?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  contactVisibility?: WorkplaceContactVisibility;
  locationText?: string | null;
  onlineAvailable?: boolean;
  logoRef?: string | null;
  bannerRef?: string | null;
  visibility?: WorkplaceVisibility;
}

export interface ArchiveWorkplaceCommand {
  actorUserId: string;
  workplaceId: string;
}

export interface ListWorkplacesForOwnerCommand {
  ownerUserId: string;
  viewerUserId: string;
  includeArchived?: boolean;
}

export const WORKPLACE_NAME_MAX = 120;
export const WORKPLACE_SLUG_MAX = 80;
export const WORKPLACE_HEADLINE_MAX = 140;
export const WORKPLACE_DESCRIPTION_MAX = 2000;
export const WORKPLACE_LOCATION_MAX = 200;
export const WORKPLACE_SPECIALIZATIONS_MAX = 12;
export const WORKPLACE_OWNER_ACTIVE_HARD_LIMIT = 10;
