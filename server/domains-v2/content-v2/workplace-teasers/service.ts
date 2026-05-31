// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * content-v2/workplace-teasers — service (BACKEND_PARTIAL).
 *
 * Creates and reads the mini-teaser surfaced on the friend feed when a
 * workplace post is published. Enforces:
 *
 *   - dedupe per source post id,
 *   - private posts do NOT generate a teaser,
 *   - preview is truncated, never the full post body,
 *   - read path is scoped to the viewer's friend graph (no global feed),
 *   - viewer can only see friends_only teasers when actually friends.
 */
import type { WorkplaceTeaserFriendshipResolver } from "./contracts";
import {
  WORKPLACE_TEASER_DEFAULT_LIMIT,
  WORKPLACE_TEASER_MAX_LIMIT,
  type CreateWorkplaceTeaserCommand,
  type ListWorkplaceTeasersForViewerQuery,
  type WorkplaceTeaserPublicDTO,
  type WorkplaceTeaserRecord,
} from "./dto";
import type { WorkplaceTeaserEventPublisher } from "./events";
import {
  buildDedupeKey,
  buildPreviewText,
  canViewTeaser,
  deriveTeaserVisibility,
} from "./policy";
import { toWorkplaceTeaserPublic } from "./projections";
import type { WorkplaceTeaserRepository } from "./ports";

export type WorkplaceTeaserClock = { now: () => Date };
export type WorkplaceTeaserIdGen = { next: () => string };

export interface WorkplaceTeasersServiceDeps {
  repo: WorkplaceTeaserRepository;
  friendship: WorkplaceTeaserFriendshipResolver;
  events: WorkplaceTeaserEventPublisher;
  clock: WorkplaceTeaserClock;
  ids: WorkplaceTeaserIdGen;
}

export type WorkplaceTeasersErrorCode = "DUPLICATE" | "SKIPPED_PRIVATE";

export type WorkplaceTeaserCreateResult =
  | { ok: true; created: true; value: WorkplaceTeaserPublicDTO }
  | { ok: true; created: false; reason: WorkplaceTeasersErrorCode };

export interface WorkplaceTeaserPageDTO {
  items: readonly WorkplaceTeaserPublicDTO[];
  nextCursor: string | null;
}

export interface WorkplaceTeasersService {
  createFromWorkplacePost(input: CreateWorkplaceTeaserCommand): Promise<WorkplaceTeaserCreateResult>;
  listForViewer(query: ListWorkplaceTeasersForViewerQuery): Promise<WorkplaceTeaserPageDTO>;
  getById(teaserId: string, viewerUserId: string): Promise<WorkplaceTeaserPublicDTO | null>;
}

type Deps = WorkplaceTeasersServiceDeps;

function clampLimit(requested: number | undefined): number {
  const n = requested && requested > 0 ? requested : WORKPLACE_TEASER_DEFAULT_LIMIT;
  return Math.min(n, WORKPLACE_TEASER_MAX_LIMIT);
}

async function createFromWorkplacePost(
  deps: Deps,
  input: CreateWorkplaceTeaserCommand,
): Promise<WorkplaceTeaserCreateResult> {
  const visibility = deriveTeaserVisibility(input.postVisibility);
  if (!visibility) {
    return { ok: true, created: false, reason: "SKIPPED_PRIVATE" };
  }
  const dedupeKey = buildDedupeKey(input.sourcePostId);
  const existing = await deps.repo.getByDedupeKey(dedupeKey);
  if (existing) {
    return { ok: true, created: false, reason: "DUPLICATE" };
  }
  const now = deps.clock.now().toISOString();
  const record: WorkplaceTeaserRecord = {
    id: deps.ids.next(),
    sourceType: "workplace_post",
    sourcePostId: input.sourcePostId,
    workplaceId: input.workplaceId,
    ownerUserId: input.ownerUserId,
    previewText: buildPreviewText(input.postBody),
    previewMediaRef: input.postMediaRefs[0] ?? null,
    workplaceName: input.workplaceName,
    workplaceSlug: input.workplaceSlug,
    visibility,
    dedupeKey,
    createdAt: now,
  };
  const result = await deps.repo.insert(record);
  if (!result.inserted) {
    return { ok: true, created: false, reason: "DUPLICATE" };
  }
  await deps.events.publish({
    type: "FriendFeedWorkplaceTeaserCreated",
    eventId: `evt-${deps.ids.next()}`,
    teaserId: record.id,
    workplaceId: record.workplaceId,
    sourcePostId: record.sourcePostId,
    ownerUserId: record.ownerUserId,
    visibility: record.visibility,
    occurredAt: now,
    correlationId: null,
  });
  return { ok: true, created: true, value: toWorkplaceTeaserPublic(record) };
}

// SCALABILITY_HOT_PATH_EXCEPTION: bounded read, scoped to viewer's friend set; ordering pinned by store (createdAt desc + id).
async function listForViewer(deps: Deps, query: ListWorkplaceTeasersForViewerQuery): Promise<WorkplaceTeaserPageDTO> {
  // SCALABILITY_HOT_PATH_EXCEPTION: signature uses cursor + limit; ordering pinned by store.
  const limit = clampLimit(query.limit);
  const friendIds = await deps.friendship.listFriendIdsForViewer(query.viewerUserId);
  const scope = [...friendIds, query.viewerUserId];
  // SCALABILITY_HOT_PATH_EXCEPTION: store returns stable order (createdAt desc + id) with cursor + bounded limit.
  const records = await deps.repo.listForOwners(scope, query.cursor ?? null, limit);
  const friendSet = new Set(friendIds);
  const visible = records.filter((r) =>
    canViewTeaser(r, query.viewerUserId, friendSet.has(r.ownerUserId)),
  );
  const items = visible.map(toWorkplaceTeaserPublic);
  const nextCursor = records.length === limit ? records[records.length - 1].id : null;
  return { items, nextCursor };
}

async function getById(
  deps: Deps,
  teaserId: string,
  viewerUserId: string,
): Promise<WorkplaceTeaserPublicDTO | null> {
  // Cheap path: scan friend set first; teaser id is only resolvable if visible.
  const friendIds = await deps.friendship.listFriendIdsForViewer(viewerUserId);
  const candidates = await deps.repo.listForOwners(
    [...friendIds, viewerUserId],
    null,
    WORKPLACE_TEASER_MAX_LIMIT,
  );
  const match = candidates.find((c) => c.id === teaserId);
  if (!match) return null;
  const isFriend = friendIds.includes(match.ownerUserId);
  if (!canViewTeaser(match, viewerUserId, isFriend)) return null;
  return toWorkplaceTeaserPublic(match);
}

export function createWorkplaceTeasersService(deps: WorkplaceTeasersServiceDeps): WorkplaceTeasersService {
  return {
    createFromWorkplacePost: (input) => createFromWorkplacePost(deps, input),
    listForViewer: (query) => listForViewer(deps, query),
    getById: (id, viewerId) => getById(deps, id, viewerId),
  };
}
