// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/workplace-feed — orchestration.
 *
 * Cross-domain coordination between:
 *  - identity/workplaces (the workplace entity + contact view)
 *  - content-v2/workplace-posts (workplace micro-feed)
 *  - content-v2/workplace-teasers (friend-feed mini-teasers)
 *  - identity (owner public summary)
 *  - social (friendship verdict)
 *
 * No persistence, no transport. Every call goes through each domain's
 * `public-api.ts` — never internals.
 *
 * Key behaviors:
 *   - Publishing a workplace post in a non-private visibility creates exactly
 *     one teaser (dedupe-protected) for the friend feed.
 *   - The friend-feed teaser route resolves to the FULL workplace post.
 *   - The personal profile professional layer enumerates the owner's
 *     workplaces (archived only for the owner).
 */
import type {
  CreateWorkplacePostCommand,
  WorkplacePostsResult,
  WorkplacePostsService,
  WorkplaceTeasersService,
} from "@server/domains-v2/content-v2/public-api";
import type {
  IdentityService,
} from "@server/domains-v2/identity/public-api";
import type {
  WorkplacePublicDTO,
  WorkplacesResult,
  WorkplacesService,
  CreateWorkplaceCommand,
} from "@server/domains-v2/identity/workplaces/public-api";
import type { SocialContactsService } from "@server/domains-v2/social/public-api";
import type {
  FriendFeedWorkplaceTeaserItemViewDTO,
  FriendFeedWorkplaceTeaserPageViewDTO,
  WorkplaceMicroFeedItemViewDTO,
  WorkplaceMicroFeedPageViewDTO,
  WorkplaceOwnerPublicSummary,
  WorkplacePageViewDTO,
  WorkplaceProfessionalLayerViewDTO,
} from "./types";

export interface WorkplaceFeedUseCaseDeps {
  workplaces: WorkplacesService;
  workplacePosts: WorkplacePostsService;
  workplaceTeasers: WorkplaceTeasersService;
  identity: IdentityService;
  social: SocialContactsService;
}

export interface WorkplaceFeedUseCaseV2 {
  createWorkplaceForViewer(input: {
    viewerUserId: string;
    command: Omit<CreateWorkplaceCommand, "actorUserId" | "ownerProfileId">;
  }): Promise<WorkplacesResult<WorkplacePublicDTO>>;

  getWorkplacePageView(input: {
    viewerUserId: string;
    workplaceId: string;
  }): Promise<{ ok: true; value: WorkplacePageViewDTO } | { ok: false; error: { code: string; message: string } }>;

  getWorkplacePageViewBySlug(input: {
    viewerUserId: string;
    ownerUserId: string;
    workplaceSlug: string;
  }): Promise<{ ok: true; value: WorkplacePageViewDTO } | { ok: false; error: { code: string; message: string } }>;

  listProfessionalLayer(input: {
    viewerUserId: string;
    profileOwnerId: string;
  }): Promise<WorkplaceProfessionalLayerViewDTO>;

  createWorkplacePostWithFriendFeedTeaser(input: {
    viewerUserId: string;
    workplaceId: string;
    body: string;
    mediaRefs?: readonly string[];
    postType?: CreateWorkplacePostCommand["postType"];
    visibility?: CreateWorkplacePostCommand["visibility"];
  }): Promise<WorkplacePostsResult<{ post: WorkplaceMicroFeedItemViewDTO; teaserCreated: boolean }>>;

  listWorkplaceMicroFeed(input: {
    viewerUserId: string;
    workplaceId: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<WorkplaceMicroFeedPageViewDTO>;

  listFriendFeedWorkplaceTeasers(input: {
    viewerUserId: string;
    cursor?: string | null;
    limit?: number;
  }): Promise<FriendFeedWorkplaceTeaserPageViewDTO>;
}

type Deps = WorkplaceFeedUseCaseDeps;

const FALLBACK_OWNER: Omit<WorkplaceOwnerPublicSummary, "userId"> = {
  displayName: "Użytkownik",
  handle: null,
  avatarRef: null,
};

async function ownerSummary(deps: Deps, viewerUserId: string, ownerUserId: string): Promise<WorkplaceOwnerPublicSummary> {
  const res = await deps.identity.getPublicProfile(viewerUserId, ownerUserId);
  if (!res.ok) return { userId: ownerUserId, ...FALLBACK_OWNER };
  const p = res.value;
  return {
    userId: ownerUserId,
    displayName: p.displayName,
    handle: p.profileSlug ?? null,
    avatarRef: p.avatarMediaRef?.assetId ?? null,
  };
}

async function isFriendOf(deps: Deps, viewerUserId: string, otherUserId: string): Promise<boolean> {
  if (viewerUserId === otherUserId) return false;
  const friends = await deps.social.listFriends(viewerUserId as never);
  return friends.some((f) => f.friendId === otherUserId);
}

export function createWorkplaceFeedUseCaseV2(deps: WorkplaceFeedUseCaseDeps): WorkplaceFeedUseCaseV2 {
  return {
    async createWorkplaceForViewer(input) {
      return deps.workplaces.createWorkplace({
        actorUserId: input.viewerUserId,
        ownerProfileId: input.viewerUserId,
        ...input.command,
      });
    },

    async getWorkplacePageView(input) {
      const res = await deps.workplaces.getWorkplaceForViewer(input.workplaceId, input.viewerUserId);
      if (!res.ok) return { ok: false, error: { code: res.error.code, message: res.error.message } };
      const owner = await ownerSummary(deps, input.viewerUserId, res.value.ownerUserId);
      const contact = await deps.workplaces.getContactViewForViewer(input.workplaceId, input.viewerUserId);
      const viewerState = await deps.workplaces.getViewerState(input.workplaceId, input.viewerUserId);
      if (!contact.ok || !viewerState.ok) {
        return { ok: false, error: { code: "NOT_FOUND", message: "Workplace not found." } };
      }
      return {
        ok: true,
        value: {
          workplace: res.value,
          owner,
          contact: contact.value,
          viewerState: viewerState.value,
        },
      };
    },

    async getWorkplacePageViewBySlug(input) {
      const res = await deps.workplaces.getWorkplaceBySlugForViewer(
        input.ownerUserId,
        input.workplaceSlug,
        input.viewerUserId,
      );
      if (!res.ok) return { ok: false, error: { code: res.error.code, message: res.error.message } };
      const owner = await ownerSummary(deps, input.viewerUserId, res.value.ownerUserId);
      const contact = await deps.workplaces.getContactViewForViewer(res.value.id, input.viewerUserId);
      const viewerState = await deps.workplaces.getViewerState(res.value.id, input.viewerUserId);
      if (!contact.ok || !viewerState.ok) {
        return { ok: false, error: { code: "NOT_FOUND", message: "Workplace not found." } };
      }
      return {
        ok: true,
        value: {
          workplace: res.value,
          owner,
          contact: contact.value,
          viewerState: viewerState.value,
        },
      };
    },

    async listProfessionalLayer(input) {
      const isOwner = input.viewerUserId === input.profileOwnerId;
      const isFriend = isOwner ? false : await isFriendOf(deps, input.viewerUserId, input.profileOwnerId);
      const viewerRelation: WorkplaceProfessionalLayerViewDTO["viewerRelation"] =
        isOwner ? "owner" : isFriend ? "friend" : "stranger";
      const res = await deps.workplaces.listWorkplacesForOwner({
        ownerUserId: input.profileOwnerId,
        viewerUserId: input.viewerUserId,
      });
      const cards = res.ok ? res.value : [];
      return {
        profileOwnerId: input.profileOwnerId,
        viewerRelation,
        workplaces: cards.map((c) => ({
          workplaceId: c.id,
          ownerUserId: c.ownerUserId,
          name: c.name,
          slug: c.slug,
          headline: c.headline,
          logoRef: c.logoRef,
          status: c.status,
          visibility: c.visibility,
        })),
        canAddWorkplace: isOwner,
      };
    },

    async createWorkplacePostWithFriendFeedTeaser(input) {
      const wpRes = await deps.workplaces.getWorkplaceForViewer(input.workplaceId, input.viewerUserId);
      if (!wpRes.ok) {
        return { ok: false, error: { code: wpRes.error.code === "NOT_FOUND" ? "NOT_FOUND" : "FORBIDDEN", message: wpRes.error.message } };
      }
      const wp = wpRes.value;
      if (wp.ownerUserId !== input.viewerUserId) {
        return { ok: false, error: { code: "FORBIDDEN", message: "Only the workplace owner can publish." } };
      }
      const command: CreateWorkplacePostCommand = {
        workplaceId: input.workplaceId,
        actorUserId: input.viewerUserId,
        body: input.body,
        mediaRefs: input.mediaRefs,
        postType: input.postType,
        visibility: input.visibility,
      };
      const postRes = await deps.workplacePosts.createPost(command);
      if (!postRes.ok) return postRes;
      const teaserRes = await deps.workplaceTeasers.createFromWorkplacePost({
        sourcePostId: postRes.value.id,
        workplaceId: wp.id,
        ownerUserId: wp.ownerUserId,
        workplaceName: wp.name,
        workplaceSlug: wp.slug,
        postBody: postRes.value.body,
        postMediaRefs: postRes.value.mediaRefs,
        postVisibility: postRes.value.visibility,
      });
      const author = await ownerSummary(deps, input.viewerUserId, postRes.value.authorUserId);
      return {
        ok: true,
        value: {
          post: { post: postRes.value, author },
          teaserCreated: teaserRes.created,
        },
      };
    },

    async listWorkplaceMicroFeed(input) {
      const res = await deps.workplacePosts.listForWorkplace(
        { workplaceId: input.workplaceId, cursor: input.cursor ?? null, limit: input.limit },
        input.viewerUserId,
      );
      if (!res.ok) {
        return { workplaceId: input.workplaceId, items: [], nextCursor: null };
      }
      const authorMap = new Map<string, WorkplaceOwnerPublicSummary>();
      const items: WorkplaceMicroFeedItemViewDTO[] = [];
      for (const p of res.value.items) {
        let author = authorMap.get(p.authorUserId);
        if (!author) {
          author = await ownerSummary(deps, input.viewerUserId, p.authorUserId);
          authorMap.set(p.authorUserId, author);
        }
        items.push({ post: p, author });
      }
      return { workplaceId: input.workplaceId, items, nextCursor: res.value.nextCursor };
    },

    async listFriendFeedWorkplaceTeasers(input) {
      const page = await deps.workplaceTeasers.listForViewer({
        viewerUserId: input.viewerUserId,
        cursor: input.cursor ?? null,
        limit: input.limit,
      });
      const ownerMap = new Map<string, WorkplaceOwnerPublicSummary>();
      const items: FriendFeedWorkplaceTeaserItemViewDTO[] = [];
      for (const t of page.items) {
        let owner = ownerMap.get(t.ownerUserId);
        if (!owner) {
          owner = await ownerSummary(deps, input.viewerUserId, t.ownerUserId);
          ownerMap.set(t.ownerUserId, owner);
        }
        items.push({ teaser: t, owner });
      }
      return { items, nextCursor: page.nextCursor };
    },
  };
}
