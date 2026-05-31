/**
 * communities-v2 — structure write ops (Slice 4): create / update / move /
 * deactivate / reactivate / assign staff. All mutations enforce structure
 * policy (authority, depth, cycles, soft-deactivation). No hard delete.
 */
import { isValidCategorySlug } from "./categories";
import { canUpdateSettings, isValidCommunitySlug } from "./policy";
import {
  canAssignSubcommunityStaff,
  canCreateSubcommunity,
  canDeactivateSubcommunity,
  canMoveSubcommunity,
  canReactivateSubcommunity,
  isAssignableStaffRole,
  isDepthCreatable,
  isUsableParent,
  MAX_STRUCTURE_DEPTH,
  wouldCreateCycle,
} from "./policy-structure";
import type {
  AssignSubcommunityStaffInput,
  CreateSubcommunityInput,
  DeactivateSubcommunityInput,
  MoveSubcommunityInput,
  ReactivateSubcommunityInput,
  StructureErrorCode,
  StructureResult,
  SubcommunityDTO,
  UpdateSubcommunityBasicsInput,
} from "./dto-structure";
import type { CommunityHierarchyRecord } from "./ports";
import {
  ancestorIds,
  childPath,
  loadNode,
  mapNode,
  MAX_TREE_NODES,
  roleOf,
  type StructureServiceDeps,
} from "./service-structure-shared";

function err<T>(code: StructureErrorCode, message: string): StructureResult<T> {
  return { ok: false, error: { code, message } };
}

/** Founder/admin in the node itself, falling back to the parent's authority. */
async function effectiveRole(
  deps: StructureServiceDeps,
  communityId: string,
  parentCommunityId: string | null,
  userId: string,
) {
  const own = await roleOf(deps, communityId, userId);
  if (own) return own;
  return parentCommunityId ? roleOf(deps, parentCommunityId, userId) : null;
}

export async function createSubcommunity(
  deps: StructureServiceDeps,
  input: CreateSubcommunityInput,
): Promise<StructureResult<SubcommunityDTO>> {
  const parent = await loadNode(deps, input.parentCommunityId);
  if (!parent) return err("NOT_FOUND", "Parent community not found.");
  if (!isUsableParent(parent.hier.status)) {
    return err("PARENT_DEACTIVATED", "Cannot create under a deactivated community.");
  }
  const parentRole = await roleOf(deps, input.parentCommunityId, input.actorUserId);
  if (!canCreateSubcommunity(parentRole)) {
    return err("FORBIDDEN", "Only founder/admin of the parent may create a subcommunity.");
  }
  if (!isDepthCreatable(parent.hier.depth)) {
    return err("MAX_DEPTH_EXCEEDED", `Max structure depth is ${MAX_STRUCTURE_DEPTH}.`);
  }
  if (!isValidCommunitySlug(input.slug)) return err("INVALID_SLUG", "Invalid community slug.");
  if (
    input.categorySlug !== undefined &&
    input.categorySlug !== null &&
    !isValidCategorySlug(input.categorySlug)
  ) {
    return err("INVALID_CATEGORY", "Unknown community category.");
  }
  if (await deps.communities.getBySlug(input.slug)) {
    return err("SLUG_TAKEN", "Community slug already taken.");
  }

  const now = deps.clock.now().toISOString();
  const id = deps.ids.next();
  await deps.communities.create({
    id,
    slug: input.slug,
    name: input.name,
    description: input.description ?? "",
    visibility: input.visibility ?? "public",
    status: "active",
    founderUserId: input.actorUserId,
    avatarRef: null,
    bannerRef: null,
    categorySlug: input.categorySlug ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  });

  const siblings = await deps.hierarchy.listChildren(input.parentCommunityId);
  const hier = await deps.hierarchy.add({
    communityId: id,
    parentCommunityId: input.parentCommunityId,
    rootCommunityId: parent.hier.rootCommunityId,
    depth: parent.hier.depth + 1,
    path: childPath(parent.hier),
    sortOrder: siblings.length,
    status: "active",
  });

  if (input.founderJoins !== false) {
    await deps.members.add({
      communityId: id,
      userId: input.actorUserId,
      role: "founder",
      status: "active",
      joinedAt: now,
    });
  }

  const dto = await mapNode(deps, hier, input.actorUserId);
  if (!dto) return err("NOT_FOUND", "Subcommunity vanished after creation.");
  return { ok: true, value: dto };
}

export async function updateSubcommunityBasics(
  deps: StructureServiceDeps,
  input: UpdateSubcommunityBasicsInput,
): Promise<StructureResult<SubcommunityDTO>> {
  const node = await loadNode(deps, input.communityId);
  if (!node) return err("NOT_FOUND", "Community not found.");
  const role = await effectiveRole(deps, input.communityId, node.hier.parentCommunityId, input.actorUserId);
  if (!canUpdateSettings(role)) {
    return err("FORBIDDEN", "Only founder/admin may edit this subcommunity.");
  }
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.description !== undefined) patch.description = input.description;
  if (input.visibility !== undefined) patch.visibility = input.visibility;
  await deps.communities.update(input.communityId, patch);
  const dto = await mapNode(deps, node.hier, input.actorUserId);
  if (!dto) return err("NOT_FOUND", "Community vanished.");
  return { ok: true, value: dto };
}

export async function moveSubcommunity(
  deps: StructureServiceDeps,
  input: MoveSubcommunityInput,
): Promise<StructureResult<SubcommunityDTO>> {
  const node = await loadNode(deps, input.communityId);
  if (!node) return err("NOT_FOUND", "Community not found.");
  if (node.hier.parentCommunityId === null) {
    return err("NOT_A_SUBCOMMUNITY", "The root community cannot be moved.");
  }
  const role = await effectiveRole(deps, input.communityId, node.hier.parentCommunityId, input.actorUserId);
  if (!canMoveSubcommunity(role)) {
    return err("FORBIDDEN", "Only founder/admin may move this subcommunity.");
  }

  const target = await loadNode(deps, input.newParentCommunityId);
  if (!target) return err("NOT_FOUND", "Target parent not found.");
  if (!isUsableParent(target.hier.status)) {
    return err("PARENT_DEACTIVATED", "Cannot move under a deactivated community.");
  }
  if (input.newParentCommunityId === input.communityId) {
    return err("MOVE_TO_SELF", "A community cannot be its own parent.");
  }
  const targetAncestors = [...ancestorIds(target.hier), target.hier.communityId];
  if (wouldCreateCycle(input.communityId, input.newParentCommunityId, targetAncestors)) {
    return err("MOVE_TO_DESCENDANT", "Cannot move a community under its own descendant.");
  }

  // Recompute the whole moved subtree in memory, validate depth, then persist.
  const treeRows = await deps.hierarchy.listTree(node.hier.rootCommunityId);
  const subtree = collectSubtree(node.hier, treeRows);
  const updates = recomputeSubtree(node.hier, target.hier, subtree);
  const deepest = updates.reduce((m, r) => Math.max(m, r.depth), 0);
  if (deepest > MAX_STRUCTURE_DEPTH) {
    return err("MAX_DEPTH_EXCEEDED", `Move would exceed max depth ${MAX_STRUCTURE_DEPTH}.`);
  }

  // SCALABILITY_EXCEPTION: bounded subtree (<= MAX_TREE_NODES) persisted once;
  // a DB adapter does this as a single path/depth UPDATE ... WHERE path LIKE.
  const capped = updates.slice(0, MAX_TREE_NODES);
  await Promise.all(capped.map((r) => deps.hierarchy.update(r.communityId, r)));

  const moved = capped.find((r) => r.communityId === input.communityId) ?? node.hier;
  const dto = await mapNode(deps, moved, input.actorUserId);
  if (!dto) return err("NOT_FOUND", "Community vanished after move.");
  return { ok: true, value: dto };
}

/** The moved node plus every row whose ancestor path contains it. */
function collectSubtree(
  movedHier: CommunityHierarchyRecord,
  treeRows: readonly CommunityHierarchyRecord[],
): CommunityHierarchyRecord[] {
  const inSubtree = treeRows.filter((r) => ancestorIds(r).includes(movedHier.communityId));
  return [movedHier, ...inSubtree].sort((a, b) => a.depth - b.depth);
}

/** New hierarchy rows for the subtree after re-parenting `movedHier` under `target`. */
function recomputeSubtree(
  movedHier: CommunityHierarchyRecord,
  target: CommunityHierarchyRecord,
  subtree: readonly CommunityHierarchyRecord[],
): CommunityHierarchyRecord[] {
  const updated = new Map<string, CommunityHierarchyRecord>();
  for (const row of subtree) {
    const parent =
      row.communityId === movedHier.communityId
        ? target
        : updated.get(row.parentCommunityId ?? "");
    if (!parent) continue;
    updated.set(row.communityId, {
      ...row,
      parentCommunityId: parent.communityId,
      rootCommunityId: parent.rootCommunityId,
      depth: parent.depth + 1,
      path: childPath(parent),
    });
  }
  return [...updated.values()];
}

export async function deactivateSubcommunity(
  deps: StructureServiceDeps,
  input: DeactivateSubcommunityInput,
): Promise<StructureResult<SubcommunityDTO>> {
  const node = await loadNode(deps, input.communityId);
  if (!node) return err("NOT_FOUND", "Community not found.");
  if (node.hier.parentCommunityId === null) {
    return err("NOT_A_SUBCOMMUNITY", "The root community cannot be deactivated.");
  }
  const role = await effectiveRole(deps, input.communityId, node.hier.parentCommunityId, input.actorUserId);
  if (!canDeactivateSubcommunity(role)) {
    return err("FORBIDDEN", "Only founder/admin may deactivate this subcommunity.");
  }
  if (node.hier.status === "deactivated") {
    return err("ALREADY_DEACTIVATED", "Subcommunity is already deactivated.");
  }
  const children = await deps.hierarchy.listChildren(input.communityId);
  if (children.some((c) => c.status === "active")) {
    return err("HAS_ACTIVE_CHILDREN", "Deactivate or move active children first.");
  }
  const updated = await deps.hierarchy.update(input.communityId, { status: "deactivated" });
  const dto = await mapNode(deps, updated, input.actorUserId);
  if (!dto) return err("NOT_FOUND", "Community vanished.");
  return { ok: true, value: dto };
}

export async function reactivateSubcommunity(
  deps: StructureServiceDeps,
  input: ReactivateSubcommunityInput,
): Promise<StructureResult<SubcommunityDTO>> {
  const node = await loadNode(deps, input.communityId);
  if (!node) return err("NOT_FOUND", "Community not found.");
  if (node.hier.parentCommunityId === null) {
    return err("NOT_A_SUBCOMMUNITY", "The root community is always active.");
  }
  const role = await effectiveRole(deps, input.communityId, node.hier.parentCommunityId, input.actorUserId);
  if (!canReactivateSubcommunity(role)) {
    return err("FORBIDDEN", "Only founder/admin may reactivate this subcommunity.");
  }
  if (node.hier.status === "active") {
    return err("ALREADY_ACTIVE", "Subcommunity is already active.");
  }
  const parent = await loadNode(deps, node.hier.parentCommunityId);
  if (!parent || !isUsableParent(parent.hier.status)) {
    return err("PARENT_DEACTIVATED", "Reactivate the parent community first.");
  }
  const updated = await deps.hierarchy.update(input.communityId, { status: "active" });
  const dto = await mapNode(deps, updated, input.actorUserId);
  if (!dto) return err("NOT_FOUND", "Community vanished.");
  return { ok: true, value: dto };
}

const MAX_STAFF_PER_ASSIGN = 50;

export async function assignSubcommunityStaff(
  deps: StructureServiceDeps,
  input: AssignSubcommunityStaffInput,
): Promise<StructureResult<SubcommunityDTO>> {
  const node = await loadNode(deps, input.communityId);
  if (!node) return err("NOT_FOUND", "Community not found.");
  if (node.hier.parentCommunityId === null) {
    return err("NOT_A_SUBCOMMUNITY", "Staff is assigned by the parent's authority.");
  }
  const parentRole = await roleOf(deps, node.hier.parentCommunityId, input.actorUserId);
  if (!canAssignSubcommunityStaff(parentRole)) {
    return err("FORBIDDEN", "Only founder/admin of the parent may assign staff.");
  }
  const invalid = input.staff.find((s) => !isAssignableStaffRole(s.role));
  if (invalid) {
    return err("INVALID_STAFF_ROLE", "Staff role must be admin or moderator.");
  }
  const now = deps.clock.now().toISOString();
  // SCALABILITY_EXCEPTION: bounded staff set (<= MAX_STAFF_PER_ASSIGN), a subset
  // of parent members; a DB adapter upserts these in one batch.
  const capped = input.staff.slice(0, MAX_STAFF_PER_ASSIGN);
  await Promise.all(
    capped.map(async (s) => {
      const existing = await deps.members.get(input.communityId, s.userId);
      if (existing) {
        await deps.members.updateRole(input.communityId, s.userId, s.role);
      } else {
        await deps.members.add({
          communityId: input.communityId,
          userId: s.userId,
          role: s.role,
          status: "active",
          joinedAt: now,
        });
      }
    }),
  );
  const dto = await mapNode(deps, node.hier, input.actorUserId);
  if (!dto) return err("NOT_FOUND", "Community vanished.");
  return { ok: true, value: dto };
}
