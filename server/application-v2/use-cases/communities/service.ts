/**
 * application-v2/use-cases/communities — orchestration.
 *
 * createCommunityWithDefaults composes **communities-v2** (community + founder
 * membership, created atomically by the domain) with **modules** (enabling a
 * bounded set of default modules for the new community). Each step calls only
 * the domain `public-api.ts`; this layer owns no data.
 */
import type {
  CommunitiesService,
  CommunityPublicDTO,
  CommunitiesErrorCode,
  CreateCommunityInput,
} from "@server/domains-v2/communities-v2/public-api";
import type { ModuleEnablementDTO, ModulesService } from "@server/domains-v2/modules/public-api";

export type CreateCommunityWithDefaultsDeps = {
  communities: CommunitiesService;
  modules: ModulesService;
  /** Bounded config: module keys auto-enabled for a new community. */
  defaultModuleKeys?: readonly string[];
};

export type CreateCommunityWithDefaultsValue = {
  community: CommunityPublicDTO;
  enabledModules: ModuleEnablementDTO[];
};

export type CreateCommunityWithDefaultsResult =
  | { ok: true; value: CreateCommunityWithDefaultsValue }
  | { ok: false; error: { code: CommunitiesErrorCode; message: string } };

export interface CommunitiesUseCase {
  createCommunityWithDefaults(input: CreateCommunityInput): Promise<CreateCommunityWithDefaultsResult>;
}

const MAX_DEFAULT_MODULES = 8;

export function createCommunitiesUseCase(deps: CreateCommunityWithDefaultsDeps): CommunitiesUseCase {
  return {
    async createCommunityWithDefaults(input) {
      const created = await deps.communities.createCommunity(input);
      if (!created.ok) return created;
      // SCALABILITY_EXCEPTION: bounded config list, not a write fanout
      const keys = (deps.defaultModuleKeys ?? []).slice(0, MAX_DEFAULT_MODULES);
      const results = await Promise.all(
        keys.map((moduleKey) =>
          deps.modules.enableForOwner({ ownerType: "community", ownerId: created.value.id, moduleKey }),
        ),
      );
      const enabledModules = results.flatMap((r) => (r.ok ? [r.value] : []));
      return { ok: true, value: { community: created.value, enabledModules } };
    },
  };
}
