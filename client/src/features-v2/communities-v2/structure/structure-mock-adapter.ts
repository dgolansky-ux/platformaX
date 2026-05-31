/**
 * features-v2/communities-v2 / structure-mock-adapter — MOCK_LOCAL_ONLY transport
 * for Communities Slice 4 (structure + subcommunities).
 *
 * There is no HTTP transport yet (TRANSPORT_PARTIAL): this adapter holds a
 * realistic in-memory community tree seeded for the demo viewer (founder of
 * "product-builders"), exposes the full structure product flow (view, create,
 * move, deactivate/reactivate, edit, staff candidates) and persists across the
 * SPA lifetime so the UI is genuinely usable. NO `@server/*` imports. NO fake
 * save — this adapter is the source of truth for the local fixture only; every
 * mutation enforces the same structure rules the domain enforces (authority,
 * depth, cycles, soft-deactivation).
 */
import type { CommunityActionResult } from "@shared/contracts/communities";
import type {
  CommunityStructureBreadcrumbDTO,
  CommunityStructureNodeDTO,
  CommunityStructureViewDTO,
  CreateSubcommunityFrontendInput,
  DeactivateSubcommunityFrontendInput,
  MoveSubcommunityFrontendInput,
  SubcommunityStaffCandidateDTO,
  UpdateSubcommunityBasicsFrontendInput,
} from "@shared/contracts/communities-structure";

export const MAX_STRUCTURE_DEPTH = 4;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

type Node = {
  id: string;
  slug: string;
  name: string;
  description: string;
  visibility: "public" | "private";
  parentId: string | null;
  rootId: string;
  depth: number;
  sortOrder: number;
  status: "active" | "deactivated";
  memberCount: number;
  /** root membership role of the demo viewer — drives canManage for the tree. */
  rootViewerRole: "founder" | "admin" | "member" | null;
};

type State = {
  nodes: Map<string, Node>;
  staffByRoot: Map<string, SubcommunityStaffCandidateDTO[]>;
  failure: string | null;
  seq: number;
};

function seedNodes(): Node[] {
  const pb = "product-builders";
  const zr = "zdrowie-ruch";
  return [
    node("sc-pb-root", "product-builders", "Product Builders", pb, null, 0, 0, "public", "founder", 128),
    node("sc-pb-fe", "pb-frontend-guild", "Frontend Guild", pb, "sc-pb-root", 1, 0, "public", "founder", 34),
    node("sc-pb-react", "pb-react-squad", "React Squad", pb, "sc-pb-fe", 2, 0, "public", "founder", 12),
    node("sc-pb-be", "pb-backend-guild", "Backend Guild", pb, "sc-pb-root", 1, 1, "public", "founder", 28),
    node("sc-pb-design", "pb-design-guild", "Design Guild", pb, "sc-pb-root", 1, 2, "private", "founder", 9, "deactivated"),
    node("sc-zr-root", "zdrowie-ruch", "Zdrowie i Ruch", zr, null, 0, 0, "public", "member", 76),
    node("sc-zr-run", "zr-bieganie", "Klub Biegacza", zr, "sc-zr-root", 1, 0, "public", "member", 21),
    node("sc-loc-root", "lokalne-wydarzenia", "Lokalne Wydarzenia", "lokalne-wydarzenia", null, 0, 0, "public", null, 54),
    node("sc-os-root", "open-source", "Open Source PL", "open-source", null, 0, 0, "public", null, 240),
  ];
}

function node(
  id: string,
  slug: string,
  name: string,
  rootSlug: string,
  parentId: string | null,
  depth: number,
  sortOrder: number,
  visibility: "public" | "private",
  rootViewerRole: Node["rootViewerRole"],
  memberCount: number,
  status: Node["status"] = "active",
): Node {
  const rootId =
    rootSlug === "product-builders" ? "sc-pb-root"
    : rootSlug === "zdrowie-ruch" ? "sc-zr-root"
    : rootSlug === "lokalne-wydarzenia" ? "sc-loc-root"
    : "sc-os-root";
  return {
    id, slug, name, description: `${name} — opis demonstracyjny.`,
    visibility, parentId, rootId, depth, sortOrder, status, memberCount, rootViewerRole,
  };
}

function seedStaff(): Map<string, SubcommunityStaffCandidateDTO[]> {
  const m = new Map<string, SubcommunityStaffCandidateDTO[]>();
  m.set("sc-pb-root", [
    { userId: "u-anna-pm", displayName: "Anna PM", role: "admin" },
    { userId: "u-marek-dev", displayName: "Marek Dev", role: "member" },
  ]);
  m.set("sc-zr-root", [{ userId: "u-zdr-mod", displayName: "Krzysztof Mod", role: "moderator" }]);
  return m;
}

function buildInitialState(): State {
  const nodes = new Map<string, Node>();
  for (const n of seedNodes()) nodes.set(n.id, n);
  return { nodes, staffByRoot: seedStaff(), failure: null, seq: 0 };
}

let state: State = buildInitialState();

function nextId(): string {
  state.seq += 1;
  return `sc-new-${state.seq}`;
}

function toDTO(n: Node): CommunityStructureNodeDTO {
  const childCount = [...state.nodes.values()].filter(
    (c) => c.parentId === n.id && c.status === "active",
  ).length;
  return {
    id: n.id, slug: n.slug, name: n.name, description: n.description,
    visibility: n.visibility, parentId: n.parentId, rootId: n.rootId,
    depth: n.depth, sortOrder: n.sortOrder, status: n.status,
    memberCount: n.memberCount, childCount, viewerRole: n.parentId === null ? n.rootViewerRole : null,
  };
}

function bySlug(slug: string): Node | undefined {
  return [...state.nodes.values()].find((n) => n.slug === slug);
}

function childrenOf(id: string): Node[] {
  return [...state.nodes.values()]
    .filter((n) => n.parentId === id)
    .sort((a, b) => a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1));
}

function ancestorsOf(n: Node): Node[] {
  const chain: Node[] = [];
  let cur: Node | undefined = n.parentId ? state.nodes.get(n.parentId) : undefined;
  while (cur) {
    chain.unshift(cur);
    cur = cur.parentId ? state.nodes.get(cur.parentId) : undefined;
  }
  return chain;
}

function canManageRoot(rootId: string): boolean {
  const root = state.nodes.get(rootId);
  return root?.rootViewerRole === "founder" || root?.rootViewerRole === "admin";
}

function fail<T>(): CommunityActionResult<T> | null {
  return state.failure ? { ok: false, error: { code: "UNKNOWN", message: state.failure } } : null;
}

async function getCommunityStructureView(
  slug: string,
): Promise<CommunityActionResult<CommunityStructureViewDTO>> {
  const f = fail<CommunityStructureViewDTO>();
  if (f) return f;
  const current = bySlug(slug);
  if (!current) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  const root = state.nodes.get(current.rootId);
  if (!root) return { ok: false, error: { code: "NOT_FOUND", message: "Korzeń struktury nie istnieje." } };
  if (current.visibility === "private" && !canManageRoot(current.rootId) && current.rootViewerRole === null) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Struktura tej społeczności jest prywatna." } };
  }
  const parent = current.parentId ? state.nodes.get(current.parentId) ?? null : null;
  const breadcrumbs: CommunityStructureBreadcrumbDTO[] = [...ancestorsOf(current), current].map((n, idx) => ({
    id: n.id, slug: n.slug, name: n.name, depth: idx,
  }));
  const tree = [...state.nodes.values()]
    .filter((n) => n.rootId === current.rootId)
    .sort((a, b) => a.depth - b.depth || a.sortOrder - b.sortOrder || (a.id < b.id ? -1 : 1))
    .map(toDTO);
  const canManage = canManageRoot(current.rootId);
  const isSub = current.parentId !== null;
  return {
    ok: true,
    value: {
      root: toDTO(root),
      current: toDTO(current),
      parent: parent ? toDTO(parent) : null,
      children: childrenOf(current.id).map(toDTO),
      breadcrumbs,
      tree,
      depth: current.depth,
      maxDepth: MAX_STRUCTURE_DEPTH,
      canManage,
      canCreateChild: canManage && current.status === "active" && current.depth < MAX_STRUCTURE_DEPTH,
      canMove: canManage && isSub,
      canDeactivate: canManage && isSub,
    },
  };
}

async function listStaffCandidates(slug: string): Promise<CommunityActionResult<SubcommunityStaffCandidateDTO[]>> {
  const f = fail<SubcommunityStaffCandidateDTO[]>();
  if (f) return f;
  const current = bySlug(slug);
  if (!current) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  return { ok: true, value: (state.staffByRoot.get(current.rootId) ?? []).filter((c) => c.role !== "founder") };
}

async function createSubcommunity(
  input: CreateSubcommunityFrontendInput,
): Promise<CommunityActionResult<CommunityStructureNodeDTO>> {
  const f = fail<CommunityStructureNodeDTO>();
  if (f) return f;
  const parent = state.nodes.get(input.parentId);
  if (!parent) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nadrzędna nie istnieje." } };
  if (!canManageRoot(parent.rootId)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Tylko founder/admin może tworzyć podspołeczności." } };
  }
  if (parent.status !== "active") {
    return { ok: false, error: { code: "CONFLICT", message: "Nie można tworzyć pod zdezaktywowaną społecznością." } };
  }
  if (parent.depth >= MAX_STRUCTURE_DEPTH) {
    return { ok: false, error: { code: "CONFLICT", message: `Maksymalna głębokość to ${MAX_STRUCTURE_DEPTH + 1} poziomów.` } };
  }
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();
  if (name.length < 3) {
    return { ok: false, error: { code: "VALIDATION", field: "name", message: "Nazwa musi mieć co najmniej 3 znaki." } };
  }
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: { code: "VALIDATION", field: "slug", message: "Slug: małe litery, cyfry i pojedyncze myślniki." } };
  }
  if (bySlug(slug)) {
    return { ok: false, error: { code: "CONFLICT", message: "Ten slug jest już zajęty." } };
  }
  const id = nextId();
  const staffCount = input.staff?.length ?? 0;
  const created: Node = {
    id, slug, name,
    description: input.description?.trim() ?? "",
    visibility: input.visibility ?? "public",
    parentId: parent.id,
    rootId: parent.rootId,
    depth: parent.depth + 1,
    sortOrder: childrenOf(parent.id).length,
    status: "active",
    memberCount: (input.founderJoins === false ? 0 : 1) + staffCount,
    rootViewerRole: null,
  };
  state.nodes.set(id, created);
  return { ok: true, value: toDTO(created) };
}

async function updateSubcommunityBasics(
  input: UpdateSubcommunityBasicsFrontendInput,
): Promise<CommunityActionResult<CommunityStructureNodeDTO>> {
  const f = fail<CommunityStructureNodeDTO>();
  if (f) return f;
  const target = state.nodes.get(input.communityId);
  if (!target) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (!canManageRoot(target.rootId)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do edycji." } };
  }
  if (input.name !== undefined) {
    const trimmed = input.name.trim();
    if (trimmed.length < 3) {
      return { ok: false, error: { code: "VALIDATION", field: "name", message: "Nazwa musi mieć co najmniej 3 znaki." } };
    }
    target.name = trimmed;
  }
  if (input.description !== undefined) target.description = input.description.trim();
  if (input.visibility !== undefined) target.visibility = input.visibility;
  return { ok: true, value: toDTO(target) };
}

async function moveSubcommunity(
  input: MoveSubcommunityFrontendInput,
): Promise<CommunityActionResult<CommunityStructureNodeDTO>> {
  const f = fail<CommunityStructureNodeDTO>();
  if (f) return f;
  const moving = state.nodes.get(input.communityId);
  if (!moving) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (moving.parentId === null) {
    return { ok: false, error: { code: "CONFLICT", message: "Głównej społeczności nie można przenieść." } };
  }
  if (!canManageRoot(moving.rootId)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do przenoszenia." } };
  }
  const target = state.nodes.get(input.newParentId);
  if (!target) return { ok: false, error: { code: "NOT_FOUND", message: "Docelowa społeczność nie istnieje." } };
  if (target.status !== "active") {
    return { ok: false, error: { code: "CONFLICT", message: "Nie można przenieść pod zdezaktywowaną społeczność." } };
  }
  if (target.id === moving.id) {
    return { ok: false, error: { code: "CONFLICT", message: "Społeczność nie może być swoim rodzicem." } };
  }
  const targetChain = [...ancestorsOf(target), target].map((n) => n.id);
  if (targetChain.includes(moving.id)) {
    return { ok: false, error: { code: "CONFLICT", message: "Nie można przenieść pod własnego potomka." } };
  }
  // recompute subtree depth + root; reject if it would exceed max depth
  const subtree = subtreeOf(moving.id);
  const delta = target.depth + 1 - moving.depth;
  const deepest = subtree.reduce((m, n) => Math.max(m, n.depth + delta), 0);
  if (deepest > MAX_STRUCTURE_DEPTH) {
    return { ok: false, error: { code: "CONFLICT", message: `Przeniesienie przekroczyłoby maksymalną głębokość.` } };
  }
  moving.parentId = target.id;
  moving.sortOrder = childrenOf(target.id).length;
  for (const n of subtree) {
    n.depth += delta;
    n.rootId = target.rootId;
  }
  return { ok: true, value: toDTO(moving) };
}

function subtreeOf(id: string): Node[] {
  const start = state.nodes.get(id);
  if (!start) return [];
  const result: Node[] = [start];
  const queue = [id];
  while (queue.length > 0) {
    const cur = queue.shift() as string;
    for (const c of childrenOf(cur)) {
      result.push(c);
      queue.push(c.id);
    }
  }
  return result;
}

async function deactivateSubcommunity(
  input: DeactivateSubcommunityFrontendInput,
): Promise<CommunityActionResult<CommunityStructureNodeDTO>> {
  const f = fail<CommunityStructureNodeDTO>();
  if (f) return f;
  const target = state.nodes.get(input.communityId);
  if (!target) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (target.parentId === null) {
    return { ok: false, error: { code: "CONFLICT", message: "Głównej społeczności nie można dezaktywować." } };
  }
  if (!canManageRoot(target.rootId)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do dezaktywacji." } };
  }
  if (target.status === "deactivated") {
    return { ok: false, error: { code: "CONFLICT", message: "Społeczność jest już zdezaktywowana." } };
  }
  if (childrenOf(target.id).some((c) => c.status === "active")) {
    return { ok: false, error: { code: "CONFLICT", message: "Najpierw dezaktywuj lub przenieś aktywne podspołeczności." } };
  }
  target.status = "deactivated";
  return { ok: true, value: toDTO(target) };
}

async function reactivateSubcommunity(
  input: DeactivateSubcommunityFrontendInput,
): Promise<CommunityActionResult<CommunityStructureNodeDTO>> {
  const f = fail<CommunityStructureNodeDTO>();
  if (f) return f;
  const target = state.nodes.get(input.communityId);
  if (!target) return { ok: false, error: { code: "NOT_FOUND", message: "Społeczność nie istnieje." } };
  if (!canManageRoot(target.rootId)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Brak uprawnień do reaktywacji." } };
  }
  if (target.status === "active") {
    return { ok: false, error: { code: "CONFLICT", message: "Społeczność jest już aktywna." } };
  }
  const parent = target.parentId ? state.nodes.get(target.parentId) : null;
  if (parent && parent.status !== "active") {
    return { ok: false, error: { code: "CONFLICT", message: "Najpierw reaktywuj społeczność nadrzędną." } };
  }
  target.status = "active";
  return { ok: true, value: toDTO(target) };
}

export type CommunityStructureMockAdapter = {
  getCommunityStructureView(slug: string): Promise<CommunityActionResult<CommunityStructureViewDTO>>;
  listStaffCandidates(slug: string): Promise<CommunityActionResult<SubcommunityStaffCandidateDTO[]>>;
  createSubcommunity(input: CreateSubcommunityFrontendInput): Promise<CommunityActionResult<CommunityStructureNodeDTO>>;
  updateSubcommunityBasics(input: UpdateSubcommunityBasicsFrontendInput): Promise<CommunityActionResult<CommunityStructureNodeDTO>>;
  moveSubcommunity(input: MoveSubcommunityFrontendInput): Promise<CommunityActionResult<CommunityStructureNodeDTO>>;
  deactivateSubcommunity(input: DeactivateSubcommunityFrontendInput): Promise<CommunityActionResult<CommunityStructureNodeDTO>>;
  reactivateSubcommunity(input: DeactivateSubcommunityFrontendInput): Promise<CommunityActionResult<CommunityStructureNodeDTO>>;
  __setFailureForTests(message: string | null): void;
  __resetForTests(): void;
};

export const communityStructureMockAdapter: CommunityStructureMockAdapter = {
  getCommunityStructureView,
  listStaffCandidates,
  createSubcommunity,
  updateSubcommunityBasics,
  moveSubcommunity,
  deactivateSubcommunity,
  reactivateSubcommunity,
  __setFailureForTests(message) {
    state.failure = message;
  },
  __resetForTests() {
    state = buildInitialState();
  },
};
