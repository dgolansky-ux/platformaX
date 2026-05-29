/**
 * content-v2 / community-feeds — service. Owns community posts + feed items.
 * No role checks, no global feed, no ranking. Distribution down the structure is
 * driven by application-v2 (which supplies validated target community ids); this
 * service only persists post + per-community feed items with idempotent dedupe.
 */
import type {
  CommunityFeedItemDTO,
  CommunityPostDTO,
  CommunityPostResult,
  CreateCommunityPostInput,
  DistributeCommunityPostInput,
  ListCommunityFeedQuery,
  RelationalCountQuery,
} from "./dto";
import type {
  CommunityFeedItemRecord,
  CommunityFeedItemRepository,
  CommunityPostRecord,
  CommunityPostRepository,
} from "./ports";
import { isNonEmptyBody, isValidFeedType } from "./policy";

export type CommunityFeedClock = { now: () => Date };
export type CommunityFeedIdGenerator = { next: () => string };

export type CommunityFeedServiceDeps = {
  posts: CommunityPostRepository;
  items: CommunityFeedItemRepository;
  clock: CommunityFeedClock;
  ids: CommunityFeedIdGenerator;
};

export type CommunityFeedErrorCode = "EMPTY_BODY" | "INVALID_FEED_TYPE" | "POST_NOT_FOUND" | "DUPLICATE";

export type CommunityFeedResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: { code: CommunityFeedErrorCode; message: string } };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export interface CommunityFeedService {
  createCommunityPost(input: CreateCommunityPostInput): Promise<CommunityFeedResult<CommunityPostResult>>;
  distributeCommunityPost(input: DistributeCommunityPostInput): Promise<CommunityFeedResult<CommunityFeedItemDTO>>;
  listCommunityFeed(query: ListCommunityFeedQuery): Promise<{ items: CommunityFeedItemDTO[]; nextCursor: string | null }>;
  countRelationalForAuthorMonth(query: RelationalCountQuery): Promise<number>;
}

type Deps = CommunityFeedServiceDeps;

function toPostDTO(r: CommunityPostRecord): CommunityPostDTO {
  return {
    id: r.id, authorUserId: r.authorUserId, body: r.body, mediaRefs: r.mediaRefs,
    status: r.status, sourceCommunityId: r.sourceCommunityId, sourceFeedType: r.sourceFeedType, createdAt: r.createdAt,
  };
}

function toItemDTO(r: CommunityFeedItemRecord): CommunityFeedItemDTO {
  return {
    id: r.id, postId: r.postId, communityId: r.communityId, feedType: r.feedType,
    authorUserId: r.authorUserId, publishedByUserId: r.publishedByUserId, body: r.body, mediaRefs: r.mediaRefs,
    sourceCommunityId: r.sourceCommunityId, distributionId: r.distributionId,
    isDistributed: r.sourceCommunityId !== r.communityId, createdAt: r.createdAt,
  };
}

function dedupeKey(communityId: string, feedType: string, distributionId: string | null, postId: string): string {
  return `${communityId}|${feedType}|${distributionId ?? postId}`;
}

async function createCommunityPost(deps: Deps, input: CreateCommunityPostInput): Promise<CommunityFeedResult<CommunityPostResult>> {
  if (!isNonEmptyBody(input.body)) {
    return { ok: false, error: { code: "EMPTY_BODY", message: "Post body must not be empty." } };
  }
  if (!isValidFeedType(input.feedType)) {
    return { ok: false, error: { code: "INVALID_FEED_TYPE", message: "Unknown feed type." } };
  }
  const now = deps.clock.now().toISOString();
  const postId = deps.ids.next();
  const post = await deps.posts.create({
    id: postId, authorUserId: input.authorUserId, publishedByUserId: input.publishedByUserId,
    body: input.body, mediaRefs: input.mediaRefs ?? [], status: "published",
    sourceCommunityId: input.sourceCommunityId, sourceFeedType: input.feedType, createdAt: now, updatedAt: now,
  });
  const item = await deps.items.add({
    id: deps.ids.next(), postId, communityId: input.sourceCommunityId, feedType: input.feedType,
    authorUserId: input.authorUserId, publishedByUserId: input.publishedByUserId, body: input.body,
    mediaRefs: input.mediaRefs ?? [], sourceCommunityId: input.sourceCommunityId,
    distributionId: input.distributionId ?? null, status: "active", createdAt: now,
    dedupeKey: dedupeKey(input.sourceCommunityId, input.feedType, input.distributionId ?? null, postId),
  });
  if (!item) {
    return { ok: false, error: { code: "DUPLICATE", message: "Feed item already exists for this source." } };
  }
  return { ok: true, value: { post: toPostDTO(post), item: toItemDTO(item) } };
}

async function distributeCommunityPost(deps: Deps, input: DistributeCommunityPostInput): Promise<CommunityFeedResult<CommunityFeedItemDTO>> {
  if (!isValidFeedType(input.feedType)) {
    return { ok: false, error: { code: "INVALID_FEED_TYPE", message: "Unknown feed type." } };
  }
  if (!(await deps.posts.getById(input.postId))) {
    return { ok: false, error: { code: "POST_NOT_FOUND", message: "Source post not found." } };
  }
  const item = await deps.items.add({
    id: deps.ids.next(), postId: input.postId, communityId: input.targetCommunityId, feedType: input.feedType,
    authorUserId: input.authorUserId, publishedByUserId: input.publishedByUserId, body: input.body,
    mediaRefs: input.mediaRefs ?? [], sourceCommunityId: input.sourceCommunityId,
    distributionId: input.distributionId, status: "active", createdAt: deps.clock.now().toISOString(),
    dedupeKey: dedupeKey(input.targetCommunityId, input.feedType, input.distributionId, input.postId),
  });
  if (!item) {
    return { ok: false, error: { code: "DUPLICATE", message: "Already distributed to this community/feed." } };
  }
  return { ok: true, value: toItemDTO(item) };
}

async function listCommunityFeed(deps: Deps, query: ListCommunityFeedQuery) {
  const safe = Math.min(query.limit && query.limit > 0 ? query.limit : DEFAULT_LIMIT, MAX_LIMIT);
  const records = await deps.items.list(query.communityId, query.feedType, query.cursor ?? null, safe); // SCALABILITY_HOT_PATH_EXCEPTION: scoped read model (community,feedType), stable order createdAt desc + id
  const items = records.map(toItemDTO);
  const nextCursor = records.length === safe ? records[records.length - 1].id : null;
  return { items, nextCursor };
}

export function createCommunityFeedService(deps: Deps): CommunityFeedService {
  return {
    createCommunityPost: (input) => createCommunityPost(deps, input),
    distributeCommunityPost: (input) => distributeCommunityPost(deps, input),
    listCommunityFeed: (query) => listCommunityFeed(deps, query),
    countRelationalForAuthorMonth: (query) =>
      deps.items.countRelationalForAuthorMonth(query.communityId, query.authorUserId, query.monthKey),
  };
}
