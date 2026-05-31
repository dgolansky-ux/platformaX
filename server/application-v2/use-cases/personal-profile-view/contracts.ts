/**
 * application-v2/use-cases/personal-profile-view — cross-domain ports.
 *
 * The orchestrator NEVER imports another domain's internals. Optional resolver
 * ports below are wired by application bootstrap; missing resolvers degrade
 * gracefully to truthful empty / not-yet-wired states (TRANSPORT_PARTIAL).
 *
 * Privacy classification: Public DTO surface. None of these resolvers ever
 * return PII; the workplace cards are already the public workplace summary.
 */
import type {
  ProfileChannelsEntryDTO,
  ProfilePublicHubDTO,
  ProfileWorkplaceCardDTO,
} from "@shared/contracts/personal-profile-view";

export interface PersonalProfileWorkplacesResolver {
  listWorkplacesForViewer(input: {
    profileOwnerUserId: string;
    viewerUserId: string | null;
    relation: "owner" | "friend" | "stranger" | "anonymous";
  }): Promise<readonly ProfileWorkplaceCardDTO[]>;
}

export interface PersonalProfilePublicHubResolver {
  getProfileHubForViewer(input: {
    profileOwnerUserId: string;
    viewerUserId: string | null;
    relation: "owner" | "friend" | "stranger" | "anonymous";
  }): Promise<ProfilePublicHubDTO>;
}

export interface PersonalProfileChannelsResolver {
  getProfileChannelsEntry(input: {
    profileOwnerUserId: string;
    viewerUserId: string | null;
    relation: "owner" | "friend" | "stranger" | "anonymous";
  }): Promise<ProfileChannelsEntryDTO>;
}
