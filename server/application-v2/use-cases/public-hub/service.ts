/**
 * application-v2/use-cases/public-hub — orchestration.
 *
 * Wires the public-hub COMPOSITION_DOMAIN to its data providers: identity
 * (public profile), communities-v2 (public summary) and modules (enabled keys).
 * public-hub never imports those domains directly — this use-case adapts each
 * domain's public-api into the HubOwnerResolver / HubModulesResolver contracts
 * and hands them to createPublicHubService.
 */
import type { IdentityService } from "@server/domains-v2/identity/public-api";
import type { CommunitiesService } from "@server/domains-v2/communities-v2/public-api";
import type { ModulesService } from "@server/domains-v2/modules/public-api";
import {
  createPublicHubService,
  type HubOwnerSummary,
  type HubViewModel,
  type PublicHubResult,
} from "@server/domains-v2/public-hub/public-api";
import type {
  HubModulesResolver,
  HubOwnerResolver,
} from "@server/domains-v2/public-hub/contracts";

export type PublicHubUseCaseDeps = {
  identity: IdentityService;
  communities: CommunitiesService;
  modules: ModulesService;
  /** Requester id used to read the public profile; null for anonymous view. */
  viewerId?: string | null;
};

export interface PublicHubUseCase {
  getProfileHubView(ownerId: string): Promise<PublicHubResult<HubViewModel>>;
  getCommunityHubView(ownerId: string): Promise<PublicHubResult<HubViewModel>>;
}

function mapVisibility(v: string): "public" | "private" {
  return v === "public" ? "public" : "private";
}

function ownerResolver(deps: PublicHubUseCaseDeps): HubOwnerResolver {
  return {
    async getProfileSummary(ownerId): Promise<HubOwnerSummary | null> {
      const res = await deps.identity.getPublicProfile(deps.viewerId ?? null, ownerId);
      if (!res.ok) return null;
      const p = res.value;
      return {
        ownerType: "profile",
        ownerId: p.userId,
        displayName: p.displayName,
        handle: p.profileSlug,
        avatarRef: p.avatarMediaRef?.assetId ?? null,
        visibility: mapVisibility(p.visibility),
      };
    },
    async getCommunitySummary(ownerId): Promise<HubOwnerSummary | null> {
      const s = await deps.communities.getPublicSummary(ownerId);
      if (!s) return null;
      return {
        ownerType: "community",
        ownerId: s.id,
        displayName: s.name,
        handle: s.slug,
        avatarRef: null,
        visibility: s.visibility,
      };
    },
  };
}

function modulesResolver(deps: PublicHubUseCaseDeps): HubModulesResolver {
  return {
    async listEnabledModuleKeys(ownerType, ownerId) {
      const enabled = await deps.modules.listEnabledForOwner(ownerType, ownerId);
      return enabled.map((e) => e.moduleKey);
    },
  };
}

export function createPublicHubUseCase(deps: PublicHubUseCaseDeps): PublicHubUseCase {
  const hub = createPublicHubService({ owner: ownerResolver(deps), modules: modulesResolver(deps) });
  return {
    getProfileHubView: (ownerId) => hub.getProfileHubView(ownerId),
    getCommunityHubView: (ownerId) => hub.getCommunityHubView(ownerId),
  };
}
