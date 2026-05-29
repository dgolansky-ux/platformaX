/**
 * communities-v2 — community feed settings service (Slice 5). Owns the feed
 * configuration row; reuses the community + membership repositories for
 * existence/role. Returns sensible defaults when a community has never
 * customised its feeds. No posts here.
 */
import type {
  CommunityFeedSettingsDTO,
  FeedSettingsResult,
  UpdateCommunityFeedSettingsInput,
} from "./dto-feeds";
import { defaultFeedSettings } from "./dto-feeds";
import {
  canUpdateFeedSettings,
  isValidDescendantRole,
  isValidPostingPolicy,
  isValidRelationalLimit,
} from "./policy-feeds";
import type {
  CommunityFeedSettingsRecord,
  CommunityRepository,
  FeedSettingsRepository,
  MembershipRepository,
} from "./ports";

export type FeedSettingsClock = { now: () => Date };

export type FeedSettingsServiceDeps = {
  communities: CommunityRepository;
  members: MembershipRepository;
  feedSettings: FeedSettingsRepository;
  clock: FeedSettingsClock;
};

export interface CommunityFeedSettingsService {
  getCommunityFeedSettings(communityId: string): Promise<FeedSettingsResult<CommunityFeedSettingsDTO>>;
  updateCommunityFeedSettings(input: UpdateCommunityFeedSettingsInput): Promise<FeedSettingsResult<CommunityFeedSettingsDTO>>;
}

type Deps = FeedSettingsServiceDeps;

function toDTO(r: CommunityFeedSettingsRecord): CommunityFeedSettingsDTO {
  return {
    communityId: r.communityId,
    communityAllEnabled: r.communityAllEnabled,
    communityAllPostingPolicy: r.communityAllPostingPolicy,
    relationalEnabled: r.relationalEnabled,
    relationalMonthlyLimit: r.relationalMonthlyLimit,
    staffOnlyEnabled: r.staffOnlyEnabled,
    descendantPublishingEnabled: r.descendantPublishingEnabled,
    descendantPublishingAllowedRoles: r.descendantPublishingAllowedRoles,
    updatedAt: r.updatedAt,
  };
}

async function getSettingsOrDefault(deps: Deps, communityId: string): Promise<CommunityFeedSettingsDTO> {
  const existing = await deps.feedSettings.get(communityId);
  if (existing) return toDTO(existing);
  return defaultFeedSettings(communityId, deps.clock.now().toISOString());
}

// SCALABILITY_HOT_PATH_EXCEPTION: settings accessor, not a paginated feed — the
// "limit" token here is the relationalMonthlyLimit config value, no ordering.
async function getCommunityFeedSettings(deps: Deps, communityId: string): Promise<FeedSettingsResult<CommunityFeedSettingsDTO>> {
  if (!(await deps.communities.getById(communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  return { ok: true, value: await getSettingsOrDefault(deps, communityId) };
}

// SCALABILITY_HOT_PATH_EXCEPTION: settings mutator, not a paginated feed — the
// "limit" token here is the relationalMonthlyLimit config value, no ordering.
async function updateCommunityFeedSettings(deps: Deps, input: UpdateCommunityFeedSettingsInput): Promise<FeedSettingsResult<CommunityFeedSettingsDTO>> {
  if (!(await deps.communities.getById(input.communityId))) {
    return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
  }
  const role = (await deps.members.get(input.communityId, input.actorUserId))?.role ?? null;
  // SCALABILITY_HOT_PATH_EXCEPTION: authority check, not a paginated feed query.
  if (!canUpdateFeedSettings(role)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Only founder/admin may update feed settings." } };
  }
  if (input.communityAllPostingPolicy !== undefined && !isValidPostingPolicy(input.communityAllPostingPolicy)) {
    return { ok: false, error: { code: "INVALID_POSTING_POLICY", message: "Posting policy must be all_members or staff_only." } };
  }
  if (input.relationalMonthlyLimit !== undefined && !isValidRelationalLimit(input.relationalMonthlyLimit)) {
    return { ok: false, error: { code: "INVALID_RELATIONAL_LIMIT", message: "Relational monthly limit must be 1..10." } };
  }
  if (input.descendantPublishingAllowedRoles !== undefined &&
      input.descendantPublishingAllowedRoles.some((r) => !isValidDescendantRole(r))) {
    return { ok: false, error: { code: "INVALID_DESCENDANT_ROLE", message: "Descendant publish roles must be founder/admin/moderator." } };
  }
  const current = await getSettingsOrDefault(deps, input.communityId);
  const next: CommunityFeedSettingsRecord = {
    communityId: input.communityId,
    communityAllEnabled: input.communityAllEnabled ?? current.communityAllEnabled,
    communityAllPostingPolicy: input.communityAllPostingPolicy ?? current.communityAllPostingPolicy,
    relationalEnabled: input.relationalEnabled ?? current.relationalEnabled,
    relationalMonthlyLimit: input.relationalMonthlyLimit ?? current.relationalMonthlyLimit,
    staffOnlyEnabled: input.staffOnlyEnabled ?? current.staffOnlyEnabled,
    descendantPublishingEnabled: input.descendantPublishingEnabled ?? current.descendantPublishingEnabled,
    descendantPublishingAllowedRoles: input.descendantPublishingAllowedRoles ?? current.descendantPublishingAllowedRoles,
    updatedAt: deps.clock.now().toISOString(),
  };
  const saved = await deps.feedSettings.upsert(next);
  return { ok: true, value: toDTO(saved) };
}

export function createCommunityFeedSettingsService(deps: Deps): CommunityFeedSettingsService {
  return {
    getCommunityFeedSettings: (communityId) => getCommunityFeedSettings(deps, communityId),
    updateCommunityFeedSettings: (input) => updateCommunityFeedSettings(deps, input),
  };
}
