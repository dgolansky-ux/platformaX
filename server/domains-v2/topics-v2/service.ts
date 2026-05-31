// === Slice 24 PRE-runtime ACK marker (EXC-016) ======================
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK marker =======================================

// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * topics-v2 — service. FOUNDATION_READY (in-memory store, no transport).
 *
 * Owns topic CRUD only. Module enablement gating is enforced via the
 * TopicModuleEnablementResolver port when surfacing public views.
 */
import type {
  CreateTopicInput,
  TopicDTO,
  TopicOwnerType,
  TopicPublicDTO,
  TopicVisibility,
  UpdateTopicInput,
} from "./dto";
import { toTopicPublic } from "./mapper";
import {
  isTopicVisibility,
  validateTopicDescription,
  validateTopicSlug,
  validateTopicTitle,
} from "./policy";
import type {
  TopicModuleEnablementResolver,
  TopicOwnershipResolver,
} from "./contracts";
import type { TopicRepository } from "./store";

export type TopicsClock = { now: () => Date };
export type TopicsIdGen = { next: () => string };

export type TopicsServiceDeps = {
  topics: TopicRepository;
  ownership: TopicOwnershipResolver;
  moduleEnablement: TopicModuleEnablementResolver;
  clock: TopicsClock;
  ids: TopicsIdGen;
};

export type TopicsErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "MODULE_NOT_ENABLED"
  | "SLUG_TAKEN"
  | "VALIDATION_FAILED";

export type TopicsResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: TopicsErrorCode; message: string } };

export interface TopicsService {
  createTopic(input: CreateTopicInput): Promise<TopicsResult<TopicDTO>>;
  updateTopic(input: UpdateTopicInput): Promise<TopicsResult<TopicDTO>>;
  archiveTopic(input: { topicId: string; actorUserId: string }): Promise<TopicsResult<TopicDTO>>;
  listTopicsForOwner(ownerType: TopicOwnerType, ownerId: string): Promise<TopicPublicDTO[]>;
  getTopicPublicView(topicId: string): Promise<TopicsResult<TopicPublicDTO>>;
}

type Deps = TopicsServiceDeps;

function fail<T>(code: TopicsErrorCode, message: string): TopicsResult<T> {
  return { ok: false, error: { code, message } };
}

function validateCreate(input: CreateTopicInput) {
  const titleErr = validateTopicTitle(input.title);
  if (titleErr) return titleErr;
  const descErr = validateTopicDescription(input.description);
  if (descErr) return descErr;
  const slugErr = validateTopicSlug(input.slug);
  if (slugErr) return slugErr;
  if (!isTopicVisibility(input.visibility)) return "VISIBILITY_INVALID";
  return null;
}

async function createTopic(deps: Deps, input: CreateTopicInput): Promise<TopicsResult<TopicDTO>> {
  const can = await deps.ownership.canManageTopicsForOwner(
    input.createdByUserId,
    input.ownerType,
    input.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot create topics for this owner.");
  const vErr = validateCreate(input);
  if (vErr) return fail("VALIDATION_FAILED", vErr);
  const duplicate = await deps.topics.findBySlug(input.ownerType, input.ownerId, input.slug);
  if (duplicate) return fail("SLUG_TAKEN", `Slug ${input.slug} already in use.`);
  const now = deps.clock.now().toISOString();
  const topic: TopicDTO = {
    id: deps.ids.next(),
    ownerType: input.ownerType,
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: input.description,
    slug: input.slug,
    visibility: input.visibility,
    status: "active",
    createdByUserId: input.createdByUserId,
    createdAt: now,
    updatedAt: now,
  };
  await deps.topics.insert(topic);
  return { ok: true, value: topic };
}

function resolveUpdateVisibility(
  existing: TopicDTO,
  input: UpdateTopicInput,
): TopicsResult<TopicVisibility> {
  if (input.visibility === undefined) return { ok: true, value: existing.visibility };
  if (!isTopicVisibility(input.visibility)) {
    return fail("VALIDATION_FAILED", "VISIBILITY_INVALID");
  }
  return { ok: true, value: input.visibility };
}

function resolveUpdateTitle(existing: TopicDTO, input: UpdateTopicInput): TopicsResult<string> {
  if (input.title === undefined) return { ok: true, value: existing.title };
  const err = validateTopicTitle(input.title);
  if (err) return fail("VALIDATION_FAILED", err);
  return { ok: true, value: input.title.trim() };
}

function resolveUpdateDescription(
  existing: TopicDTO,
  input: UpdateTopicInput,
): TopicsResult<string> {
  if (input.description === undefined) return { ok: true, value: existing.description };
  const err = validateTopicDescription(input.description);
  if (err) return fail("VALIDATION_FAILED", err);
  return { ok: true, value: input.description };
}

async function updateTopic(deps: Deps, input: UpdateTopicInput): Promise<TopicsResult<TopicDTO>> {
  const existing = await deps.topics.getById(input.topicId);
  if (!existing) return fail("NOT_FOUND", "Topic not found.");
  const can = await deps.ownership.canManageTopicsForOwner(
    input.actorUserId,
    existing.ownerType,
    existing.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot manage this topic.");
  const vis = resolveUpdateVisibility(existing, input);
  if (!vis.ok) return vis;
  const title = resolveUpdateTitle(existing, input);
  if (!title.ok) return title;
  const desc = resolveUpdateDescription(existing, input);
  if (!desc.ok) return desc;
  const updated: TopicDTO = {
    ...existing,
    title: title.value,
    description: desc.value,
    visibility: vis.value,
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.topics.update(updated);
  return { ok: true, value: updated };
}

async function archiveTopic(
  deps: Deps,
  args: { topicId: string; actorUserId: string },
): Promise<TopicsResult<TopicDTO>> {
  const existing = await deps.topics.getById(args.topicId);
  if (!existing) return fail("NOT_FOUND", "Topic not found.");
  const can = await deps.ownership.canManageTopicsForOwner(
    args.actorUserId,
    existing.ownerType,
    existing.ownerId,
  );
  if (!can) return fail("FORBIDDEN", "Actor cannot archive this topic.");
  const updated: TopicDTO = {
    ...existing,
    status: "archived",
    updatedAt: deps.clock.now().toISOString(),
  };
  await deps.topics.update(updated);
  return { ok: true, value: updated };
}

async function listTopicsForOwner(
  deps: Deps,
  ownerType: TopicOwnerType,
  ownerId: string,
): Promise<TopicPublicDTO[]> {
  const enabled = await deps.moduleEnablement.isTopicsEnabled(ownerType, ownerId);
  if (!enabled) return [];
  const topics = await deps.topics.listForOwner(ownerType, ownerId);
  return topics
    .filter((t) => t.status === "active" && t.visibility === "public")
    .map(toTopicPublic);
}

async function getTopicPublicView(deps: Deps, topicId: string): Promise<TopicsResult<TopicPublicDTO>> {
  const topic = await deps.topics.getById(topicId);
  if (!topic) return fail("NOT_FOUND", "Topic not found.");
  if (topic.status !== "active") return fail("NOT_FOUND", "Topic not active.");
  const enabled = await deps.moduleEnablement.isTopicsEnabled(topic.ownerType, topic.ownerId);
  if (!enabled) return fail("MODULE_NOT_ENABLED", "Topics module disabled for owner.");
  if (topic.visibility !== "public") return fail("NOT_FOUND", "Topic not public.");
  return { ok: true, value: toTopicPublic(topic) };
}

export function createTopicsService(deps: TopicsServiceDeps): TopicsService {
  return {
    createTopic: (input) => createTopic(deps, input),
    updateTopic: (input) => updateTopic(deps, input),
    archiveTopic: (args) => archiveTopic(deps, args),
    listTopicsForOwner: (ownerType, ownerId) => listTopicsForOwner(deps, ownerType, ownerId),
    getTopicPublicView: (topicId) => getTopicPublicView(deps, topicId),
  };
}