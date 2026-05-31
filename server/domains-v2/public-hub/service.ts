/**
 * public-hub — service. COMPOSITION_DOMAIN: composes a read-only hub view for a
 * profile or community from already-public owner summaries (HubOwnerResolver)
 * and enabled modules (HubModulesResolver). Owns no data, performs no writes.
 * Method bodies are module-level functions so the factory stays small.
 */
import type { HubViewModel } from "./dto";
import type { HubModulesResolver, HubOwnerResolver } from "./contracts";
import { toHubViewModel } from "./mapper";

export type PublicHubServiceDeps = {
  owner: HubOwnerResolver;
  modules: HubModulesResolver;
};

export type PublicHubErrorCode = "NOT_FOUND";

export type PublicHubResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: PublicHubErrorCode; message: string } };

export interface PublicHubService {
  getProfileHubView(ownerId: string): Promise<PublicHubResult<HubViewModel>>;
  getCommunityHubView(ownerId: string): Promise<PublicHubResult<HubViewModel>>;
}

type Deps = PublicHubServiceDeps;

const notFound = (): PublicHubResult<HubViewModel> => ({
  ok: false,
  error: { code: "NOT_FOUND", message: "Hub owner not found or not public." },
});

async function getProfileHubView(deps: Deps, ownerId: string): Promise<PublicHubResult<HubViewModel>> {
  const owner = await deps.owner.getProfileSummary(ownerId);
  if (!owner) return notFound();
  const keys = await deps.modules.listEnabledModuleKeys("profile", ownerId);
  return { ok: true, value: toHubViewModel(owner, keys) };
}

async function getCommunityHubView(deps: Deps, ownerId: string): Promise<PublicHubResult<HubViewModel>> {
  const owner = await deps.owner.getCommunitySummary(ownerId);
  if (!owner) return notFound();
  const keys = await deps.modules.listEnabledModuleKeys("community", ownerId);
  return { ok: true, value: toHubViewModel(owner, keys) };
}

export function createPublicHubService(deps: Deps): PublicHubService {
  return {
    getProfileHubView: (ownerId) => getProfileHubView(deps, ownerId),
    getCommunityHubView: (ownerId) => getCommunityHubView(deps, ownerId),
  };
}
