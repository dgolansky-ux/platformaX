/**
 * application-v2/use-cases/personal-profile-view — unified owner/viewer view.
 *
 * Orchestrates identity (profile + contact-access), social (friendship),
 * and optional public-hub / workplaces / channels resolvers into ONE
 * PersonalProfileViewDTO. The same DTO drives both the owner view and any
 * non-owner viewer view at `/profile/:username`; per-section permissions in
 * viewerState dictate what the UI renders.
 *
 * Constraints:
 *  - imports only public-api modules of other domains.
 *  - owns NO entities or persistence.
 *  - never returns raw identity / contact records.
 *  - per-section optional resolvers are wired by application bootstrap;
 *    when not provided the use-case returns a truthful empty state.
 */
import type {
  PersonalProfileViewDTO,
  PersonalProfileViewError,
  PersonalProfileViewErrorCode,
  PersonalProfileViewResult,
  ProfileChannelsEntryDTO,
  ProfileContactPanelDTO,
  ProfileOwnerActionsDTO,
  ProfilePublicHubDTO,
  ProfileRelationActionsDTO,
  ProfileSummaryDTO,
  ProfileViewerStateDTO,
  ProfileWorkplacesPreviewDTO,
} from "@shared/contracts/personal-profile-view";
import type { UserId } from "@shared/contracts/branded-ids";
import { toUserId } from "@shared/contracts/branded-ids";
import type {
  ContactAccessService,
  IdentityProfileRepository,
  IdentityService,
  PublicProfileDTO,
} from "@server/domains-v2/identity/public-api";
import type { SocialContactsService } from "@server/domains-v2/social/public-api";
import type {
  PersonalProfileChannelsResolver,
  PersonalProfilePublicHubResolver,
  PersonalProfileWorkplacesResolver,
} from "./contracts";
import {
  decideViewerRelation,
  deriveViewerState,
  friendFeedAvailability,
  hiddenFieldsReason,
  projectVisibleContactFields,
} from "./policy";
import { createContactsApplicationService } from "@server/application-v2/use-cases/contacts/public-api";

export interface PersonalProfileViewServiceDeps {
  identity: IdentityService;
  identityRepository: IdentityProfileRepository;
  contactAccess: ContactAccessService;
  social: SocialContactsService;
  workplaces?: PersonalProfileWorkplacesResolver;
  publicHub?: PersonalProfilePublicHubResolver;
  channels?: PersonalProfileChannelsResolver;
}

export type { PersonalProfileViewError, PersonalProfileViewErrorCode, PersonalProfileViewResult };

export interface GetPersonalProfileViewInput {
  viewerUserId: string | null;
  profileUsername: string;
}

export interface PersonalProfileViewService {
  getPersonalProfileView(
    input: GetPersonalProfileViewInput,
  ): Promise<PersonalProfileViewResult<PersonalProfileViewDTO>>;
}

function fail<T>(code: PersonalProfileViewErrorCode, message: string): PersonalProfileViewResult<T> {
  return { ok: false, error: { code, message } };
}

function summaryOf(profile: PublicProfileDTO, username: string): ProfileSummaryDTO {
  // Media URL resolution lives in `application-v2/use-cases/profile` for the
  // owner edit dashboard; the unified profile view stays TRANSPORT_PARTIAL for
  // media until a thin resolver is added. The frontend mock adapter seeds URLs
  // locally so the UI is exercised end-to-end during the Slice 15 phase.
  return {
    userId: profile.userId,
    username,
    displayName: profile.displayName,
    avatarUrl: null,
    bannerUrl: null,
    bio: profile.bio,
    location: profile.location,
    publicSummary: profile.personalStatus?.text ?? null,
  };
}

function ownerActionsFor(viewerState: ProfileViewerStateDTO): ProfileOwnerActionsDTO {
  const isOwner = viewerState.canEditProfile;
  return {
    canEditAvatar: isOwner,
    canEditBanner: isOwner,
    canEditBio: isOwner,
    canManageProfile: isOwner,
    canManageProfessionalLayer: isOwner,
    canManageModules: isOwner,
    canAddWorkplace: isOwner,
  };
}

function relationToResolverInput(relation: ProfileViewerStateDTO["relation"]): "owner" | "friend" | "stranger" | "anonymous" {
  if (relation === "owner") return "owner";
  if (relation === "friend") return "friend";
  if (relation === "unauthenticated") return "anonymous";
  return "stranger";
}

function emptyWorkplaces(viewerState: ProfileViewerStateDTO): ProfileWorkplacesPreviewDTO {
  return { items: [], canAddWorkplace: viewerState.canEditProfile, totalVisibleCount: 0 };
}

function emptyPublicHub(viewerState: ProfileViewerStateDTO): ProfilePublicHubDTO {
  return {
    modules: [],
    sections: viewerState.canViewPublicHub ? ["about"] : [],
    canManageModules: viewerState.canEditProfile,
  };
}

function defaultChannelsEntry(): ProfileChannelsEntryDTO {
  return { canOpen: true, targetRoute: "/channels", channelCount: null };
}

async function buildContactPanel(
  contactAccess: ContactAccessService,
  social: SocialContactsService,
  profileOwnerUserId: string,
  viewerUserId: string | null,
  viewerState: ProfileViewerStateDTO,
): Promise<ProfileContactPanelDTO> {
  const contacts = createContactsApplicationService({
    identityContactAccess: contactAccess,
    socialContacts: social,
  });
  const rel = await contacts.getProfileContactRelationship(
    toUserId(profileOwnerUserId),
    viewerUserId ? toUserId(viewerUserId) : null,
  );
  if (!rel.ok) {
    return {
      visibleFields: [],
      hiddenFieldsReason: viewerUserId ? "stranger" : "anonymous",
      requestContactAccessAvailable: viewerState.canRequestContactAccess,
      approvedFields: [],
    };
  }
  const visible = projectVisibleContactFields({
    ownerId: toUserId(profileOwnerUserId),
    viewerId: viewerUserId ? toUserId(viewerUserId) : null,
    fields: rel.value.visibleContactFields,
  });
  return {
    visibleFields: visible,
    hiddenFieldsReason: hiddenFieldsReason(viewerState.relation, visible.length),
    requestContactAccessAvailable:
      !viewerState.canEditProfile && viewerState.canRequestContactAccess,
    approvedFields: visible.map((v) => v.field),
  };
}

async function buildRelationActions(
  contactAccess: ContactAccessService,
  social: SocialContactsService,
  profileOwnerUserId: string,
  viewerUserId: string | null,
): Promise<ProfileRelationActionsDTO> {
  if (viewerUserId === null) {
    return {
      canSendFriendRequest: false,
      canCancelFriendRequest: false,
      canAcceptFriendRequest: false,
      canRejectFriendRequest: false,
      canRequestContactAccess: false,
      pendingFriendRequestId: null,
      pendingContactRequestId: null,
    };
  }
  const ownerId = toUserId(profileOwnerUserId);
  const viewerId = toUserId(viewerUserId);
  const [incomingFriendReq, outgoingFriendReq, sentContactReqs] = await Promise.all([
    social.listIncomingFriendRequests(viewerId),
    social.listOutgoingFriendRequests(viewerId),
    contactAccess.getSentContactRequests(viewerId),
  ]);
  const inFromOwner = incomingFriendReq.find((r) => r.requesterUserId === ownerId);
  const outToOwner = outgoingFriendReq.find((r) => r.receiverUserId === ownerId);
  const pendingContact = sentContactReqs.find(
    (r) => r.toUserId === ownerId && r.status === "pending",
  );
  const isFriend = await social.areFriends(ownerId, viewerId);
  const canSendFriendRequest = !isFriend && !inFromOwner && !outToOwner && viewerUserId !== profileOwnerUserId;
  return {
    canSendFriendRequest,
    canCancelFriendRequest: Boolean(outToOwner && outToOwner.status === "pending"),
    canAcceptFriendRequest: Boolean(inFromOwner && inFromOwner.status === "pending"),
    canRejectFriendRequest: Boolean(inFromOwner && inFromOwner.status === "pending"),
    canRequestContactAccess:
      !isFriend && !pendingContact && viewerUserId !== profileOwnerUserId,
    pendingFriendRequestId: inFromOwner?.id ?? outToOwner?.id ?? null,
    pendingContactRequestId: pendingContact?.id ?? null,
  };
}

async function compose(
  deps: PersonalProfileViewServiceDeps,
  input: GetPersonalProfileViewInput,
  ownerUserId: string,
  profile: PublicProfileDTO,
  username: string,
): Promise<PersonalProfileViewResult<PersonalProfileViewDTO>> {
  const contacts = createContactsApplicationService({
    identityContactAccess: deps.contactAccess,
    socialContacts: deps.social,
  });
  const ownerBranded = toUserId(ownerUserId);
  const viewerBranded: UserId | null = input.viewerUserId ? toUserId(input.viewerUserId) : null;
  const relRes = await contacts.getProfileContactRelationship(ownerBranded, viewerBranded);
  if (!relRes.ok) {
    return fail("PROFILE_FORBIDDEN", relRes.error.message);
  }
  const relation = decideViewerRelation({
    viewerUserId: input.viewerUserId,
    profileOwnerUserId: ownerUserId,
    profileVisibility: profile.visibility,
    relationship: relRes.value,
  });
  const viewerState = deriveViewerState(relation, {
    viewerUserId: input.viewerUserId,
    profileOwnerUserId: ownerUserId,
    profileVisibility: profile.visibility,
    relationship: relRes.value,
  });

  if (profile.visibility === "private" && !viewerState.canEditProfile) {
    return fail("PROFILE_RESTRICTED", "Ten profil jest prywatny.");
  }

  const [contactPanel, relationActions, workplacesPreview, publicHub, channelsEntry] = await Promise.all([
    buildContactPanel(deps.contactAccess, deps.social, ownerUserId, input.viewerUserId, viewerState),
    buildRelationActions(deps.contactAccess, deps.social, ownerUserId, input.viewerUserId),
    deps.workplaces
      ? deps.workplaces.listWorkplacesForViewer({
          profileOwnerUserId: ownerUserId,
          viewerUserId: input.viewerUserId,
          relation: relationToResolverInput(relation),
        }).then((items) => ({
          items,
          canAddWorkplace: viewerState.canEditProfile,
          totalVisibleCount: items.length,
        }))
      : Promise.resolve(emptyWorkplaces(viewerState)),
    deps.publicHub
      ? deps.publicHub.getProfileHubForViewer({
          profileOwnerUserId: ownerUserId,
          viewerUserId: input.viewerUserId,
          relation: relationToResolverInput(relation),
        })
      : Promise.resolve(emptyPublicHub(viewerState)),
    deps.channels
      ? deps.channels.getProfileChannelsEntry({
          profileOwnerUserId: ownerUserId,
          viewerUserId: input.viewerUserId,
          relation: relationToResolverInput(relation),
        })
      : Promise.resolve(defaultChannelsEntry()),
  ]);

  const view: PersonalProfileViewDTO = {
    profile: summaryOf(profile, username),
    viewerState,
    ownerActions: ownerActionsFor(viewerState),
    relationActions,
    contactPanel,
    workplacesPreview,
    publicHub,
    friendFeedPreview: friendFeedAvailability(relation),
    channelsEntry,
  };
  return { ok: true, value: view };
}

export function createPersonalProfileViewService(
  deps: PersonalProfileViewServiceDeps,
): PersonalProfileViewService {
  return {
    async getPersonalProfileView(input) {
      const slug = input.profileUsername.trim();
      if (slug.length === 0) return fail("PROFILE_NOT_FOUND", "Brak nazwy użytkownika.");
      const found = await deps.identityRepository.findBySlug(slug);
      if (!found) return fail("PROFILE_NOT_FOUND", "Profil nie istnieje.");
      const ownerUserId = found.userId;
      const publicRes = await deps.identity.getPublicProfile(
        input.viewerUserId,
        ownerUserId,
      );
      if (!publicRes.ok) {
        if (publicRes.error.code === "NOT_FOUND") {
          return fail("PROFILE_NOT_FOUND", "Profil nie istnieje.");
        }
        if (publicRes.error.code === "FORBIDDEN") {
          // Identity refuses non-owner reads of a private profile. From the UI
          // perspective the profile exists but is restricted — distinct from a
          // generic forbidden so the page can render a friendly state.
          return fail("PROFILE_RESTRICTED", "Ten profil jest prywatny.");
        }
        return fail("PROFILE_NOT_FOUND", publicRes.error.message);
      }
      return compose(deps, input, ownerUserId, publicRes.value, slug);
    },
  };
}
