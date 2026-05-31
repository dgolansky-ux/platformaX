// === Slice 25 PRE-runtime ACK markers (EXC-016) =====================
// PX-OBS-003-ACK: pre-runtime use-case; request-context tracing wiring scheduled with RequestContext slice. EXC-016.
// === end Slice 25 ACK markers =======================================

/**
 * application-v2/use-cases/feed — orchestration.
 *
 * Composes the **social** friendship graph with the **content-v2** friend-feed
 * read model. The viewer's friend ids come from social; content never decides
 * who is a friend. There is NO global feed — the feed is scoped to the explicit
 * author set we hand to content-v2.
 *
 * Constraints:
 *  - imports only `public-api.ts` from social and content-v2 — no internals.
 *  - owns NO entities or persistence.
 */
import type { SocialContactsService } from "@server/domains-v2/social/public-api";
import type { ContentService, FriendFeedItemDTO } from "@server/domains-v2/content-v2/public-api";

export type FriendFeedUseCaseDeps = {
  social: SocialContactsService;
  content: ContentService;
};

export type FriendFeedFoundationInput = {
  viewerUserId: string;
  cursor?: string | null;
  limit?: number;
};

export type FriendFeedFoundationView = {
  items: FriendFeedItemDTO[];
  nextCursor: string | null;
};

export interface FriendFeedUseCase {
  getFriendFeedFoundation(input: FriendFeedFoundationInput): Promise<FriendFeedFoundationView>;
}

export function createFriendFeedUseCase(deps: FriendFeedUseCaseDeps): FriendFeedUseCase {
  return {
    async getFriendFeedFoundation({ viewerUserId, cursor = null, limit }) {
      const friends = await deps.social.listFriends(viewerUserId);
      const authorUserIds = friends.map((f) => f.friendId);
      if (authorUserIds.length === 0) return { items: [], nextCursor: null };
      return deps.content.listFriendFeed({ viewerUserId, authorUserIds, cursor, limit });
    },
  };
}
