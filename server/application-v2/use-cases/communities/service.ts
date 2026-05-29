/**
 * application-v2/use-cases/communities — orchestration.
 *
 * createCommunityWithDefaults composes **communities-v2** (community + founder
 * membership, created atomically by the domain) with **modules** (enabling a
 * bounded set of default modules for the new community). Each step calls only
 * the domain `public-api.ts`; this layer owns no data.
 */
import type { CommunityAuthorityResolver } from "@server/domains-v2/communities-v2/contracts";
import type {
  CommunitiesService,
  CommunityPublicDTO,
  CommunitiesErrorCode,
  CreateCommunityInput,
} from "@server/domains-v2/communities-v2/public-api";
import type {
  ModuleEnablementDTO,
  ModulesErrorCode,
  ModulesService,
} from "@server/domains-v2/modules/public-api";

export type CreateCommunityWithDefaultsDeps = {
  communities: CommunitiesService;
  modules: ModulesService;
  /** Bounded config: module keys auto-enabled for a new community. */
  defaultModuleKeys?: readonly string[];
  /** Authority resolver — optional, only used by enableCommunityModule. */
  authority?: CommunityAuthorityResolver;
};

export type EnableCommunityModuleInput = {
  actorUserId: string;
  communityId: string;
  moduleKey: string;
  /** When true → enable, when false → disable. */
  enabled: boolean;
};

export type EnableCommunityModuleErrorCode = "FORBIDDEN" | ModulesErrorCode;

export type EnableCommunityModuleResult =
  | { ok: true; value: ModuleEnablementDTO }
  | { ok: false; error: { code: EnableCommunityModuleErrorCode; message: string } };

export type CreateCommunityWithDefaultsValue = {
  community: CommunityPublicDTO;
  enabledModules: ModuleEnablementDTO[];
};

export type CreateCommunityWithDefaultsResult =
  | { ok: true; value: CreateCommunityWithDefaultsValue }
  | { ok: false; error: { code: CommunitiesErrorCode; message: string } };

export interface CommunitiesUseCase {
  createCommunityWithDefaults(input: CreateCommunityInput): Promise<CreateCommunityWithDefaultsResult>;
  enableCommunityModule(input: EnableCommunityModuleInput): Promise<EnableCommunityModuleResult>;
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

    async enableCommunityModule(input) {
      const authority = deps.authority ?? deps.communities;
      const allowed = await authority.canManageCommunity(input.communityId, input.actorUserId);
      if (!allowed) {
        return { ok: false, error: { code: "FORBIDDEN", message: "Actor may not manage this community." } };
      }
      const op = input.enabled
        ? deps.modules.enableForOwner({ ownerType: "community", ownerId: input.communityId, moduleKey: input.moduleKey })
        : deps.modules.disableForOwner({ ownerType: "community", ownerId: input.communityId, moduleKey: input.moduleKey });
      const res = await op;
      if (!res.ok) return res;
      return { ok: true, value: res.value };
    },
  };
}
