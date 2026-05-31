/**
 * communities-v2 — structure service shared internals (Slice 4).
 *
 * Deps, node loading (with synthetic root), ancestor resolution and the
 * record → SubcommunityDTO mapper. Imported only by the structure read/write
 * ops and the factory — never cross-domain.
 */
import type { CommunityRole } from "./dto";
import type { SubcommunityDTO } from "./dto-structure";
import type {
  CommunityHierarchyRecord,
  CommunityRepository,
  HierarchyRepository,
  MembershipRepository,
} from "./ports";

export type StructureClock = { now: () => Date };
export type StructureIdGenerator = { next: () => string };

export type StructureServiceDeps = {
  communities: CommunityRepository;
  members: MembershipRepository;
  hierarchy: HierarchyRepository;
  clock: StructureClock;
  ids: StructureIdGenerator;
};

/** Upper bound for in-memory tree fan-out mapping; DB will batch-join later. */
export const MAX_TREE_NODES = 500;

/** A community with no persisted hierarchy row is an active root of its own tree. */
export function syntheticRoot(communityId: string): CommunityHierarchyRecord {
  return {
    communityId,
    parentCommunityId: null,
    rootCommunityId: communityId,
    depth: 0,
    path: "",
    sortOrder: 0,
    status: "active",
  };
}

export type LoadedNode = {
  hier: CommunityHierarchyRecord;
  name: string;
  slug: string;
  description: string;
  visibility: import("./dto").CommunityVisibility;
};

/** Loads a node's hierarchy row (or a synthetic root) + its community facts. */
export async function loadNode(
  deps: StructureServiceDeps,
  communityId: string,
): Promise<LoadedNode | null> {
  const community = await deps.communities.getById(communityId);
  if (!community) return null;
  const hier = (await deps.hierarchy.get(communityId)) ?? syntheticRoot(communityId);
  return {
    hier,
    name: community.name,
    slug: community.slug,
    description: community.description,
    visibility: community.visibility,
  };
}

/** Ancestor ids of a node, root-first, excluding the node itself. */
export function ancestorIds(hier: CommunityHierarchyRecord): string[] {
  return hier.path ? hier.path.split(".") : [];
}

/** Materialised path for a child of `parent` (ancestor ids, root-first). */
export function childPath(parent: CommunityHierarchyRecord): string {
  return parent.path === "" ? parent.communityId : `${parent.path}.${parent.communityId}`;
}

export async function roleOf(
  deps: StructureServiceDeps,
  communityId: string,
  userId: string | null,
): Promise<CommunityRole | null> {
  if (!userId) return null;
  return (await deps.members.get(communityId, userId))?.role ?? null;
}

/** Maps one hierarchy row to a public SubcommunityDTO (no PII). */
export async function mapNode(
  deps: StructureServiceDeps,
  hier: CommunityHierarchyRecord,
  viewerUserId: string | null,
): Promise<SubcommunityDTO | null> {
  const community = await deps.communities.getById(hier.communityId);
  if (!community) return null;
  // SCALABILITY_EXCEPTION: per-node aggregates (member/child count) for a single
  // bounded community node; DB COUNT(*)/join replaces these reads later.
  const memberCount = (await deps.members.listForCommunity(hier.communityId)).length;
  const children = await deps.hierarchy.listChildren(hier.communityId);
  const childCount = children.filter((c) => c.status === "active").length;
  const viewerRole = await roleOf(deps, hier.communityId, viewerUserId);
  return {
    id: hier.communityId,
    slug: community.slug,
    name: community.name,
    description: community.description,
    visibility: community.visibility,
    parentCommunityId: hier.parentCommunityId,
    rootCommunityId: hier.rootCommunityId,
    depth: hier.depth,
    sortOrder: hier.sortOrder,
    status: hier.status,
    memberCount,
    childCount,
    viewerRole,
  };
}

/** Maps many hierarchy rows in parallel (bounded), dropping any that vanished. */
export async function mapNodes(
  deps: StructureServiceDeps,
  rows: readonly CommunityHierarchyRecord[],
  viewerUserId: string | null,
): Promise<SubcommunityDTO[]> {
  // SCALABILITY_EXCEPTION: bounded community tree slice (<= MAX_TREE_NODES),
  // mapped once per structure view; DB batch-join replaces this fan-out later.
  const capped = rows.slice(0, MAX_TREE_NODES);
  const mapped = await Promise.all(capped.map((r) => mapNode(deps, r, viewerUserId)));
  return mapped.filter((x): x is SubcommunityDTO => x !== null);
}
