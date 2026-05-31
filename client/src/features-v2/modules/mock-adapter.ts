/**
 * features-v2/modules — MOCK_LOCAL_ONLY transport.
 *
 * No `@server/*` imports. The adapter mirrors the modules domain rules
 * (allowedOwnerTypes, enable/disable, visibility default) for the UI. The
 * Public Hub adapter (separate module) reads from the same in-memory state.
 */
import type {
  AdapterResult,
  ModuleDefinitionUiDTO,
  ModuleEnablementUiDTO,
  ModuleKey,
  ModuleOwnerContextUiDTO,
  ModuleOwnerType,
  ToggleModuleInput,
} from "./types";

const DEFINITIONS: readonly ModuleDefinitionUiDTO[] = [
  {
    key: "topics",
    name: "Tematy",
    description: "Tematyczne sekcje treści profilu lub społeczności.",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 1,
    icon: "topics",
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "events",
    name: "Wydarzenia",
    description: "Wydarzenia własne i wspólne, online lub na żywo.",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 2,
    icon: "events",
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "integrations",
    name: "Integracje",
    description: "Linki i odnośniki do zasobów zewnętrznych.",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 3,
    icon: "integrations",
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "newsletter_chat",
    name: "Newsletter chatowy",
    description: "Czatowy newsletter — broadcast od autora do subskrybentów.",
    allowedOwnerTypes: ["profile", "community"],
    status: "active",
    order: 4,
    icon: "newsletter",
    visibilitySupport: ["public", "members_only", "private"],
  },
  {
    key: "channel_entry",
    name: "Kanały",
    description: "Wejście do kanałów społeczności.",
    allowedOwnerTypes: ["community"],
    status: "active",
    order: 5,
    icon: "channels",
    visibilitySupport: ["public", "members_only"],
  },
] as const;

type Enablement = {
  enabled: boolean;
  visibility: "public" | "members_only" | "private" | "owner_only";
};

type OwnerState = {
  context: ModuleOwnerContextUiDTO;
  enablement: Map<ModuleKey, Enablement>;
};

const PROFILE_OWNERS: Record<string, OwnerState> = {};
const COMMUNITY_OWNERS: Record<string, OwnerState> = {};

const FIXTURE_PROFILE: ModuleOwnerContextUiDTO = {
  ownerType: "profile",
  ownerId: "u-demo-ada",
  ownerDisplayName: "Ada Demo",
  canManage: true,
};

const FIXTURE_COMMUNITY: ModuleOwnerContextUiDTO = {
  ownerType: "community",
  ownerId: "community-product-builders",
  ownerDisplayName: "Product Builders",
  canManage: true,
};

const FIXTURE_COMMUNITY_VIEWER: ModuleOwnerContextUiDTO = {
  ownerType: "community",
  ownerId: "community-zdrowie-ruch",
  ownerDisplayName: "Zdrowie i ruch",
  canManage: false,
};

function ensureOwner(ownerType: ModuleOwnerType, ownerId: string): OwnerState | null {
  const table = ownerType === "profile" ? PROFILE_OWNERS : COMMUNITY_OWNERS;
  if (!table[ownerId]) {
    if (ownerType === "profile" && ownerId === FIXTURE_PROFILE.ownerId) {
      table[ownerId] = { context: { ...FIXTURE_PROFILE }, enablement: new Map() };
    } else if (ownerType === "community" && ownerId === FIXTURE_COMMUNITY.ownerId) {
      table[ownerId] = { context: { ...FIXTURE_COMMUNITY }, enablement: new Map() };
    } else if (ownerType === "community" && ownerId === FIXTURE_COMMUNITY_VIEWER.ownerId) {
      table[ownerId] = { context: { ...FIXTURE_COMMUNITY_VIEWER }, enablement: new Map() };
    } else {
      return null;
    }
  }
  return table[ownerId];
}

function err<T>(code: "NOT_FOUND" | "FORBIDDEN" | "OWNER_TYPE_NOT_ALLOWED" | "ADAPTER_FAILURE", message: string): AdapterResult<T> {
  return { ok: false, error: { code, message } };
}

function buildSummary(owner: OwnerState): ModuleEnablementUiDTO[] {
  return [...DEFINITIONS]
    .sort((a, b) => a.order - b.order)
    .map<ModuleEnablementUiDTO>((def) => {
      const enablement = owner.enablement.get(def.key);
      return {
        key: def.key,
        name: def.name,
        description: def.description,
        enabled: enablement?.enabled ?? false,
        visibility: enablement?.visibility ?? def.visibilitySupport[0],
        allowedOwnerTypes: def.allowedOwnerTypes,
        visibilitySupport: def.visibilitySupport,
      };
    });
}

export const modulesMockAdapter = {
  listDefinitions(): readonly ModuleDefinitionUiDTO[] {
    return DEFINITIONS;
  },

  async getOwnerContext(
    ownerType: ModuleOwnerType,
    ownerId: string,
  ): Promise<AdapterResult<ModuleOwnerContextUiDTO>> {
    const owner = ensureOwner(ownerType, ownerId);
    if (!owner) return err("NOT_FOUND", `Owner not found: ${ownerType}/${ownerId}`);
    return { ok: true, value: { ...owner.context } };
  },

  async listModulesForOwner(
    ownerType: ModuleOwnerType,
    ownerId: string,
  ): Promise<AdapterResult<readonly ModuleEnablementUiDTO[]>> {
    const owner = ensureOwner(ownerType, ownerId);
    if (!owner) return err("NOT_FOUND", `Owner not found: ${ownerType}/${ownerId}`);
    return { ok: true, value: buildSummary(owner) };
  },

  async toggleModule(input: ToggleModuleInput): Promise<AdapterResult<ModuleEnablementUiDTO>> {
    const owner = ensureOwner(input.ownerType, input.ownerId);
    if (!owner) return err("NOT_FOUND", `Owner not found.`);
    if (!owner.context.canManage) return err("FORBIDDEN", "Tylko właściciel/admin może zarządzać modułami.");
    const def = DEFINITIONS.find((d) => d.key === input.moduleKey);
    if (!def) return err("NOT_FOUND", `Unknown module: ${input.moduleKey}`);
    if (input.enabled && !def.allowedOwnerTypes.includes(input.ownerType)) {
      return err("OWNER_TYPE_NOT_ALLOWED", `Moduł ${def.name} nie jest dostępny dla tego typu właściciela.`);
    }
    const existing = owner.enablement.get(input.moduleKey);
    const next = {
      enabled: input.enabled,
      visibility: existing?.visibility ?? def.visibilitySupport[0],
    };
    owner.enablement.set(input.moduleKey, next);
    return {
      ok: true,
      value: {
        key: def.key,
        name: def.name,
        description: def.description,
        enabled: next.enabled,
        visibility: next.visibility,
        allowedOwnerTypes: def.allowedOwnerTypes,
        visibilitySupport: def.visibilitySupport,
      },
    };
  },

  /** Read-only helper used by the public-hub mock adapter to compose slots. */
  async readEnablement(ownerType: ModuleOwnerType, ownerId: string): Promise<readonly ModuleKey[]> {
    const owner = ensureOwner(ownerType, ownerId);
    if (!owner) return [];
    return [...owner.enablement.entries()]
      .filter(([_k, v]) => v.enabled)
      .map(([k]) => k);
  },

  __resetForTests(): void {
    for (const k of Object.keys(PROFILE_OWNERS)) delete PROFILE_OWNERS[k];
    for (const k of Object.keys(COMMUNITY_OWNERS)) delete COMMUNITY_OWNERS[k];
  },
};
