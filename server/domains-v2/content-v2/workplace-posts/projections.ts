/**
 * content-v2/workplace-posts — record → public DTO.
 */
import type { WorkplacePostPublicDTO, WorkplacePostRecord } from "./dto";

export function toWorkplacePostPublic(record: WorkplacePostRecord): WorkplacePostPublicDTO {
  const status: WorkplacePostPublicDTO["status"] =
    record.status === "draft" ? "published" : record.status;
  return {
    id: record.id,
    workplaceId: record.workplaceId,
    authorUserId: record.authorUserId,
    body: record.body,
    mediaRefs: record.mediaRefs,
    postType: record.postType,
    visibility: record.visibility,
    status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}
