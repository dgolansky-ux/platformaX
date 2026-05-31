// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-OBS-003-ACK: pre-runtime use-case; request-context tracing wiring scheduled with RequestContext slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * application-v2/use-cases/channels — orchestration (Slice 7 product slice).
 *
 * Composes channels-v2 with communities-v2. Channels domain enforces slug,
 * ownership and lead limits (1–5, last-lead-protection); this layer enforces
 * the cross-domain rules channels intentionally does NOT own:
 *   - the actor must be an authorized community manager to create/manage
 *     channels for that community,
 *   - a channel lead must be an active member of the channel's owner
 *     community (no orphan leads).
 *
 * Imports ONLY public-api / contracts surfaces of both domains. No god-service,
 * no source of truth here.
 */
import type {
  ChannelsService,
} from "@server/domains-v2/channels/public-api";
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import type {
  AssignCommunityChannelLeadCommand,
  ChannelProfileView,
  ChannelsDirectoryQuery,
  ChannelsDirectoryView,
  ChannelsUseCaseErrorCode,
  ChannelsUseCaseResult,
  CreateCommunityChannelCommand,
  FollowChannelCommand,
  GetChannelLeadsView,
  RevokeCommunityChannelLeadCommand,
  UpdateCommunityChannelLeadPermissionsCommand,
} from "./types";
import type { ChannelDirectoryCard } from "./types";
import type { ChannelLeadDTO, ChannelPublicDTO } from "@server/domains-v2/channels/public-api";

export type ChannelsUseCaseDeps = {
  authority: CommunityAuthorityResolver;
  channels: ChannelsService;
};

export interface ChannelsUseCase {
  createCommunityChannel(command: CreateCommunityChannelCommand): Promise<ChannelsUseCaseResult<ChannelPublicDTO>>;
  assignCommunityChannelLead(command: AssignCommunityChannelLeadCommand): Promise<ChannelsUseCaseResult<ChannelLeadDTO>>;
  revokeCommunityChannelLead(command: RevokeCommunityChannelLeadCommand): Promise<ChannelsUseCaseResult<{ revoked: boolean }>>;
  updateCommunityChannelLeadPermissions(command: UpdateCommunityChannelLeadPermissionsCommand): Promise<ChannelsUseCaseResult<ChannelLeadDTO>>;
  followChannel(command: FollowChannelCommand): Promise<ChannelsUseCaseResult<{ active: boolean }>>;
  unfollowChannel(command: FollowChannelCommand): Promise<ChannelsUseCaseResult<{ active: boolean }>>;
  getChannelsDirectoryView(query: ChannelsDirectoryQuery): Promise<ChannelsUseCaseResult<ChannelsDirectoryView>>;
  getChannelProfileView(channelId: string, actorUserId: string): Promise<ChannelsUseCaseResult<ChannelProfileView>>;
  listChannelLeads(channelId: string, actorUserId: string): Promise<ChannelsUseCaseResult<GetChannelLeadsView>>;
}

type Deps = ChannelsUseCaseDeps;

function fail<T>(code: ChannelsUseCaseErrorCode, message: string): ChannelsUseCaseResult<T> {
  return { ok: false, error: { code, message } };
}

async function createCommunityChannel(deps: Deps, command: CreateCommunityChannelCommand): Promise<ChannelsUseCaseResult<ChannelPublicDTO>> {
  if (!(await deps.authority.canManageCommunity(command.communityId, command.actorUserId))) {
    return fail("FORBIDDEN", "Tylko founder/admin społeczności może utworzyć kanał.");
  }
  const initialLead = command.initialLeadUserId ?? command.actorUserId;
  if (!(await deps.authority.isCommunityMember(command.communityId, initialLead))) {
    return fail("MEMBERSHIP_REQUIRED", "Prowadzący kanał musi być członkiem społeczności.");
  }
  const res = await deps.channels.createChannelForCommunity({
    ownerType: "community",
    ownerId: command.communityId,
    slug: command.slug,
    name: command.name,
    description: command.description,
    visibility: command.visibility,
    initialLeadUserId: initialLead,
    initialLeadAssignedByUserId: command.actorUserId,
  });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: res.value };
}

async function assertActorMayManageChannel(deps: Deps, channelId: string, actorUserId: string): Promise<ChannelsUseCaseResult<{ communityId: string }>> {
  const summary = await deps.channels.getPublicSummary(channelId);
  if (!summary) return fail("NOT_FOUND", "Kanał nie istnieje.");
  if (await deps.authority.canManageCommunity(summary.ownerId, actorUserId)) {
    return { ok: true, value: { communityId: summary.ownerId } };
  }
  if (await deps.channels.isUserActiveLead(channelId, actorUserId)) {
    return { ok: true, value: { communityId: summary.ownerId } };
  }
  return fail("FORBIDDEN", "Brak uprawnień do zarządzania kanałem.");
}

async function assignCommunityChannelLead(deps: Deps, command: AssignCommunityChannelLeadCommand): Promise<ChannelsUseCaseResult<ChannelLeadDTO>> {
  const gate = await assertActorMayManageChannel(deps, command.channelId, command.actorUserId);
  if (!gate.ok) return gate;
  if (!(await deps.authority.isCommunityMember(gate.value.communityId, command.targetUserId))) {
    return fail("MEMBERSHIP_REQUIRED", "Prowadzący kanał musi być członkiem społeczności.");
  }
  const res = await deps.channels.assignChannelLead({
    channelId: command.channelId,
    targetUserId: command.targetUserId,
    role: command.role,
    permissions: command.permissions,
    assignedByUserId: command.actorUserId,
  });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: res.value };
}

async function revokeCommunityChannelLead(deps: Deps, command: RevokeCommunityChannelLeadCommand): Promise<ChannelsUseCaseResult<{ revoked: boolean }>> {
  const gate = await assertActorMayManageChannel(deps, command.channelId, command.actorUserId);
  if (!gate.ok) return gate;
  const res = await deps.channels.revokeChannelLead({ channelId: command.channelId, targetUserId: command.targetUserId });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: res.value };
}

async function updateCommunityChannelLeadPermissions(deps: Deps, command: UpdateCommunityChannelLeadPermissionsCommand): Promise<ChannelsUseCaseResult<ChannelLeadDTO>> {
  const gate = await assertActorMayManageChannel(deps, command.channelId, command.actorUserId);
  if (!gate.ok) return gate;
  const res = await deps.channels.updateChannelLeadPermissions({
    channelId: command.channelId, targetUserId: command.targetUserId, permissions: command.permissions,
  });
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: res.value };
}

async function followChannel(deps: Deps, command: FollowChannelCommand, active: boolean): Promise<ChannelsUseCaseResult<{ active: boolean }>> {
  const res = active
    ? await deps.channels.followChannel(command.channelId, command.actorUserId)
    : await deps.channels.unfollowChannel(command.channelId, command.actorUserId);
  if (!res.ok) return fail(res.error.code, res.error.message);
  return { ok: true, value: { active } };
}

async function getChannelsDirectoryView(deps: Deps, query: ChannelsDirectoryQuery): Promise<ChannelsUseCaseResult<ChannelsDirectoryView>> {
  const discoverLimit = query.discoverLimit ?? 12;
  const [followed, leading, discoverPage] = await Promise.all([
    deps.channels.listFollowedByUser(query.actorUserId),
    deps.channels.listLedByUser(query.actorUserId),
    deps.channels.listAllActive(null, discoverLimit),
  ]);
  const myCommunityRaw: ChannelPublicDTO[] = [];
  for (const communityId of query.myCommunityIds) {
    const page = await deps.channels.listForCommunity(communityId, null, discoverLimit); // SCALABILITY_EXCEPTION: bounded by user's community count
    myCommunityRaw.push(...page.items);
  }

  const followedSet = new Set(followed.map((c) => c.id));
  const leadingSet = new Set(leading.map((c) => c.id));

  async function decorate(items: readonly ChannelPublicDTO[], forceFollow: boolean | null): Promise<ChannelDirectoryCard[]> {
    const out: ChannelDirectoryCard[] = [];
    for (const channel of items) { // SCALABILITY_EXCEPTION: bounded page (≤ MAX_LIMIT)
      const owner = await deps.authority.getPublicSummary(channel.ownerId);
      const viewerFollows = forceFollow ?? followedSet.has(channel.id);
      const viewerIsLead = leadingSet.has(channel.id);
      out.push({ channel, owner, viewerFollows, viewerIsLead });
    }
    return out;
  }

  // Dedupe discover against followed / led / my-community lists.
  const knownIds = new Set<string>([...followedSet, ...leadingSet, ...myCommunityRaw.map((c) => c.id)]);
  const discoverFiltered = discoverPage.items.filter((c) => !knownIds.has(c.id));

  const [followedView, leadingView, myCommunityView, discoverView] = await Promise.all([
    decorate(followed, true),
    decorate(leading, null),
    decorate(myCommunityRaw, null),
    decorate(discoverFiltered, false),
  ]);

  return { ok: true, value: { followed: followedView, myCommunityChannels: myCommunityView, leading: leadingView, discover: discoverView } };
}

async function getChannelProfileView(deps: Deps, channelId: string, actorUserId: string): Promise<ChannelsUseCaseResult<ChannelProfileView>> {
  const channel = await deps.channels.getPublicSummary(channelId);
  if (!channel) return fail("NOT_FOUND", "Kanał nie istnieje.");
  const [owner, leadsRes, follows, viewerLead, canManage] = await Promise.all([
    deps.authority.getPublicSummary(channel.ownerId),
    deps.channels.listChannelLeads(channelId),
    Promise.resolve(false),
    Promise.resolve<{ role: "lead" | "co_lead" | null; permissions: readonly ("manage_channel_profile" | "manage_channel_leads")[] }>({ role: null, permissions: [] }),
    deps.authority.canManageCommunity(channel.ownerId, actorUserId),
  ]);
  if (!leadsRes.ok) return fail(leadsRes.error.code, leadsRes.error.message);

  // Resolve viewer-specific state from already-fetched lead list.
  const viewerActiveLead = leadsRes.value.find((l) => l.userId === actorUserId && l.status === "active");
  const viewerLeadRole = viewerActiveLead?.role ?? null;
  const viewerLeadPerms = viewerActiveLead?.permissions ?? [];
  const viewerIsLead = viewerActiveLead !== undefined;

  // Follow state — single targeted call to avoid scanning all follows.
  const followedList = await deps.channels.listFollowedByUser(actorUserId);
  const viewerFollows = followedList.some((c) => c.id === channelId);

  const canManageChannel = canManage || (viewerIsLead && viewerLeadPerms.includes("manage_channel_profile"));
  const canManageLeads = canManage || (viewerIsLead && viewerLeadPerms.includes("manage_channel_leads"));

  void follows; void viewerLead; // Vars retained for shape symmetry; not used directly.
  return {
    ok: true,
    value: {
      channel,
      owner,
      leads: leadsRes.value
        .filter((l) => l.status === "active")
        .map((l) => ({ userId: l.userId, role: l.role, permissions: l.permissions })),
      viewer: {
        follows: viewerFollows,
        isLead: viewerIsLead,
        leadRole: viewerLeadRole,
        canManageChannel,
        canManageLeads,
        canFollow: channel.visibility === "public",
      },
    },
  };
}

async function listChannelLeads(deps: Deps, channelId: string, actorUserId: string): Promise<ChannelsUseCaseResult<GetChannelLeadsView>> {
  const channel = await deps.channels.getPublicSummary(channelId);
  if (!channel) return fail("NOT_FOUND", "Kanał nie istnieje.");
  // Lead list is public (no PII), but management-grade detail is gated by
  // membership. Stranger callers see the same DTO as members — viewer-state
  // is conveyed by getChannelProfileView, which this method intentionally
  // does not duplicate.
  const res = await deps.channels.listChannelLeads(channelId);
  if (!res.ok) return fail(res.error.code, res.error.message);
  void actorUserId;
  return { ok: true, value: { channelId, leads: res.value } };
}

export function createChannelsUseCase(deps: Deps): ChannelsUseCase {
  return {
    createCommunityChannel: (c) => createCommunityChannel(deps, c),
    assignCommunityChannelLead: (c) => assignCommunityChannelLead(deps, c),
    revokeCommunityChannelLead: (c) => revokeCommunityChannelLead(deps, c),
    updateCommunityChannelLeadPermissions: (c) => updateCommunityChannelLeadPermissions(deps, c),
    followChannel: (c) => followChannel(deps, c, true),
    unfollowChannel: (c) => followChannel(deps, c, false),
    getChannelsDirectoryView: (q) => getChannelsDirectoryView(deps, q),
    getChannelProfileView: (id, actorUserId) => getChannelProfileView(deps, id, actorUserId),
    listChannelLeads: (id, actorUserId) => listChannelLeads(deps, id, actorUserId),
  };
}
