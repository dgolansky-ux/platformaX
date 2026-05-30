/**
 * shared/contracts/personal-profile-view — canonical unified profile view.
 *
 * Single source of truth for the cross-boundary shape of the personal profile
 * as rendered at `/profile/:username` — for the owner viewing themselves AND
 * for any non-owner viewer. The same view DTO drives every mode; the
 * `viewerState` + `ownerActions` + `relationActions` + `contactPanel` slots
 * answer "what can THIS viewer do / see on THIS profile?" so the UI never
 * recomputes policy itself. Sub-section types live in
 * `personal-profile-view-sections.ts` to keep this file within budget.
 *
 * `shared/contracts/*` MUST NOT import from `@server/*`. Service interfaces
 * stay server-side; the client UI depends on a typed adapter contract
 * (`PersonalProfileViewAdapter`) shaped exactly like the server use-case.
 *
 * Privacy classification: Public DTO surface — composes already-public
 * identity / public-hub / workplace summaries with policy-gated relation
 * state. The `contactPanel.visibleFields` slot is the ONLY place where a
 * non-owner viewer may receive a PII value, and only because the upstream
 * contact-access policy already approved each field.
 */
import type { ApprovedContactField } from "./contacts";
import type {
  ProfileChannelsEntryDTO,
  ProfileFriendFeedPreviewAvailabilityDTO,
  ProfilePublicHubDTO,
  ProfileWorkplacesPreviewDTO,
} from "./personal-profile-view-sections";

export type {
  ProfileWorkplaceVisibility,
  ProfileWorkplaceCardDTO,
  ProfileWorkplacesPreviewDTO,
  ProfilePublicHubModuleDTO,
  ProfilePublicHubSection,
  ProfilePublicHubDTO,
  ProfileChannelsEntryDTO,
  ProfileFriendFeedAvailabilityReason,
  ProfileFriendFeedPreviewAvailabilityDTO,
} from "./personal-profile-view-sections";

export type ProfileViewerRelation =
  | "owner"
  | "friend"
  | "stranger"
  | "pending_friend_request_sent"
  | "pending_friend_request_received"
  | "contact_approved"
  | "unauthenticated";

export interface ProfileViewerStateDTO {
  viewerUserId: string | null;
  profileOwnerUserId: string;
  relation: ProfileViewerRelation;
  canEditProfile: boolean;
  canViewPublicProfile: boolean;
  canViewProfessionalLayer: boolean;
  canViewWorkplaces: boolean;
  canViewPublicHub: boolean;
  canViewModules: boolean;
  canViewFriendFeedPreview: boolean;
  canViewContactFields: boolean;
  canSendFriendRequest: boolean;
  canAcceptFriendRequest: boolean;
  canRequestContactAccess: boolean;
  canOpenChannels: boolean;
  canOpenWorkplaces: boolean;
}

export interface ProfileSummaryDTO {
  userId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  location: string | null;
  publicSummary: string | null;
}

export interface ProfileVisibleContactFieldDTO {
  field: ApprovedContactField;
  value: string;
}

export type ProfileContactHiddenReason =
  | "owner"
  | "friend_policy"
  | "stranger"
  | "anonymous"
  | "none";

export interface ProfileContactPanelDTO {
  visibleFields: readonly ProfileVisibleContactFieldDTO[];
  hiddenFieldsReason: ProfileContactHiddenReason;
  requestContactAccessAvailable: boolean;
  approvedFields: readonly ApprovedContactField[];
}

export interface ProfileOwnerActionsDTO {
  canEditAvatar: boolean;
  canEditBanner: boolean;
  canEditBio: boolean;
  canManageProfile: boolean;
  canManageProfessionalLayer: boolean;
  canManageModules: boolean;
  canAddWorkplace: boolean;
}

export interface ProfileRelationActionsDTO {
  canSendFriendRequest: boolean;
  canCancelFriendRequest: boolean;
  canAcceptFriendRequest: boolean;
  canRejectFriendRequest: boolean;
  canRequestContactAccess: boolean;
  pendingFriendRequestId: string | null;
  pendingContactRequestId: string | null;
}

export interface PersonalProfileViewDTO {
  profile: ProfileSummaryDTO;
  viewerState: ProfileViewerStateDTO;
  ownerActions: ProfileOwnerActionsDTO;
  relationActions: ProfileRelationActionsDTO;
  contactPanel: ProfileContactPanelDTO;
  workplacesPreview: ProfileWorkplacesPreviewDTO;
  publicHub: ProfilePublicHubDTO;
  friendFeedPreview: ProfileFriendFeedPreviewAvailabilityDTO;
  channelsEntry: ProfileChannelsEntryDTO;
}

export type PersonalProfileViewErrorCode =
  | "PROFILE_NOT_FOUND"
  | "PROFILE_FORBIDDEN"
  | "PROFILE_RESTRICTED"
  | "UNAUTHENTICATED";

export interface PersonalProfileViewError {
  code: PersonalProfileViewErrorCode;
  message: string;
}

export type PersonalProfileViewResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: PersonalProfileViewError };

/**
 * Client + server agree on this adapter contract. The frontend mock adapter
 * (MOCK_LOCAL_ONLY) and the future HTTP transport implement the same shape so
 * UI screens never branch on which backend is wired. Persistence honesty:
 * `isPersistent()` returns `false` for the mock adapter.
 */
export interface PersonalProfileViewAdapter {
  isPersistent(): boolean;
  getPersonalProfileView(
    viewerUserId: string | null,
    profileUsername: string,
  ): Promise<PersonalProfileViewResult<PersonalProfileViewDTO>>;
  sendFriendRequestFromProfile(
    viewerUserId: string,
    profileOwnerUserId: string,
  ): Promise<PersonalProfileViewResult<PersonalProfileViewDTO>>;
  acceptFriendRequestFromProfile(
    viewerUserId: string,
    pendingRequestId: string,
  ): Promise<PersonalProfileViewResult<PersonalProfileViewDTO>>;
  requestProfileContactAccess(
    viewerUserId: string,
    profileOwnerUserId: string,
    message: string,
  ): Promise<PersonalProfileViewResult<PersonalProfileViewDTO>>;
}
