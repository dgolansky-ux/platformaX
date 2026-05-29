/**
 * channels — record → public DTO. No PII; no internal fields beyond the
 * public channel shape.
 */
import type { ChannelPublicDTO } from "./dto";
import type { ChannelRecord } from "./ports";

export function toChannelPublicDTO(r: ChannelRecord, followerCount: number): ChannelPublicDTO {
  return {
    id: r.id,
    ownerType: r.ownerType,
    ownerId: r.ownerId,
    slug: r.slug,
    name: r.name,
    description: r.description,
    visibility: r.visibility,
    status: r.status,
    followerCount,
  };
}
