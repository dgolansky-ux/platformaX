/**
 * public-hub — public API surface
 *
 * Other layers may import from this file. Resolver port interfaces live in
 * contracts.ts (re-exported via index) to avoid duplicate-export conflicts.
 * Internal modules (service body, policy, mapper) must NOT be imported directly.
 */
export { createPublicHubService } from "./service";
export type {
  PublicHubService,
  PublicHubServiceDeps,
  PublicHubResult,
  PublicHubErrorCode,
} from "./service";
export { visibleSections } from "./policy";
export type {
  HubViewModel,
  HubOwnerSummary,
  HubOwnerType,
  HubModuleSummary,
  HubSectionKey,
} from "./dto";
