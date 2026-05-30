/**
 * channels — DTOs. Status: BACKEND_PARTIAL (in-memory runtime).
 *
 * A channel is owned by a community. Channel leads (1–5 active) drive the
 * channel; lead membership in the owner community is enforced by
 * application-v2 (channels domain accepts a pre-validated assignment).
 * Follow is a separate relation from community membership.
 *
 * privacy classification: Public DTO — channels and follows reference user/
 * community ids only, never PII.
 */

import type {
  ChannelLeadPermission,
  ChannelLeadRole,
  ChannelLeadStatus,
} from "./contracts";

export type ChannelOwnerType = "community";
export type ChannelVisibility = "public" | "private";
export type ChannelStatus = "active" | "archived" | "deleted";
export type FollowStatus = "active" | "unfollowed";

export type ChannelPublicDTO = {
  id: string;
  ownerType: ChannelOwnerType;
  ownerId: string;
  slug: string;
  name: string;
  description: string;
  visibility: ChannelVisibility;
  status: ChannelStatus;
  followerCount: number;
  leadCount: number;
};

export type ChannelLeadDTO = {
  channelId: string;
  userId: string;
  role: ChannelLeadRole;
  permissions: readonly ChannelLeadPermission[];
  status: ChannelLeadStatus;
  assignedByUserId: string;
  assignedAt: string;
};

export type ChannelFollowDTO = {
  channelId: string;
  followerUserId: string;
  status: FollowStatus;
  createdAt: string;
};

export type CreateChannelInput = {
  ownerType: ChannelOwnerType;
  ownerId: string;
  slug: string;
  name: string;
  description?: string;
  visibility?: ChannelVisibility;
  /** Initial lead — assigned atomically with channel creation so the channel
   * always satisfies MIN_ACTIVE_LEADS=1. Must already be verified as an active
   * community member by the caller (application-v2 enforces this). */
  initialLeadUserId: string;
  initialLeadAssignedByUserId: string;
};

export type AssignChannelLeadInput = {
  channelId: string;
  /** Pre-validated: caller has confirmed the actor may manage leads and that
   * `targetUserId` is an active member of the channel's owner community. */
  targetUserId: string;
  role: ChannelLeadRole;
  permissions?: readonly ChannelLeadPermission[];
  assignedByUserId: string;
};

export type RevokeChannelLeadInput = {
  channelId: string;
  targetUserId: string;
};

export type UpdateChannelLeadPermissionsInput = {
  channelId: string;
  targetUserId: string;
  permissions: readonly ChannelLeadPermission[];
};

export type UpdateChannelProfileInput = {
  channelId: string;
  name?: string;
  description?: string;
  visibility?: ChannelVisibility;
};

