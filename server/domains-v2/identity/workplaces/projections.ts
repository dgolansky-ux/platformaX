/**
 * identity/workplaces — record → DTO projections. Strips PII at the boundary.
 */
import type {
  WorkplaceCardDTO,
  WorkplaceContactViewDTO,
  WorkplacePublicDTO,
  WorkplaceRecord,
} from "./dto";
import type { WorkplaceContactRule } from "./contracts";
import { canViewContact } from "./policy";

export function toWorkplacePublic(record: WorkplaceRecord): WorkplacePublicDTO {
  return {
    id: record.id,
    ownerUserId: record.ownerUserId,
    ownerProfileId: record.ownerProfileId,
    name: record.name,
    slug: record.slug,
    headline: record.headline,
    description: record.description,
    professionCategorySlug: record.professionCategorySlug,
    professionSlug: record.professionSlug,
    specializationSlugs: record.specializationSlugs,
    websiteUrl: record.websiteUrl,
    locationText: record.locationText,
    onlineAvailable: record.onlineAvailable,
    logoRef: record.logoRef,
    bannerRef: record.bannerRef,
    status: record.status,
    visibility: record.visibility,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export function toWorkplaceCard(record: WorkplaceRecord): WorkplaceCardDTO {
  return {
    id: record.id,
    ownerUserId: record.ownerUserId,
    name: record.name,
    slug: record.slug,
    headline: record.headline,
    professionCategorySlug: record.professionCategorySlug,
    professionSlug: record.professionSlug,
    logoRef: record.logoRef,
    status: record.status,
    visibility: record.visibility,
  };
}

export function projectContactForViewer(
  record: WorkplaceRecord,
  rule: WorkplaceContactRule,
): WorkplaceContactViewDTO {
  const allowed = canViewContact(rule);
  return {
    workplaceId: record.id,
    websiteUrl: record.websiteUrl,
    contactEmail: allowed ? record.contactEmail : null,
    contactPhone: allowed ? record.contactPhone : null,
    visibility: record.contactVisibility,
    viewerCanContact: allowed && (record.contactEmail !== null || record.contactPhone !== null || record.websiteUrl !== null),
  };
}
