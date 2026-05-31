/**
 * application-v2/use-cases/community-feeds — descendant target resolution.
 * Pure: turns a PublishScope + the community structure into a validated list of
 * target community ids (active descendants of the source), enforcing the
 * synchronous fan-out safety cap. No I/O.
 */
import type { CommunityStructureDTO, SubcommunityDTO } from "@server/domains-v2/communities-v2/public-api";
import { MAX_DESCENDANT_TARGETS, type CommunityFeedResult, type PublishScope } from "./types";

/** All active descendant nodes of `communityId` within the tree (excludes self). */
function activeDescendants(structure: CommunityStructureDTO, communityId: string): SubcommunityDTO[] {
  const byParent = new Map<string, SubcommunityDTO[]>();
  for (const node of structure.tree) {
    if (node.parentCommunityId === null) continue;
    const arr = byParent.get(node.parentCommunityId) ?? [];
    arr.push(node);
    byParent.set(node.parentCommunityId, arr);
  }
  const out: SubcommunityDTO[] = [];
  const queue: string[] = [communityId];
  while (queue.length > 0) {
    const cur = queue.shift() as string;
    for (const child of byParent.get(cur) ?? []) {
      if (child.status !== "active") continue;
      out.push(child);
      queue.push(child.id);
    }
  }
  return out;
}

export function resolveDescendantTargets(
  structure: CommunityStructureDTO,
  communityId: string,
  scope: PublishScope,
  selectedDescendantCommunityIds: readonly string[],
): CommunityFeedResult<string[]> {
  if (scope === "current_community_only") return { ok: true, value: [] };

  const descendants = activeDescendants(structure, communityId);

  if (scope === "direct_children") {
    return { ok: true, value: descendants.filter((n) => n.parentCommunityId === communityId).map((n) => n.id) };
  }

  if (scope === "all_descendants") {
    if (descendants.length > MAX_DESCENDANT_TARGETS) {
      return {
        ok: false,
        error: {
          code: "TOO_MANY_TARGETS_REQUIRES_ASYNC_DISTRIBUTION",
          message: `Tree has ${descendants.length} descendants (cap ${MAX_DESCENDANT_TARGETS}); requires async distribution.`,
        },
      };
    }
    return { ok: true, value: descendants.map((n) => n.id) };
  }

  // selected_descendants
  const allowed = new Set(descendants.map((n) => n.id));
  for (const id of selectedDescendantCommunityIds) {
    if (!allowed.has(id)) {
      return { ok: false, error: { code: "TARGET_NOT_DESCENDANT", message: `Target ${id} is not an active descendant.` } };
    }
  }
  return { ok: true, value: [...selectedDescendantCommunityIds] };
}
