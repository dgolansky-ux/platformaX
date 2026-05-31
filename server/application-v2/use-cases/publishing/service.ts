// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/publishing — facade + dispatcher (Slice 17).
 *
 * The single entry point the transport layer calls. It does NOT replace per-
 * target use-cases — it dispatches a unified `PublishingCommand` to whichever
 * target use-case owns it and packages the response into the unified
 * `PublishingResult` envelope. There is no "god-service" doing publishing
 * logic itself; all rules live in the per-target use-cases / domains.
 *
 * Idempotency: an opaque `idempotencyKey` is required on every command. A
 * tiny LRU keeps recent (key, viewerUserId) → result mappings so the same
 * command does not double-publish — the underlying domains already enforce
 * the persistence-level invariants, so this layer only prevents the
 * orchestrator from doing work twice.
 */
import type { FriendFeedUseCaseV2 } from "../friend-feed/public-api";
import type { CommunityFeedsUseCase } from "../community-feeds/public-api";
import type { ChannelContentUseCase } from "../channel-content/public-api";
import type { WorkplaceFeedUseCaseV2 } from "../workplace-feed/public-api";
import type {
  PublishingCommand,
  PublishingPreview,
  PublishingRequestContext,
  PublishingResult,
  PublishingTargetDefinition,
} from "./contracts";
import { buildEmptyFeedEffects } from "./contracts";
import type { PublishingTargetRegistry } from "./registry";
import { buildPublishingPreview } from "./preview";
import { publishToFriendFeed } from "./targets/friend-feed";
import {
  publishToCommunityFeed,
  publishToCommunityStaffFeed,
  publishToCommunityRelationalFeed,
} from "./targets/community-feed";
import { publishToChannel } from "./targets/channel";
import { publishToWorkplace } from "./targets/workplace";
import { publishImportantEvent } from "./targets/important-event";
import { publishProfilePresentationItem } from "./targets/profile-presentation";

export interface PublishingServiceDeps {
  readonly registry: PublishingTargetRegistry;
  readonly friendFeed: FriendFeedUseCaseV2;
  readonly communityFeeds: CommunityFeedsUseCase;
  readonly channelContent: ChannelContentUseCase;
  readonly workplaceFeed: WorkplaceFeedUseCaseV2;
  /** Idempotency cache size. Default 256 entries. */
  readonly idempotencyCacheSize?: number;
}

export interface PublishingService {
  getAvailablePublishingTargets(ctx: PublishingRequestContext): Promise<readonly PublishingTargetDefinition[]>;
  buildPublishingPreview(ctx: PublishingRequestContext, command: PublishingCommand): Promise<PublishingPreview>;
  publish(ctx: PublishingRequestContext, command: PublishingCommand): Promise<PublishingResult>;
}

export function createPublishingService(deps: PublishingServiceDeps): PublishingService {
  const idempotency = new IdempotencyCache(deps.idempotencyCacheSize ?? 256);
  return {
    getAvailablePublishingTargets: (ctx) => deps.registry.getAvailablePublishingTargets(ctx),
    buildPublishingPreview: (ctx, command) => buildPublishingPreview({ registry: deps.registry }, ctx, command),
    publish: async (ctx, command) => {
      const cacheKey = `${ctx.viewerUserId}|${command.idempotencyKey}`;
      const cached = idempotency.get(cacheKey);
      if (cached) return cached;

      const validation = validateCommand(command);
      if (validation) {
        idempotency.set(cacheKey, validation);
        return validation;
      }
      const result = await dispatch(deps, ctx, command);
      idempotency.set(cacheKey, result);
      return result;
    },
  };
}

function validateCommand(command: PublishingCommand): PublishingResult | null {
  if (command.idempotencyKey.trim().length === 0) {
    return rejectWith("INTERNAL_ERROR", "Brak idempotencyKey w komendzie publikacji.");
  }
  if (command.targetType === "important_event") {
    if (!command.title || command.title.trim().length === 0) {
      return rejectWith("TITLE_REQUIRED", "Ważne wydarzenie wymaga tytułu.");
    }
    if (!command.date) {
      return rejectWith("DATE_REQUIRED", "Ważne wydarzenie wymaga daty.");
    }
  }
  return null;
}

async function dispatch(
  deps: PublishingServiceDeps,
  ctx: PublishingRequestContext,
  command: PublishingCommand,
): Promise<PublishingResult> {
  switch (command.targetType) {
    case "friend_feed":
      return publishToFriendFeed({ friendFeed: deps.friendFeed }, ctx, command);
    case "community_feed":
      return publishToCommunityFeed({ communityFeeds: deps.communityFeeds }, ctx, command);
    case "community_staff_feed":
      return publishToCommunityStaffFeed({ communityFeeds: deps.communityFeeds }, ctx, command);
    case "community_relational_feed":
      return publishToCommunityRelationalFeed({ communityFeeds: deps.communityFeeds }, ctx, command);
    case "channel":
      return publishToChannel({ channelContent: deps.channelContent }, ctx, command);
    case "workplace":
      return publishToWorkplace({ workplaceFeed: deps.workplaceFeed }, ctx, command);
    case "important_event":
      return publishImportantEvent(ctx, command);
    case "profile_presentation":
      return publishProfilePresentationItem(ctx, command);
  }
}

function rejectWith(code: PublishingResult["errors"][number]["code"], message: string): PublishingResult {
  return {
    status: "blocked",
    publishedEntity: null,
    feedEffects: buildEmptyFeedEffects({ noFeedEffect: true }),
    warnings: [],
    errors: [{ code, message }],
  };
}

class IdempotencyCache {
  private readonly map = new Map<string, PublishingResult>();
  constructor(private readonly capacity: number) {}
  get(key: string): PublishingResult | undefined {
    const v = this.map.get(key);
    if (v === undefined) return undefined;
    // refresh LRU position
    this.map.delete(key);
    this.map.set(key, v);
    return v;
  }
  set(key: string, value: PublishingResult): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }
}
