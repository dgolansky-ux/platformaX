/**
 * topics-v2 — mapper. Internal DTO → public projection. No createdBy leak.
 */
import type { TopicDTO, TopicPublicDTO } from "./dto";

export function toTopicPublic(topic: TopicDTO): TopicPublicDTO {
  return {
    id: topic.id,
    ownerType: topic.ownerType,
    ownerId: topic.ownerId,
    title: topic.title,
    description: topic.description,
    slug: topic.slug,
    visibility: topic.visibility,
    status: topic.status,
    updatedAt: topic.updatedAt,
  };
}
