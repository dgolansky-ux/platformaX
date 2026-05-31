/**
 * content-v2/workplace-teasers — record → public DTO.
 *
 * The target route is computed deterministically here; the UI just navigates.
 */
import type { WorkplaceTeaserPublicDTO, WorkplaceTeaserRecord } from "./dto";

export function workplacePostRoute(workplaceSlug: string, sourcePostId: string): string {
  return `/profile/workplaces/${workplaceSlug}/posts/${sourcePostId}`;
}

export function toWorkplaceTeaserPublic(record: WorkplaceTeaserRecord): WorkplaceTeaserPublicDTO {
  return {
    id: record.id,
    sourceType: record.sourceType,
    sourcePostId: record.sourcePostId,
    workplaceId: record.workplaceId,
    workplaceName: record.workplaceName,
    workplaceSlug: record.workplaceSlug,
    ownerUserId: record.ownerUserId,
    previewText: record.previewText,
    previewMediaRef: record.previewMediaRef,
    visibility: record.visibility,
    createdAt: record.createdAt,
    targetRoute: workplacePostRoute(record.workplaceSlug, record.sourcePostId),
  };
}
