/**
 * features-v2/professional-profile — MOCK_LOCAL_ONLY transport.
 *
 * Mirrors the V2 application-v2/workplace-feed use-case in-memory (no
 * `@server/*` imports). Seeds a single sample workplace so the UI can show
 * realistic empty / loading / list states without ever touching localStorage.
 */
import type {
  CreateWorkplaceInputUi,
  CreateWorkplacePostInputUi,
  ProfessionalLayerUi,
  ProfessionalProfileAdapterResult,
  WorkplaceCardUi,
  WorkplaceContactVisibilityUi,
  WorkplaceMicroFeedPageUi,
  WorkplaceOwnerSummaryUi,
  WorkplacePageUi,
  WorkplacePostUi,
  WorkplacePublicUi,
  WorkplaceStatusUi,
  WorkplaceVisibilityUi,
  WorkplaceTeaserPageUi,
  WorkplaceTeaserUi,
} from "./types";

interface WorkplaceRow {
  id: string;
  ownerUserId: string;
  name: string;
  slug: string;
  headline: string;
  description: string;
  professionCategorySlug: string | null;
  professionSlug: string | null;
  specializationSlugs: readonly string[];
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactVisibility: WorkplaceContactVisibilityUi;
  locationText: string | null;
  onlineAvailable: boolean;
  logoRef: string | null;
  bannerRef: string | null;
  status: WorkplaceStatusUi;
  visibility: WorkplaceVisibilityUi;
  createdAt: string;
  updatedAt: string;
}

interface PostRow {
  id: string;
  workplaceId: string;
  authorUserId: string;
  body: string;
  mediaRefs: readonly string[];
  postType: WorkplacePostUi["postType"];
  visibility: WorkplacePostUi["visibility"];
  status: WorkplacePostUi["status"];
  createdAt: string;
}

interface TeaserRow {
  id: string;
  sourcePostId: string;
  workplaceId: string;
  workplaceName: string;
  workplaceSlug: string;
  ownerUserId: string;
  previewText: string;
  previewMediaRef: string | null;
  visibility: "friends_only" | "public";
  createdAt: string;
}

const PREVIEW_MAX = 240;
const ACTIVE_LIMIT = 10;

const OWNERS: Record<string, WorkplaceOwnerSummaryUi> = {
  "u-viewer": { userId: "u-viewer", displayName: "Ty", handle: "viewer", avatarRef: null },
  "u-owner": { userId: "u-owner", displayName: "Dawid", handle: "dawid", avatarRef: null },
  "u-ada": { userId: "u-ada", displayName: "Ada Demo", handle: "ada", avatarRef: null },
};

const FRIEND_GRAPH: Record<string, readonly string[]> = {
  "u-viewer": ["u-owner", "u-ada"],
  "u-owner": ["u-viewer", "u-ada"],
  "u-ada": ["u-viewer", "u-owner"],
};

const WORKPLACES: WorkplaceRow[] = [
  {
    id: "wp-1",
    ownerUserId: "u-viewer",
    name: "Coach Dawid",
    slug: "coach-dawid",
    headline: "Coaching kariery i rozwoju",
    description:
      "Pomagam ludziom rosnąć w karierze. Indywidualne sesje, warsztaty, doradztwo dla zespołów.",
    professionCategorySlug: null,
    professionSlug: null,
    specializationSlugs: [],
    websiteUrl: "https://example.com",
    contactEmail: "kontakt@example.com",
    contactPhone: "+48 600 000 000",
    contactVisibility: "friends",
    locationText: "Warszawa / online",
    onlineAvailable: true,
    logoRef: null,
    bannerRef: null,
    status: "active",
    visibility: "public",
    createdAt: "2026-05-25T08:00:00Z",
    updatedAt: "2026-05-25T08:00:00Z",
  },
];

const POSTS: PostRow[] = [
  {
    id: "wpost-1",
    workplaceId: "wp-1",
    authorUserId: "u-viewer",
    body: "Pierwszy wpis w mikro-feedzie miejsca pracy — wystartowałem nowy program coachingowy.",
    mediaRefs: [],
    postType: "announcement",
    visibility: "workplace_public",
    status: "published",
    createdAt: "2026-05-26T09:00:00Z",
  },
];

const TEASERS: TeaserRow[] = [
  {
    id: "wt-1",
    sourcePostId: "wpost-1",
    workplaceId: "wp-1",
    workplaceName: "Coach Dawid",
    workplaceSlug: "coach-dawid",
    ownerUserId: "u-viewer",
    previewText: "Pierwszy wpis w mikro-feedzie miejsca pracy — wystartowałem nowy program coachingowy.",
    previewMediaRef: null,
    visibility: "public",
    createdAt: "2026-05-26T09:00:00Z",
  },
];

let seq = 100;
let nextId = (prefix: string) => `${prefix}-${++seq}`;

function fail<T>(
  code: "NOT_FOUND" | "FORBIDDEN" | "VALIDATION_FAILED" | "CONFLICT" | "LIMIT_REACHED" | "ADAPTER_FAILURE",
  message: string,
): ProfessionalProfileAdapterResult<T> {
  return { ok: false, error: { code, message } };
}

function areFriends(viewerId: string, otherId: string): boolean {
  if (viewerId === otherId) return false;
  return (FRIEND_GRAPH[viewerId] ?? []).includes(otherId);
}

function ownerOf(userId: string): WorkplaceOwnerSummaryUi {
  return OWNERS[userId] ?? { userId, displayName: "Użytkownik", handle: null, avatarRef: null };
}

function canViewWorkplace(row: WorkplaceRow, viewerId: string): boolean {
  if (row.ownerUserId === viewerId) return true;
  if (row.status === "draft") return false;
  if (row.visibility === "public") return true;
  if (row.visibility === "friends_only") return areFriends(viewerId, row.ownerUserId);
  return false;
}

function canViewContactFor(row: WorkplaceRow, viewerId: string): boolean {
  if (row.ownerUserId === viewerId) return true;
  switch (row.contactVisibility) {
    case "public":
      return true;
    case "friends":
      return areFriends(viewerId, row.ownerUserId);
    case "approved_contact_fields":
      return areFriends(viewerId, row.ownerUserId);
    case "owner_only":
      return false;
    default:
      return false;
  }
}

function toPublic(row: WorkplaceRow): WorkplacePublicUi {
  return {
    id: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    slug: row.slug,
    headline: row.headline,
    description: row.description,
    professionCategorySlug: row.professionCategorySlug,
    professionSlug: row.professionSlug,
    specializationSlugs: row.specializationSlugs,
    websiteUrl: row.websiteUrl,
    locationText: row.locationText,
    onlineAvailable: row.onlineAvailable,
    logoRef: row.logoRef,
    bannerRef: row.bannerRef,
    status: row.status,
    visibility: row.visibility,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toCard(row: WorkplaceRow): WorkplaceCardUi {
  return {
    workplaceId: row.id,
    ownerUserId: row.ownerUserId,
    name: row.name,
    slug: row.slug,
    headline: row.headline,
    logoRef: row.logoRef,
    status: row.status,
    visibility: row.visibility,
  };
}

function toPostUi(row: PostRow): WorkplacePostUi {
  return {
    id: row.id,
    workplaceId: row.workplaceId,
    authorUserId: row.authorUserId,
    body: row.body,
    mediaRefs: row.mediaRefs,
    postType: row.postType,
    visibility: row.visibility,
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
  };
}

function toTeaserUi(row: TeaserRow): WorkplaceTeaserUi {
  return {
    id: row.id,
    sourcePostId: row.sourcePostId,
    workplaceId: row.workplaceId,
    workplaceName: row.workplaceName,
    workplaceSlug: row.workplaceSlug,
    ownerUserId: row.ownerUserId,
    previewText: row.previewText,
    previewMediaRef: row.previewMediaRef,
    visibility: row.visibility,
    createdAt: row.createdAt,
    targetRoute: `/profile/workplaces/${row.workplaceSlug}/posts/${row.sourcePostId}`,
  };
}

function validateUrl(url: string): string | null {
  const trimmed = url.trim();
  if (trimmed.length === 0) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("vbscript:")
  ) {
    return "WEBSITE_URL_UNSAFE";
  }
  try {
    const u = new URL(trimmed);
    if (u.protocol !== "https:" && u.protocol !== "http:") return "WEBSITE_URL_UNSAFE";
  } catch {
    return "WEBSITE_URL_INVALID";
  }
  return null;
}

export const professionalProfileMockAdapter = {
  async listProfessionalLayer(
    viewerUserId: string,
    profileOwnerId: string,
  ): Promise<ProfessionalProfileAdapterResult<ProfessionalLayerUi>> {
    const isOwner = viewerUserId === profileOwnerId;
    const isFriend = isOwner ? false : areFriends(viewerUserId, profileOwnerId);
    const viewerRelation = isOwner ? "owner" : isFriend ? "friend" : "stranger";
    const items = WORKPLACES.filter(
      (w) => w.ownerUserId === profileOwnerId && canViewWorkplace(w, viewerUserId),
    )
      .filter((w) => isOwner || w.status !== "archived")
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
      .map((w) => ({
        workplaceId: w.id,
        ownerUserId: w.ownerUserId,
        name: w.name,
        slug: w.slug,
        headline: w.headline,
        logoRef: w.logoRef,
        status: w.status,
        visibility: w.visibility,
      }));
    return {
      ok: true,
      value: {
        profileOwnerId,
        viewerRelation,
        workplaces: items,
        canAddWorkplace: isOwner,
      },
    };
  },

  async getWorkplacePageBySlug(
    viewerUserId: string,
    ownerUserId: string,
    slug: string,
  ): Promise<ProfessionalProfileAdapterResult<WorkplacePageUi>> {
    const row = WORKPLACES.find(
      (w) => w.ownerUserId === ownerUserId && w.slug === slug,
    );
    if (!row) return fail("NOT_FOUND", "Miejsce pracy nie istnieje.");
    if (!canViewWorkplace(row, viewerUserId)) {
      return fail("NOT_FOUND", "Miejsce pracy nie istnieje.");
    }
    const owner = ownerOf(row.ownerUserId);
    const allowed = canViewContactFor(row, viewerUserId);
    return {
      ok: true,
      value: {
        workplace: toPublic(row),
        owner,
        contact: {
          workplaceId: row.id,
          websiteUrl: row.websiteUrl,
          contactEmail: allowed ? row.contactEmail : null,
          contactPhone: allowed ? row.contactPhone : null,
          visibility: row.contactVisibility,
          viewerCanContact:
            allowed && (row.contactEmail !== null || row.contactPhone !== null || row.websiteUrl !== null),
        },
        viewerState: {
          workplaceId: row.id,
          isOwner: row.ownerUserId === viewerUserId,
          viewerCanView: true,
          viewerCanEdit: row.ownerUserId === viewerUserId,
          viewerCanPostInMicroFeed: row.ownerUserId === viewerUserId,
          viewerCanContact: allowed,
        },
      },
    };
  },

  async getWorkplacePageById(
    viewerUserId: string,
    workplaceId: string,
  ): Promise<ProfessionalProfileAdapterResult<WorkplacePageUi>> {
    const row = WORKPLACES.find((w) => w.id === workplaceId);
    if (!row) return fail("NOT_FOUND", "Miejsce pracy nie istnieje.");
    return this.getWorkplacePageBySlug(viewerUserId, row.ownerUserId, row.slug);
  },

  async createWorkplace(
    input: CreateWorkplaceInputUi,
  ): Promise<ProfessionalProfileAdapterResult<WorkplaceCardUi>> {
    const name = input.name.trim();
    const slug = input.slug.trim().toLowerCase();
    if (name.length === 0) return fail("VALIDATION_FAILED", "Nazwa jest wymagana.");
    if (slug.length === 0) return fail("VALIDATION_FAILED", "Adres URL jest wymagany.");
    if (!/^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(slug)) {
      return fail("VALIDATION_FAILED", "Adres URL może zawierać tylko małe litery, cyfry i myślniki.");
    }
    const urlErr = validateUrl(input.websiteUrl);
    if (urlErr) {
      return fail(
        "VALIDATION_FAILED",
        urlErr === "WEBSITE_URL_UNSAFE"
          ? "Adres strony www jest niebezpieczny."
          : "Adres strony www jest niepoprawny.",
      );
    }
    const dup = WORKPLACES.find(
      (w) => w.ownerUserId === input.viewerUserId && w.slug === slug,
    );
    if (dup) return fail("CONFLICT", "Już masz miejsce pracy z takim adresem URL.");
    const active = WORKPLACES.filter(
      (w) => w.ownerUserId === input.viewerUserId && (w.status === "draft" || w.status === "active"),
    ).length;
    if (active >= ACTIVE_LIMIT) {
      return fail("LIMIT_REACHED", `Możesz mieć maksymalnie ${ACTIVE_LIMIT} aktywnych miejsc pracy.`);
    }
    const now = new Date().toISOString();
    const row: WorkplaceRow = {
      id: nextId("wp"),
      ownerUserId: input.viewerUserId,
      name,
      slug,
      headline: input.headline.trim(),
      description: input.description.trim(),
      professionCategorySlug: input.professionCategorySlug,
      professionSlug: input.professionSlug,
      specializationSlugs: [],
      websiteUrl: input.websiteUrl.trim() || null,
      contactEmail: input.contactEmail.trim() || null,
      contactPhone: input.contactPhone.trim() || null,
      contactVisibility: input.contactVisibility,
      locationText: input.locationText.trim() || null,
      onlineAvailable: input.onlineAvailable,
      logoRef: null,
      bannerRef: null,
      status: "active",
      visibility: input.visibility,
      createdAt: now,
      updatedAt: now,
    };
    WORKPLACES.push(row);
    return { ok: true, value: toCard(row) };
  },

  async listMicroFeed(
    viewerUserId: string,
    workplaceId: string,
  ): Promise<ProfessionalProfileAdapterResult<WorkplaceMicroFeedPageUi>> {
    const wp = WORKPLACES.find((w) => w.id === workplaceId);
    if (!wp) return fail("NOT_FOUND", "Miejsce pracy nie istnieje.");
    if (!canViewWorkplace(wp, viewerUserId)) return fail("NOT_FOUND", "Miejsce pracy nie istnieje.");
    const items = POSTS.filter((p) => p.workplaceId === workplaceId && p.status !== "deactivated")
      .filter((p) => {
        if (p.visibility === "workplace_public") return true;
        if (p.visibility === "friends_only") {
          return p.authorUserId === viewerUserId || areFriends(viewerUserId, wp.ownerUserId);
        }
        return p.authorUserId === viewerUserId;
      })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((p) => ({
        post: toPostUi(p),
        author: ownerOf(p.authorUserId),
      }));
    return {
      ok: true,
      value: { workplaceId, items, nextCursor: null },
    };
  },

  async createPost(
    input: CreateWorkplacePostInputUi,
  ): Promise<ProfessionalProfileAdapterResult<{ post: WorkplacePostUi; teaserCreated: boolean }>> {
    const wp = WORKPLACES.find((w) => w.id === input.workplaceId);
    if (!wp) return fail("NOT_FOUND", "Miejsce pracy nie istnieje.");
    if (wp.ownerUserId !== input.viewerUserId) {
      return fail("FORBIDDEN", "Tylko właściciel może publikować w mikro-feedzie.");
    }
    const body = input.body.trim();
    if (body.length === 0) return fail("VALIDATION_FAILED", "Treść nie może być pusta.");
    const now = new Date().toISOString();
    const post: PostRow = {
      id: nextId("wpost"),
      workplaceId: input.workplaceId,
      authorUserId: input.viewerUserId,
      body,
      mediaRefs: [],
      postType: input.postType,
      visibility: input.visibility,
      status: "published",
      createdAt: now,
    };
    POSTS.push(post);

    let teaserCreated = false;
    if (input.visibility !== "private") {
      const teaser: TeaserRow = {
        id: nextId("wt"),
        sourcePostId: post.id,
        workplaceId: post.workplaceId,
        workplaceName: wp.name,
        workplaceSlug: wp.slug,
        ownerUserId: wp.ownerUserId,
        previewText: body.length > PREVIEW_MAX ? `${body.slice(0, PREVIEW_MAX - 1).trimEnd()}…` : body,
        previewMediaRef: null,
        visibility: input.visibility === "workplace_public" ? "public" : "friends_only",
        createdAt: now,
      };
      TEASERS.push(teaser);
      teaserCreated = true;
    }

    return { ok: true, value: { post: toPostUi(post), teaserCreated } };
  },

  async listFriendFeedWorkplaceTeasers(
    viewerUserId: string,
  ): Promise<ProfessionalProfileAdapterResult<WorkplaceTeaserPageUi>> {
    const visible = TEASERS.filter((t) => {
      if (t.ownerUserId === viewerUserId) return true;
      if (t.visibility === "public") {
        return areFriends(viewerUserId, t.ownerUserId);
      }
      return areFriends(viewerUserId, t.ownerUserId);
    })
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((t) => ({ teaser: toTeaserUi(t), owner: ownerOf(t.ownerUserId) }));
    return { ok: true, value: { items: visible, nextCursor: null } };
  },

  async getOwnerWorkplaces(
    viewerUserId: string,
  ): Promise<ProfessionalProfileAdapterResult<readonly WorkplaceCardUi[]>> {
    const items = WORKPLACES.filter((w) => w.ownerUserId === viewerUserId)
      .map(toCard);
    return { ok: true, value: items };
  },

  __resetForTests(): void {
    WORKPLACES.length = 0;
    POSTS.length = 0;
    TEASERS.length = 0;
    seq = 100;
    nextId = (prefix: string) => `${prefix}-${++seq}`;
    WORKPLACES.push({
      id: "wp-1",
      ownerUserId: "u-viewer",
      name: "Coach Dawid",
      slug: "coach-dawid",
      headline: "Coaching kariery i rozwoju",
      description: "Pomagam ludziom rosnąć w karierze.",
      professionCategorySlug: null,
      professionSlug: null,
      specializationSlugs: [],
      websiteUrl: "https://example.com",
      contactEmail: "kontakt@example.com",
      contactPhone: "+48 600 000 000",
      contactVisibility: "friends",
      locationText: "Warszawa / online",
      onlineAvailable: true,
      logoRef: null,
      bannerRef: null,
      status: "active",
      visibility: "public",
      createdAt: "2026-05-25T08:00:00Z",
      updatedAt: "2026-05-25T08:00:00Z",
    });
    POSTS.push({
      id: "wpost-1",
      workplaceId: "wp-1",
      authorUserId: "u-viewer",
      body: "Pierwszy wpis w mikro-feedzie miejsca pracy.",
      mediaRefs: [],
      postType: "announcement",
      visibility: "workplace_public",
      status: "published",
      createdAt: "2026-05-26T09:00:00Z",
    });
    TEASERS.push({
      id: "wt-1",
      sourcePostId: "wpost-1",
      workplaceId: "wp-1",
      workplaceName: "Coach Dawid",
      workplaceSlug: "coach-dawid",
      ownerUserId: "u-viewer",
      previewText: "Pierwszy wpis w mikro-feedzie miejsca pracy.",
      previewMediaRef: null,
      visibility: "public",
      createdAt: "2026-05-26T09:00:00Z",
    });
  },
};
