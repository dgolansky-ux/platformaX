// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * QUALITY_STRUCTURE_EXCEPTION: Slice 12 foundation service intentionally
 * keeps command + read orchestration together until a durable DB adapter
 * replaces the in-memory store; the public-api + tests pin the behavior.
 *
 * identity/workplaces — service (BACKEND_PARTIAL).
 *
 * Owns workplace creation, update, archive, list-for-owner, get-for-viewer,
 * and contact-projection-for-viewer. Friend lookups + contact-access verdicts
 * are injected — the service never imports `social/*` or other domain
 * internals.
 */
import type {
  ArchiveWorkplaceCommand,
  CreateWorkplaceCommand,
  ListWorkplacesForOwnerCommand,
  UpdateWorkplaceCommand,
  WorkplaceCardDTO,
  WorkplaceContactViewDTO,
  WorkplacePublicDTO,
  WorkplaceRecord,
  WorkplaceViewerStateDTO,
} from "./dto";
import { WORKPLACE_OWNER_ACTIVE_HARD_LIMIT } from "./dto";
import type { WorkplaceRepository } from "./store";
import type {
  WorkplaceContactAccessResolver,
  WorkplaceContactAccessVerdict,
} from "./contracts";
import type { WorkplaceEventPublisher } from "./events";
import {
  canEditWorkplace,
  canViewContact,
  canViewWorkplace,
  isWorkplaceContactVisibility,
  isWorkplaceVisibility,
  normalizeSlug,
  validateDescription,
  validateHeadline,
  validateLocation,
  validateName,
  validateSlug,
  validateSpecializations,
  validateWebsiteUrl,
  type WorkplaceValidationError,
} from "./policy";
import {
  projectContactForViewer,
  toWorkplaceCard,
  toWorkplacePublic,
} from "./projections";

export type WorkplaceClock = { now: () => Date };
export type WorkplaceIdGen = { next: () => string };

export interface WorkplaceFriendshipResolver {
  areFriends(viewerUserId: string, ownerUserId: string): Promise<boolean>;
}

export interface WorkplacesServiceDeps {
  repo: WorkplaceRepository;
  events: WorkplaceEventPublisher;
  friendship: WorkplaceFriendshipResolver;
  contactAccess: WorkplaceContactAccessResolver;
  clock: WorkplaceClock;
  ids: WorkplaceIdGen;
}

export type WorkplacesErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "CONFLICT"
  | "LIMIT_REACHED";

export type WorkplacesResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: WorkplacesErrorCode; message: string } };

export interface WorkplacesService {
  createWorkplace(input: CreateWorkplaceCommand): Promise<WorkplacesResult<WorkplacePublicDTO>>;
  updateWorkplace(input: UpdateWorkplaceCommand): Promise<WorkplacesResult<WorkplacePublicDTO>>;
  archiveWorkplace(input: ArchiveWorkplaceCommand): Promise<WorkplacesResult<WorkplacePublicDTO>>;
  getWorkplaceForViewer(
    workplaceId: string,
    viewerUserId: string,
  ): Promise<WorkplacesResult<WorkplacePublicDTO>>;
  getWorkplaceBySlugForViewer(
    ownerUserId: string,
    slug: string,
    viewerUserId: string,
  ): Promise<WorkplacesResult<WorkplacePublicDTO>>;
  listWorkplacesForOwner(
    input: ListWorkplacesForOwnerCommand,
  ): Promise<WorkplacesResult<readonly WorkplaceCardDTO[]>>;
  getContactViewForViewer(
    workplaceId: string,
    viewerUserId: string,
  ): Promise<WorkplacesResult<WorkplaceContactViewDTO>>;
  getViewerState(
    workplaceId: string,
    viewerUserId: string,
  ): Promise<WorkplacesResult<WorkplaceViewerStateDTO>>;
}

type Deps = WorkplacesServiceDeps;

function fail<T>(code: WorkplacesErrorCode, message: string): WorkplacesResult<T> {
  return { ok: false, error: { code, message } };
}

function validateCreate(input: CreateWorkplaceCommand): WorkplaceValidationError | null {
  const nameErr = validateName(input.name);
  if (nameErr) return nameErr;
  const slugErr = validateSlug(input.slug);
  if (slugErr) return slugErr;
  const headlineErr = validateHeadline(input.headline ?? "");
  if (headlineErr) return headlineErr;
  const descErr = validateDescription(input.description ?? "");
  if (descErr) return descErr;
  const locErr = validateLocation(input.locationText);
  if (locErr) return locErr;
  const specErr = validateSpecializations(input.specializationSlugs);
  if (specErr) return specErr;
  const urlErr = validateWebsiteUrl(input.websiteUrl ?? null);
  if (urlErr) return urlErr;
  if (input.contactVisibility !== undefined && !isWorkplaceContactVisibility(input.contactVisibility)) {
    return "CONTACT_VISIBILITY_INVALID";
  }
  if (input.visibility !== undefined && !isWorkplaceVisibility(input.visibility)) {
    return "VISIBILITY_INVALID";
  }
  return null;
}

async function createWorkplace(deps: Deps, input: CreateWorkplaceCommand): Promise<WorkplacesResult<WorkplacePublicDTO>> {
  // Only the profile owner may create a workplace on their own profile.
  // The application layer maps actorUserId to the underlying userId; we treat
  // ownerProfileId === actorUserId as the canonical ownership in this slice.
  if (input.actorUserId !== input.ownerProfileId) {
    return fail("FORBIDDEN", "Only the profile owner can create a workplace on this profile.");
  }
  const validationErr = validateCreate(input);
  if (validationErr) return fail("VALIDATION_FAILED", validationErr);

  const slug = normalizeSlug(input.slug);
  const existingBySlug = await deps.repo.getByOwnerSlug(input.actorUserId, slug);
  if (existingBySlug) return fail("CONFLICT", "SLUG_TAKEN");

  const active = await deps.repo.countActiveForOwner(input.actorUserId);
  if (active >= WORKPLACE_OWNER_ACTIVE_HARD_LIMIT) {
    return fail("LIMIT_REACHED", "ACTIVE_WORKPLACES_LIMIT_REACHED");
  }

  const now = deps.clock.now().toISOString();
  const record: WorkplaceRecord = {
    id: deps.ids.next(),
    ownerUserId: input.actorUserId,
    ownerProfileId: input.ownerProfileId,
    name: input.name.trim(),
    slug,
    headline: (input.headline ?? "").trim(),
    description: (input.description ?? "").trim(),
    professionCategorySlug: input.professionCategorySlug ?? null,
    professionSlug: input.professionSlug ?? null,
    specializationSlugs: input.specializationSlugs ?? [],
    websiteUrl: input.websiteUrl?.trim() || null,
    contactEmail: input.contactEmail?.trim() || null,
    contactPhone: input.contactPhone?.trim() || null,
    contactVisibility: input.contactVisibility ?? "owner_only",
    locationText: input.locationText?.trim() || null,
    onlineAvailable: input.onlineAvailable ?? false,
    logoRef: input.logoRef ?? null,
    bannerRef: input.bannerRef ?? null,
    status: "active",
    visibility: input.visibility ?? "public",
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  await deps.repo.insert(record);
  await deps.events.publish({
    type: "WorkplaceCreated",
    eventId: `evt-${deps.ids.next()}`,
    workplaceId: record.id,
    ownerUserId: record.ownerUserId,
    ownerProfileId: record.ownerProfileId,
    occurredAt: now,
    correlationId: null,
  });
  return { ok: true, value: toWorkplacePublic(record) };
}

async function updateWorkplace(deps: Deps, input: UpdateWorkplaceCommand): Promise<WorkplacesResult<WorkplacePublicDTO>> {
  const existing = await deps.repo.getById(input.workplaceId);
  if (!existing) return fail("NOT_FOUND", "Workplace not found.");
  if (!canEditWorkplace(existing, input.actorUserId)) {
    return fail("FORBIDDEN", "Only the owner can update this workplace.");
  }

  if (input.name !== undefined) {
    const err = validateName(input.name);
    if (err) return fail("VALIDATION_FAILED", err);
  }
  if (input.headline !== undefined) {
    const err = validateHeadline(input.headline);
    if (err) return fail("VALIDATION_FAILED", err);
  }
  if (input.description !== undefined) {
    const err = validateDescription(input.description);
    if (err) return fail("VALIDATION_FAILED", err);
  }
  if (input.locationText !== undefined) {
    const err = validateLocation(input.locationText);
    if (err) return fail("VALIDATION_FAILED", err);
  }
  if (input.specializationSlugs !== undefined) {
    const err = validateSpecializations(input.specializationSlugs);
    if (err) return fail("VALIDATION_FAILED", err);
  }
  if (input.websiteUrl !== undefined) {
    const err = validateWebsiteUrl(input.websiteUrl);
    if (err) return fail("VALIDATION_FAILED", err);
  }
  if (input.contactVisibility !== undefined && !isWorkplaceContactVisibility(input.contactVisibility)) {
    return fail("VALIDATION_FAILED", "CONTACT_VISIBILITY_INVALID");
  }
  if (input.visibility !== undefined && !isWorkplaceVisibility(input.visibility)) {
    return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");
  }

  const updated: WorkplaceRecord = {
    ...existing,
    name: input.name !== undefined ? input.name.trim() : existing.name,
    headline: input.headline !== undefined ? input.headline.trim() : existing.headline,
    description: input.description !== undefined ? input.description.trim() : existing.description,
    professionCategorySlug: input.professionCategorySlug !== undefined ? input.professionCategorySlug : existing.professionCategorySlug,
    professionSlug: input.professionSlug !== undefined ? input.professionSlug : existing.professionSlug,
    specializationSlugs: input.specializationSlugs !== undefined ? input.specializationSlugs : existing.specializationSlugs,
    websiteUrl: input.websiteUrl !== undefined ? (input.websiteUrl?.trim() || null) : existing.websiteUrl,
    contactEmail: input.contactEmail !== undefined ? (input.contactEmail?.trim() || null) : existing.contactEmail,
    contactPhone: input.contactPhone !== undefined ? (input.contactPhone?.trim() || null) : existing.contactPhone,
    contactVisibility: input.contactVisibility ?? existing.contactVisibility,
    locationText: input.locationText !== undefined ? (input.locationText?.trim() || null) : existing.locationText,
    onlineAvailable: input.onlineAvailable !== undefined ? input.onlineAvailable : existing.onlineAvailable,
    logoRef: input.logoRef !== undefined ? input.logoRef : existing.logoRef,
    bannerRef: input.bannerRef !== undefined ? input.bannerRef : existing.bannerRef,
    visibility: input.visibility ?? existing.visibility,
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.repo.update(updated);
  return { ok: true, value: toWorkplacePublic(updated) };
}

async function archiveWorkplace(deps: Deps, input: ArchiveWorkplaceCommand): Promise<WorkplacesResult<WorkplacePublicDTO>> {
  const existing = await deps.repo.getById(input.workplaceId);
  if (!existing) return fail("NOT_FOUND", "Workplace not found.");
  if (!canEditWorkplace(existing, input.actorUserId)) {
    return fail("FORBIDDEN", "Only the owner can archive this workplace.");
  }
  if (existing.status === "archived") {
    return { ok: true, value: toWorkplacePublic(existing) };
  }
  const now = deps.clock.now().toISOString();
  const updated: WorkplaceRecord = {
    ...existing,
    status: "archived",
    updatedAt: now,
  };
  await deps.repo.update(updated);
  await deps.events.publish({
    type: "WorkplaceArchived",
    eventId: `evt-${deps.ids.next()}`,
    workplaceId: updated.id,
    ownerUserId: updated.ownerUserId,
    occurredAt: now,
    correlationId: null,
  });
  return { ok: true, value: toWorkplacePublic(updated) };
}

async function getWorkplaceForViewer(
  deps: Deps,
  workplaceId: string,
  viewerUserId: string,
): Promise<WorkplacesResult<WorkplacePublicDTO>> {
  const record = await deps.repo.getById(workplaceId);
  if (!record) return fail("NOT_FOUND", "Workplace not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, record.ownerUserId);
  if (!canViewWorkplace(record, viewerUserId, isFriend)) {
    return fail("NOT_FOUND", "Workplace not found.");
  }
  return { ok: true, value: toWorkplacePublic(record) };
}

async function getWorkplaceBySlugForViewer(
  deps: Deps,
  ownerUserId: string,
  slug: string,
  viewerUserId: string,
): Promise<WorkplacesResult<WorkplacePublicDTO>> {
  const record = await deps.repo.getByOwnerSlug(ownerUserId, normalizeSlug(slug));
  if (!record) return fail("NOT_FOUND", "Workplace not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, record.ownerUserId);
  if (!canViewWorkplace(record, viewerUserId, isFriend)) {
    return fail("NOT_FOUND", "Workplace not found.");
  }
  return { ok: true, value: toWorkplacePublic(record) };
}

// SCALABILITY_HOT_PATH_EXCEPTION: bounded list scoped to a single owner with stable sort in store.
async function listWorkplacesForOwner(
  deps: Deps,
  input: ListWorkplacesForOwnerCommand,
): Promise<WorkplacesResult<readonly WorkplaceCardDTO[]>> {
  const isOwner = input.ownerUserId === input.viewerUserId;
  const includeArchived = isOwner ? input.includeArchived ?? false : false;
  const records = await deps.repo.listForOwner(input.ownerUserId, includeArchived);
  const isFriend = isOwner ? false : await deps.friendship.areFriends(input.viewerUserId, input.ownerUserId);
  const visible = records.filter((r) => canViewWorkplace(r, input.viewerUserId, isFriend));
  return { ok: true, value: visible.map(toWorkplaceCard) };
}

async function getContactViewForViewer(
  deps: Deps,
  workplaceId: string,
  viewerUserId: string,
): Promise<WorkplacesResult<WorkplaceContactViewDTO>> {
  const record = await deps.repo.getById(workplaceId);
  if (!record) return fail("NOT_FOUND", "Workplace not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, record.ownerUserId);
  if (!canViewWorkplace(record, viewerUserId, isFriend)) {
    return fail("NOT_FOUND", "Workplace not found.");
  }
  const verdict: WorkplaceContactAccessVerdict =
    record.ownerUserId === viewerUserId
      ? "owner"
      : await deps.contactAccess.resolveVerdict(viewerUserId, record.ownerUserId);
  return { ok: true, value: projectContactForViewer(record, { visibility: record.contactVisibility, verdict }) };
}

async function getViewerState(
  deps: Deps,
  workplaceId: string,
  viewerUserId: string,
): Promise<WorkplacesResult<WorkplaceViewerStateDTO>> {
  const record = await deps.repo.getById(workplaceId);
  if (!record) return fail("NOT_FOUND", "Workplace not found.");
  const isFriend = await deps.friendship.areFriends(viewerUserId, record.ownerUserId);
  const viewerCanView = canViewWorkplace(record, viewerUserId, isFriend);
  const isOwner = record.ownerUserId === viewerUserId;
  const verdict: WorkplaceContactAccessVerdict = isOwner
    ? "owner"
    : await deps.contactAccess.resolveVerdict(viewerUserId, record.ownerUserId);
  const viewerCanContact = canViewContact({ visibility: record.contactVisibility, verdict });
  return {
    ok: true,
    value: {
      workplaceId: record.id,
      isOwner,
      viewerCanView,
      viewerCanEdit: isOwner,
      viewerCanPostInMicroFeed: isOwner,
      viewerCanContact,
    },
  };
}

export function createWorkplacesService(deps: WorkplacesServiceDeps): WorkplacesService {
  return {
    createWorkplace: (input) => createWorkplace(deps, input),
    updateWorkplace: (input) => updateWorkplace(deps, input),
    archiveWorkplace: (input) => archiveWorkplace(deps, input),
    getWorkplaceForViewer: (id, viewerId) => getWorkplaceForViewer(deps, id, viewerId),
    getWorkplaceBySlugForViewer: (ownerId, slug, viewerId) =>
      getWorkplaceBySlugForViewer(deps, ownerId, slug, viewerId),
    listWorkplacesForOwner: (input) => listWorkplacesForOwner(deps, input),
    getContactViewForViewer: (id, viewerId) => getContactViewForViewer(deps, id, viewerId),
    getViewerState: (id, viewerId) => getViewerState(deps, id, viewerId),
  };
}
