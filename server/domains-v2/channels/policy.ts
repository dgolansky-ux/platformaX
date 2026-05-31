/**
 * channels — pure policy. NO membership checks here (community authority is
 * resolved by application-v2 via communities public-api before reaching this
 * service). Channels domain owns slug shape, ownership shape, and lead
 * limits (1–5 active leads per channel).
 */
import type { ChannelLeadPermission, ChannelLeadRole } from "./contracts";
import {
  CHANNEL_LEAD_PERMISSIONS,
  MAX_ACTIVE_LEADS,
  MIN_ACTIVE_LEADS,
} from "./contracts";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const LEAD_ROLES: readonly ChannelLeadRole[] = ["lead", "co_lead"];

export function isValidChannelSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

export function hasCommunityOwner(ownerType: string, ownerId: string): boolean {
  return ownerType === "community" && ownerId.trim().length > 0;
}

export function isValidLeadRole(value: string): value is ChannelLeadRole {
  return (LEAD_ROLES as readonly string[]).includes(value);
}

export function isValidLeadPermission(value: string): value is ChannelLeadPermission {
  return (CHANNEL_LEAD_PERMISSIONS as readonly string[]).includes(value);
}

/** Reject duplicates and unknown permission strings. */
export function normalizeLeadPermissions(input: readonly string[] | undefined): ChannelLeadPermission[] {
  if (!input) return [...CHANNEL_LEAD_PERMISSIONS];
  const seen = new Set<ChannelLeadPermission>();
  for (const p of input) {
    if (isValidLeadPermission(p)) seen.add(p);
  }
  return [...seen];
}

export function canAddMoreLeads(activeCount: number): boolean {
  return activeCount < MAX_ACTIVE_LEADS;
}

export function canRemoveLead(activeCount: number): boolean {
  return activeCount > MIN_ACTIVE_LEADS;
}

export function leadHasPermission(
  permissions: readonly ChannelLeadPermission[],
  required: ChannelLeadPermission,
): boolean {
  return permissions.includes(required);
}

export function canPublishChannelContent(permissions: readonly ChannelLeadPermission[]): boolean {
  return leadHasPermission(permissions, "publish_channel_content");
}

export function canManageChannelContent(permissions: readonly ChannelLeadPermission[]): boolean {
  return leadHasPermission(permissions, "manage_channel_content");
}

export function canPinChannelPost(permissions: readonly ChannelLeadPermission[]): boolean {
  return leadHasPermission(permissions, "pin_channel_post");
}

export function canViewChannelFeed(args: {
  visibility: "public" | "private";
  viewerFollows: boolean;
  viewerIsLead: boolean;
  viewerIsCommunityManager: boolean;
}): boolean {
  if (args.visibility === "public") return true;
  return args.viewerIsLead || args.viewerIsCommunityManager || args.viewerFollows;
}
