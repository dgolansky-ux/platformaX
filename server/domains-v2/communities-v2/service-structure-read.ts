/**
 * communities-v2 — structure read ops (Slice 4): structure view, children,
 * breadcrumbs. Pure orchestration over repositories + structure policy.
 */
import type {
  CommunityBreadcrumbDTO,
  CommunityStructureDTO,
  StructureResult,
  SubcommunityDTO,
} from "./dto-structure";
import type { CommunityHierarchyRecord } from "./ports";
import {
  canCreateSubcommunity,
  canDeactivateSubcommunity,
  canMoveSubcommunity,
  canViewStructure,
  isDepthCreatable,
  MAX_STRUCTURE_DEPTH,
} from "./policy-structure";
import {
  ancestorIds,
  loadNode,
  mapNode,
  mapNodes,
  MAX_TREE_NODES,
  roleOf,
  syntheticRoot,
  type StructureServiceDeps,
} from "./service-structure-shared";

function notFound<T>(): StructureResult<T> {
  return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
}

export async function getCommunityStructure(
  deps: StructureServiceDeps,
  communityId: string,
  viewerUserId: string | null,
): Promise<StructureResult<CommunityStructureDTO>> {
  const node = await loadNode(deps, communityId);
  if (!node) return notFound();

  const viewerRole = await roleOf(deps, communityId, viewerUserId);
  if (!canViewStructure(node.visibility, viewerRole)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Structure is private to members." } };
  }

  const current = await mapNode(deps, node.hier, viewerUserId);
  if (!current) return notFound();

  const rootHier =
    node.hier.rootCommunityId === communityId
      ? node.hier
      : (await deps.hierarchy.get(node.hier.rootCommunityId)) ??
        syntheticRoot(node.hier.rootCommunityId);
  const root = await mapNode(deps, rootHier, viewerUserId);
  if (!root) return notFound();

  const parent = node.hier.parentCommunityId
    ? await mapNodeById(deps, node.hier.parentCommunityId, viewerUserId)
    : null;

  const childRows = await deps.hierarchy.listChildren(communityId);
  const children = await mapNodes(deps, childRows, viewerUserId);

  const treeRows = await deps.hierarchy.listTree(node.hier.rootCommunityId);
  const tree = [root, ...(await mapNodes(deps, treeRows, viewerUserId))];

  const breadcrumbs = await buildBreadcrumbs(deps, node.hier);

  const canCreateChild =
    canCreateSubcommunity(viewerRole) && isDepthCreatable(node.hier.depth);
  const isSub = node.hier.parentCommunityId !== null;
  const canMove = isSub && canMoveSubcommunity(viewerRole);
  const canDeactivate = isSub && canDeactivateSubcommunity(viewerRole);

  return {
    ok: true,
    value: {
      root,
      current,
      parent,
      children,
      breadcrumbs,
      tree,
      depth: node.hier.depth,
      maxDepth: MAX_STRUCTURE_DEPTH,
      canCreateChild,
      canMove,
      canDeactivate,
    },
  };
}

async function mapNodeById(
  deps: StructureServiceDeps,
  communityId: string,
  viewerUserId: string | null,
): Promise<SubcommunityDTO | null> {
  const hier = (await deps.hierarchy.get(communityId)) ?? syntheticRoot(communityId);
  return mapNode(deps, hier, viewerUserId);
}

export async function listSubcommunities(
  deps: StructureServiceDeps,
  communityId: string,
  viewerUserId: string | null,
): Promise<StructureResult<SubcommunityDTO[]>> {
  const node = await loadNode(deps, communityId);
  if (!node) return notFound();
  const viewerRole = await roleOf(deps, communityId, viewerUserId);
  if (!canViewStructure(node.visibility, viewerRole)) {
    return { ok: false, error: { code: "FORBIDDEN", message: "Structure is private to members." } };
  }
  const childRows = await deps.hierarchy.listChildren(communityId);
  return { ok: true, value: await mapNodes(deps, childRows, viewerUserId) };
}

export async function getStructureBreadcrumbs(
  deps: StructureServiceDeps,
  communityId: string,
): Promise<StructureResult<CommunityBreadcrumbDTO[]>> {
  const node = await loadNode(deps, communityId);
  if (!node) return notFound();
  return { ok: true, value: await buildBreadcrumbs(deps, node.hier) };
}

async function buildBreadcrumbs(
  deps: StructureServiceDeps,
  hier: CommunityHierarchyRecord,
): Promise<CommunityBreadcrumbDTO[]> {
  const trail = [...ancestorIds(hier), hier.communityId];
  // SCALABILITY_EXCEPTION: breadcrumb trail is bounded by MAX_STRUCTURE_DEPTH+1
  // (<= 6 hops); DB will resolve names in one batched IN-query later.
  const capped = trail.slice(0, MAX_TREE_NODES);
  const crumbs = await Promise.all(
    capped.map(async (id, idx): Promise<CommunityBreadcrumbDTO | null> => {
      const c = await deps.communities.getById(id);
      return c ? { id, slug: c.slug, name: c.name, depth: idx } : null;
    }),
  );
  return crumbs.filter((x): x is CommunityBreadcrumbDTO => x !== null);
}
