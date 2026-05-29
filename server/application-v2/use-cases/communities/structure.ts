/**
 * application-v2/use-cases/communities/structure — orchestration for the
 * community structure / subcommunity flow (Slice 4).
 *
 * Composes the **communities-v2** domain: the structure service (hierarchy +
 * subcommunity lifecycle) plus the communities service (slug → id resolution).
 * This layer owns NO data and never bypasses domain policy — every mutation is
 * a single domain call, except `createSubcommunityWithStaff` which composes
 * createSubcommunity + assignSubcommunityStaff atomically from the caller's
 * point of view. Imports ONLY domain `public-api.ts`.
 */
import type {
  AssignSubcommunityStaffInput,
  CommunitiesService,
  CommunityStructureDTO,
  CommunityStructureService,
  CreateSubcommunityInput,
  DeactivateSubcommunityInput,
  MoveSubcommunityInput,
  ReactivateSubcommunityInput,
  StructureResult,
  SubcommunityDTO,
  SubcommunityStaffAssignment,
  UpdateSubcommunityBasicsInput,
} from "@server/domains-v2/communities-v2/public-api";

export type CommunityStructureUseCaseDeps = {
  communities: CommunitiesService;
  structure: CommunityStructureService;
};

export type CreateSubcommunityWithStaffInput = CreateSubcommunityInput & {
  staff?: readonly SubcommunityStaffAssignment[];
};

export interface CommunityStructureUseCase {
  getCommunityStructureView(
    slug: string,
    viewerUserId: string | null,
  ): Promise<StructureResult<CommunityStructureDTO>>;
  createSubcommunityWithStaff(
    input: CreateSubcommunityWithStaffInput,
  ): Promise<StructureResult<SubcommunityDTO>>;
  moveSubcommunitySafely(input: MoveSubcommunityInput): Promise<StructureResult<SubcommunityDTO>>;
  deactivateSubcommunitySafely(
    input: DeactivateSubcommunityInput,
  ): Promise<StructureResult<SubcommunityDTO>>;
  reactivateSubcommunity(input: ReactivateSubcommunityInput): Promise<StructureResult<SubcommunityDTO>>;
  updateSubcommunityBasics(
    input: UpdateSubcommunityBasicsInput,
  ): Promise<StructureResult<SubcommunityDTO>>;
  assignSubcommunityStaff(
    input: AssignSubcommunityStaffInput,
  ): Promise<StructureResult<SubcommunityDTO>>;
}

export function createCommunityStructureUseCase(
  deps: CommunityStructureUseCaseDeps,
): CommunityStructureUseCase {
  return {
    async getCommunityStructureView(slug, viewerUserId) {
      const profile = await deps.communities.getPublicCommunityBySlug(slug);
      if (!profile) {
        return { ok: false, error: { code: "NOT_FOUND", message: "Community not found." } };
      }
      return deps.structure.getCommunityStructure(profile.id, viewerUserId);
    },

    async createSubcommunityWithStaff(input) {
      const created = await deps.structure.createSubcommunity(input);
      if (!created.ok) return created;
      const staff = input.staff ?? [];
      if (staff.length === 0) return created;
      const assigned = await deps.structure.assignSubcommunityStaff({
        actorUserId: input.actorUserId,
        communityId: created.value.id,
        staff,
      });
      if (!assigned.ok) return assigned;
      return assigned;
    },

    moveSubcommunitySafely: (input) => deps.structure.moveSubcommunity(input),
    deactivateSubcommunitySafely: (input) => deps.structure.deactivateSubcommunity(input),
    reactivateSubcommunity: (input) => deps.structure.reactivateSubcommunity(input),
    updateSubcommunityBasics: (input) => deps.structure.updateSubcommunityBasics(input),
    assignSubcommunityStaff: (input) => deps.structure.assignSubcommunityStaff(input),
  };
}
