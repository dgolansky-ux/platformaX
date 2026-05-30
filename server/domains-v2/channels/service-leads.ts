import type {
  AssignChannelLeadInput,
  ChannelLeadDTO,
  RevokeChannelLeadInput,
  UpdateChannelLeadPermissionsInput,
} from "./dto";
import { MAX_ACTIVE_LEADS, MIN_ACTIVE_LEADS } from "./contracts";
import { toChannelLeadDTO } from "./mapper";
import type { ChannelLeadRepository, ChannelRepository } from "./ports";
import {
  canAddMoreLeads,
  canRemoveLead,
  isValidLeadRole,
  normalizeLeadPermissions,
} from "./policy";

type Deps = {
  channels: ChannelRepository;
  leads: ChannelLeadRepository;
  clock: { now: () => Date };
};

type LeadResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: "NOT_FOUND" | "INVALID_LEAD_ROLE" | "LEAD_LIMIT_REACHED" | "CANNOT_REMOVE_LAST_LEAD" | "LEAD_NOT_FOUND"; message: string } };

function fail<T>(code: "NOT_FOUND" | "INVALID_LEAD_ROLE" | "LEAD_LIMIT_REACHED" | "CANNOT_REMOVE_LAST_LEAD" | "LEAD_NOT_FOUND", message: string): LeadResult<T> {
  return { ok: false, error: { code, message } };
}

export async function assignChannelLead(deps: Deps, input: AssignChannelLeadInput): Promise<LeadResult<ChannelLeadDTO>> {
  if (!(await deps.channels.getById(input.channelId))) return fail("NOT_FOUND", "Channel not found.");
  if (!isValidLeadRole(input.role)) return fail("INVALID_LEAD_ROLE", "Unknown lead role.");
  const existing = await deps.leads.findActive(input.channelId, input.targetUserId);
  if (!existing) {
    const count = await deps.leads.countActiveForChannel(input.channelId);
    if (!canAddMoreLeads(count)) {
      return fail("LEAD_LIMIT_REACHED", `Channel reached the maximum of ${MAX_ACTIVE_LEADS} active leads.`);
    }
  }
  const now = deps.clock.now().toISOString();
  const { record } = await deps.leads.upsert({
    channelId: input.channelId,
    userId: input.targetUserId,
    role: input.role,
    permissions: normalizeLeadPermissions(input.permissions),
    status: "active",
    assignedByUserId: input.assignedByUserId,
    assignedAt: now,
  });
  return { ok: true, value: toChannelLeadDTO(record) };
}

export async function revokeChannelLead(deps: Deps, input: RevokeChannelLeadInput): Promise<LeadResult<{ revoked: boolean }>> {
  if (!(await deps.channels.getById(input.channelId))) return fail("NOT_FOUND", "Channel not found.");
  const target = await deps.leads.findActive(input.channelId, input.targetUserId);
  if (!target) return fail("LEAD_NOT_FOUND", "User is not an active lead of this channel.");
  const count = await deps.leads.countActiveForChannel(input.channelId);
  if (!canRemoveLead(count)) {
    return fail("CANNOT_REMOVE_LAST_LEAD", `Channel must have at least ${MIN_ACTIVE_LEADS} active lead.`);
  }
  const ok = await deps.leads.revoke(input.channelId, input.targetUserId, deps.clock.now().toISOString());
  return { ok: true, value: { revoked: ok } };
}

export async function updateChannelLeadPermissions(deps: Deps, input: UpdateChannelLeadPermissionsInput): Promise<LeadResult<ChannelLeadDTO>> {
  if (!(await deps.channels.getById(input.channelId))) return fail("NOT_FOUND", "Channel not found.");
  const updated = await deps.leads.updatePermissions(input.channelId, input.targetUserId, normalizeLeadPermissions(input.permissions));
  if (!updated) return fail("LEAD_NOT_FOUND", "User is not an active lead of this channel.");
  return { ok: true, value: toChannelLeadDTO(updated) };
}
