/**
 * communities-v2 — record → public/admin DTO. Strips internal fields; the
 * public DTO never carries founder id or PII.
 */
import type { CommunityAdminDTO, CommunityPublicDTO, CommunityRole } from "./dto";
import type { CommunityRecord } from "./ports";

export function toPublicCommunityDTO(r: CommunityRecord, memberCount: number): CommunityPublicDTO {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    visibility: r.visibility,
    status: r.status,
    memberCount,
    avatarRef: r.avatarRef,
    bannerRef: r.bannerRef,
    categorySlug: r.categorySlug,
  };
}

export function toAdminCommunityDTO(
  r: CommunityRecord,
  memberCount: number,
  viewerRole: CommunityRole | null,
): CommunityAdminDTO {
  return {
    ...toPublicCommunityDTO(r, memberCount),
    founderUserId: r.founderUserId,
    viewerRole,
  };
}
