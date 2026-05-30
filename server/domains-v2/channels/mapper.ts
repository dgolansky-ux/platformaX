/**
 * channels — record → public DTO. No PII; no internal fields beyond the
 * public channel/lead/follow shape.
 */
import type { ChannelLeadDTO, ChannelPublicDTO } from "./dto";
import type { ChannelInteractionSettingsDTO } from "./interaction-settings";
import type { ChannelInteractionSettingsRecord, ChannelLeadRecord, ChannelRecord } from "./ports";

export function toChannelPublicDTO(r: ChannelRecord, followerCount: number, leadCount: number): ChannelPublicDTO {
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
    leadCount,
  };
}

export function toChannelLeadDTO(r: ChannelLeadRecord): ChannelLeadDTO {
  return {
    channelId: r.channelId,
    userId: r.userId,
    role: r.role,
    permissions: r.permissions,
    status: r.status,
    assignedByUserId: r.assignedByUserId,
    assignedAt: r.assignedAt,
  };
}

export function toChannelInteractionSettingsDTO(r: ChannelInteractionSettingsRecord): ChannelInteractionSettingsDTO {
  return {
    channelId: r.channelId,
    commentsEnabled: r.commentsEnabled,
    reactionsEnabled: r.reactionsEnabled,
    commentPolicy: r.commentPolicy,
    moderationPolicy: r.moderationPolicy,
    updatedAt: r.updatedAt,
  };
}
