/**
 * application-v2/use-cases/communities — public API.
 */
export { createCommunitiesUseCase } from "./service";
export type {
  CommunitiesUseCase,
  CreateCommunityWithDefaultsDeps,
  CreateCommunityWithDefaultsValue,
  CreateCommunityWithDefaultsResult,
  EnableCommunityModuleInput,
  EnableCommunityModuleResult,
  EnableCommunityModuleErrorCode,
} from "./service";
