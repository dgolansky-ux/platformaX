// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * integrations-v2 — service. FOUNDATION_READY (in-memory store).
 */
import type {
  CreateIntegrationInput,
  IntegrationDTO,
  IntegrationOwnerType,
  IntegrationPublicDTO,
  IntegrationVisibility,
  UpdateIntegrationInput,
} from "./dto";
import { toIntegrationPublic } from "./mapper";
import {
  isIntegrationKind,
  isIntegrationVisibility,
  validateIntegrationDescription,
  validateIntegrationName,
  validateIntegrationUrl,
} from "./policy";
import type {
  IntegrationModuleEnablementResolver,
  IntegrationOwnershipResolver,
} from "./contracts";
import type { IntegrationRepository } from "./store";

export type IntegrationsClock = { now: () => Date };
export type IntegrationsIdGen = { next: () => string };

export type IntegrationsServiceDeps = {
  integrations: IntegrationRepository;
  ownership: IntegrationOwnershipResolver;
  moduleEnablement: IntegrationModuleEnablementResolver;
  clock: IntegrationsClock;
  ids: IntegrationsIdGen;
};

export type IntegrationsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "MODULE_NOT_ENABLED"
  | "VALIDATION_FAILED";

export type IntegrationsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: IntegrationsErrorCode; message: string } };

export interface IntegrationsService {
  createIntegration(input: CreateIntegrationInput): Promise<IntegrationsResult<IntegrationDTO>>;
  updateIntegration(input: UpdateIntegrationInput): Promise<IntegrationsResult<IntegrationDTO>>;
  disableIntegration(input: { integrationId: string; actorUserId: string }): Promise<IntegrationsResult<IntegrationDTO>>;
  listIntegrationsForOwner(
    ownerType: IntegrationOwnerType,
    ownerId: string,
  ): Promise<IntegrationPublicDTO[]>;
  getIntegrationPublicView(integrationId: string): Promise<IntegrationsResult<IntegrationPublicDTO>>;
}

type Deps = IntegrationsServiceDeps;

function fail<T>(code: IntegrationsErrorCode, message: string): IntegrationsResult<T> {
  return { ok: false, error: { code, message } };
}

function validateCreate(input: CreateIntegrationInput) {
  if (!isIntegrationKind(input.kind)) return "KIND_INVALID";
  const n = validateIntegrationName(input.name);
  if (n) return n;
  const u = validateIntegrationUrl(input.url);
  if (u) return u;
  const d = validateIntegrationDescription(input.description ?? null);
  if (d) return d;
  if (!isIntegrationVisibility(input.visibility)) return "VISIBILITY_INVALID";
  return null;
}

async function createIntegration(
  deps: Deps,
  input: CreateIntegrationInput,
): Promise<IntegrationsResult<IntegrationDTO>> {
  const can = await deps.ownership.canManageIntegrationsForOwner(
    input.createdByUserId,
    input.ownerType,
    input.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot create integrations for this owner.");
  const vErr = validateCreate(input);
  if (vErr) return fail("VALIDATION_FAILED", vErr);
  const now = deps.clock.now().toISOString();
  const integration: IntegrationDTO = {
    id: deps.ids.next(),
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    kind: input.kind,
    name: input.name.trim(),
    url: input.url,
    description: input.description ?? null,
    visibility: input.visibility,
    status: "active",
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  };
  await deps.integrations.insert(integration);
  return { ok: true, value: integration };
}

function applyUpdate(
  existing: IntegrationDTO,
  input: UpdateIntegrationInput,
): IntegrationsResult<{
  name: string;
  url: string;
  description: string | null;
  visibility: IntegrationVisibility;
}> {
  let nextName = existing.name;
  if (input.name !== undefined) {
    const e = validateIntegrationName(input.name);
    if (e) return fail("VALIDATION_FAILED", e);
    nextName = input.name.trim();
  }
  let nextUrl = existing.url;
  if (input.url !== undefined) {
    const e = validateIntegrationUrl(input.url);
    if (e) return fail("VALIDATION_FAILED", e);
    nextUrl = input.url;
  }
  let nextDesc = existing.description;
  if (input.description !== undefined) {
    const e = validateIntegrationDescription(input.description);
    if (e) return fail("VALIDATION_FAILED", e);
    nextDesc = input.description;
  }
  let nextVisibility: IntegrationVisibility = existing.visibility;
  if (input.visibility !== undefined) {
    if (!isIntegrationVisibility(input.visibility)) {
      return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");
    }
    nextVisibility = input.visibility;
  }
  return { ok: true, value: { name: nextName, url: nextUrl, description: nextDesc, visibility: nextVisibility } };
}

async function updateIntegration(
  deps: Deps,
  input: UpdateIntegrationInput,
): Promise<IntegrationsResult<IntegrationDTO>> {
  const existing = await deps.integrations.getById(input.integrationId);
  if (!existing) return fail("NOT_FOUND", "Integration not found.");
  const can = await deps.ownership.canManageIntegrationsForOwner(
    input.actorUserId,
    existing.ownerType,
    existing.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot manage this integration.");
  const applied = applyUpdate(existing, input);
  if (!applied.ok) return applied;
  const updated: IntegrationDTO = {
    ...existing,
    ...applied.value,
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.integrations.update(updated);
  return { ok: true, value: updated };
}

async function disableIntegration(
  deps: Deps,
  args: { integrationId: string; actorUserId: string },
): Promise<IntegrationsResult<IntegrationDTO>> {
  const existing = await deps.integrations.getById(args.integrationId);
  if (!existing) return fail("NOT_FOUND", "Integration not found.");
  const can = await deps.ownership.canManageIntegrationsForOwner(
    args.actorUserId,
    existing.ownerType,
    existing.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot disable this integration.");
  const updated: IntegrationDTO = {
    ...existing,
    status: "disabled",
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.integrations.update(updated);
  return { ok: true, value: updated };
}

async function listIntegrationsForOwner(
  deps: Deps,
  ownerType: IntegrationOwnerType,
  ownerId: string,
): Promise<IntegrationPublicDTO[]> {
  const enabled = await deps.moduleEnablement.isIntegrationsEnabled(ownerType, ownerId);
  if (!enabled) return [];
  const integrations = await deps.integrations.listForOwner(ownerType, ownerId);
  return integrations
    .filter((i) => i.status === "active" && i.visibility === "public")
    .map(toIntegrationPublic);
}

async function getIntegrationPublicView(
  deps: Deps,
  integrationId: string,
): Promise<IntegrationsResult<IntegrationPublicDTO>> {
  const integration = await deps.integrations.getById(integrationId);
  if (!integration) return fail("NOT_FOUND", "Integration not found.");
  if (integration.status !== "active") return fail("NOT_FOUND", "Integration not active.");
  const enabled = await deps.moduleEnablement.isIntegrationsEnabled(
    integration.ownerType,
    integration.ownerId,
  );
  if (!enabled) return fail("MODULE_NOT_ENABLED", "Integrations module disabled for owner.");
  if (integration.visibility !== "public") return fail("NOT_FOUND", "Integration not public.");
  return { ok: true, value: toIntegrationPublic(integration) };
}

export function createIntegrationsService(deps: IntegrationsServiceDeps): IntegrationsService {
  return {
    createIntegration: (input) => createIntegration(deps, input),
    updateIntegration: (input) => updateIntegration(deps, input),
    disableIntegration: (args) => disableIntegration(deps, args),
    listIntegrationsForOwner: (ownerType, ownerId) =>
      listIntegrationsForOwner(deps, ownerType, ownerId),
    getIntegrationPublicView: (id) => getIntegrationPublicView(deps, id),
  };
}
