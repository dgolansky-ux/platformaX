/**
 * features-v2/personal-profile — MOCK_LOCAL_ONLY transport.
 *
 * In-memory adapter that mirrors the `PersonalProfileViewAdapter` contract
 * from `@shared/contracts/personal-profile-view`. Seeds three fixture
 * profiles (owner, friend-of-owner, stranger) so the unified profile page
 * can be exercised against every viewer relation without `@server/*`
 * imports or localStorage.
 *
 * `isPersistent()` returns `false` — writes do not survive a page reload.
 */
import type {
  PersonalProfileViewAdapter,
  PersonalProfileViewDTO,
  PersonalProfileViewResult,
  ProfileViewerRelation,
} from "@shared/contracts/personal-profile-view";
import type { ApprovedContactField } from "@shared/contracts/contacts";
import { seedProfiles, type SeededProfile } from "./fixtures";

interface FriendRequestRow {
  id: string;
  requesterUserId: string;
  receiverUserId: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
}

interface ContactRequestRow {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  approvedFields: readonly ApprovedContactField[];
}

interface State {
  profiles: Map<string, SeededProfile>;
  friends: Set<string>;
  friendRequests: FriendRequestRow[];
  contactRequests: ContactRequestRow[];
  seq: number;
}

function freshState(): State {
  const profiles = new Map<string, SeededProfile>();
  for (const p of seedProfiles()) profiles.set(p.username, p);
  return {
    profiles,
    friends: new Set<string>(["u-viewer|u-ada", "u-ada|u-viewer"]),
    friendRequests: [],
    contactRequests: [],
    seq: 1,
  };
}

let state: State = freshState();

function friendshipKey(a: string, b: string): string {
  return `${a}|${b}`;
}

function areFriends(a: string, b: string): boolean {
  return state.friends.has(friendshipKey(a, b)) || state.friends.has(friendshipKey(b, a));
}

function fail<T>(code: "PROFILE_NOT_FOUND" | "PROFILE_FORBIDDEN" | "PROFILE_RESTRICTED" | "UNAUTHENTICATED", message: string): PersonalProfileViewResult<T> {
  return { ok: false, error: { code, message } };
}

function relationFor(
  viewerUserId: string | null,
  ownerId: string,
): ProfileViewerRelation {
  if (viewerUserId === null) return "unauthenticated";
  if (viewerUserId === ownerId) return "owner";
  if (areFriends(viewerUserId, ownerId)) return "friend";
  const incoming = state.friendRequests.find(
    (r) => r.requesterUserId === ownerId && r.receiverUserId === viewerUserId && r.status === "pending",
  );
  if (incoming) return "pending_friend_request_received";
  const outgoing = state.friendRequests.find(
    (r) => r.requesterUserId === viewerUserId && r.receiverUserId === ownerId && r.status === "pending",
  );
  if (outgoing) return "pending_friend_request_sent";
  const contactAccepted = state.contactRequests.find(
    (r) => r.fromUserId === viewerUserId && r.toUserId === ownerId && r.status === "accepted",
  );
  if (contactAccepted) return "contact_approved";
  return "stranger";
}

function buildView(
  profile: SeededProfile,
  viewerUserId: string | null,
): PersonalProfileViewDTO {
  const relation = relationFor(viewerUserId, profile.userId);
  const isOwner = relation === "owner";
  const isFriend = relation === "friend";
  const isContactApproved = relation === "contact_approved";
  const isAuthenticated = viewerUserId !== null;
  const isPublic = profile.visibility === "public";

  const visibleFields: { field: ApprovedContactField; value: string }[] = [];
  for (const field of profile.contactFields) {
    if (isOwner) {
      visibleFields.push({ field: field.field, value: field.value });
      continue;
    }
    if (isFriend && field.friendsVisible) {
      visibleFields.push({ field: field.field, value: field.value });
      continue;
    }
    const approved = state.contactRequests.find(
      (r) =>
        r.fromUserId === viewerUserId &&
        r.toUserId === profile.userId &&
        r.status === "accepted" &&
        r.approvedFields.includes(field.field),
    );
    if (approved && field.approvedVisible) {
      visibleFields.push({ field: field.field, value: field.value });
    }
  }
  const hiddenReason: PersonalProfileViewDTO["contactPanel"]["hiddenFieldsReason"] = (() => {
    if (visibleFields.length > 0) return "none";
    if (isOwner) return "owner";
    if (isFriend) return "friend_policy";
    if (relation === "unauthenticated") return "anonymous";
    return "stranger";
  })();

  const outToOwner = viewerUserId
    ? state.friendRequests.find(
        (r) => r.requesterUserId === viewerUserId && r.receiverUserId === profile.userId && r.status === "pending",
      )
    : undefined;
  const inFromOwner = viewerUserId
    ? state.friendRequests.find(
        (r) => r.requesterUserId === profile.userId && r.receiverUserId === viewerUserId && r.status === "pending",
      )
    : undefined;
  const pendingContact = viewerUserId
    ? state.contactRequests.find(
        (r) => r.fromUserId === viewerUserId && r.toUserId === profile.userId && r.status === "pending",
      )
    : undefined;

  return {
    profile: {
      userId: profile.userId,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      bannerUrl: profile.bannerUrl,
      bio: profile.bio,
      location: profile.location,
      publicSummary: profile.publicSummary,
    },
    viewerState: {
      viewerUserId,
      profileOwnerUserId: profile.userId,
      relation,
      canEditProfile: isOwner,
      canViewPublicProfile: isOwner || isAuthenticated || isPublic,
      canViewProfessionalLayer: isOwner || isPublic || isFriend || isContactApproved,
      canViewWorkplaces: isOwner || profile.visibility !== "private",
      canViewPublicHub: isOwner || isPublic || isFriend,
      canViewModules: isOwner || isPublic || isFriend,
      canViewFriendFeedPreview: isOwner || isFriend,
      canViewContactFields: visibleFields.length > 0,
      canSendFriendRequest: !isOwner && isAuthenticated && relation === "stranger",
      canAcceptFriendRequest: relation === "pending_friend_request_received",
      canRequestContactAccess: !isOwner && isAuthenticated && !pendingContact && !isFriend,
      canOpenChannels: isOwner || isPublic || isFriend || isContactApproved,
      canOpenWorkplaces: isOwner || profile.visibility !== "private",
    },
    ownerActions: {
      canEditAvatar: isOwner,
      canEditBanner: isOwner,
      canEditBio: isOwner,
      canManageProfile: isOwner,
      canManageProfessionalLayer: isOwner,
      canManageModules: isOwner,
      canAddWorkplace: isOwner,
    },
    relationActions: {
      canSendFriendRequest: !isOwner && isAuthenticated && !outToOwner && !inFromOwner && !isFriend,
      canCancelFriendRequest: Boolean(outToOwner),
      canAcceptFriendRequest: Boolean(inFromOwner),
      canRejectFriendRequest: Boolean(inFromOwner),
      canRequestContactAccess: !isOwner && isAuthenticated && !pendingContact && !isFriend,
      pendingFriendRequestId: outToOwner?.id ?? inFromOwner?.id ?? null,
      pendingContactRequestId: pendingContact?.id ?? null,
    },
    contactPanel: {
      visibleFields,
      hiddenFieldsReason: hiddenReason,
      requestContactAccessAvailable: !isOwner && isAuthenticated && !pendingContact && !isFriend,
      approvedFields: visibleFields.map((v) => v.field),
    },
    workplacesPreview: {
      items: profile.workplaces.filter((w) => {
        if (isOwner) return true;
        if (w.visibility === "private") return false;
        if (w.visibility === "friends_only") return isFriend || isContactApproved;
        return true;
      }),
      canAddWorkplace: isOwner,
      totalVisibleCount: profile.workplaces.filter((w) => {
        if (isOwner) return true;
        if (w.visibility === "private") return false;
        if (w.visibility === "friends_only") return isFriend || isContactApproved;
        return true;
      }).length,
    },
    publicHub: {
      modules: profile.publicHubModules,
      sections: isOwner || isPublic || isFriend ? ["about", "modules", "channels", "feed_preview"] : [],
      canManageModules: isOwner,
    },
    friendFeedPreview: (() => {
      if (isOwner) return { canView: true, reason: "owner", targetRoute: "/friends-feed" };
      if (isFriend) return { canView: true, reason: "friend", targetRoute: "/friends-feed" };
      if (relation === "unauthenticated") return { canView: false, reason: "anonymous", targetRoute: "/login" };
      return { canView: false, reason: "stranger", targetRoute: "/friends-feed" };
    })(),
    channelsEntry: {
      canOpen: isOwner || isPublic || isFriend || isContactApproved,
      targetRoute: "/channels",
      channelCount: profile.channelCount,
    },
  };
}

export const personalProfileMockAdapter: PersonalProfileViewAdapter = {
  isPersistent() {
    return false;
  },
  async getPersonalProfileView(viewerUserId, profileUsername) {
    const slug = profileUsername.replace(/^@/, "").trim();
    const profile = state.profiles.get(slug);
    if (!profile) return fail("PROFILE_NOT_FOUND", "Nie ma takiego profilu.");
    if (profile.visibility === "private" && viewerUserId !== profile.userId) {
      return fail("PROFILE_RESTRICTED", "Ten profil jest prywatny.");
    }
    return { ok: true, value: buildView(profile, viewerUserId) };
  },
  async sendFriendRequestFromProfile(viewerUserId, profileOwnerUserId) {
    const profile = [...state.profiles.values()].find((p) => p.userId === profileOwnerUserId);
    if (!profile) return fail("PROFILE_NOT_FOUND", "Profil nie istnieje.");
    if (viewerUserId === profileOwnerUserId) return fail("PROFILE_FORBIDDEN", "Nie można wysłać zaproszenia do siebie.");
    const exists = state.friendRequests.some(
      (r) => r.requesterUserId === viewerUserId && r.receiverUserId === profileOwnerUserId && r.status === "pending",
    );
    if (!exists) {
      state.friendRequests.push({
        id: `fr-${state.seq++}`,
        requesterUserId: viewerUserId,
        receiverUserId: profileOwnerUserId,
        status: "pending",
      });
    }
    return { ok: true, value: buildView(profile, viewerUserId) };
  },
  async acceptFriendRequestFromProfile(viewerUserId, pendingRequestId) {
    const req = state.friendRequests.find((r) => r.id === pendingRequestId);
    if (!req) return fail("PROFILE_NOT_FOUND", "Brak zaproszenia.");
    if (req.receiverUserId !== viewerUserId) return fail("PROFILE_FORBIDDEN", "Tylko odbiorca może zaakceptować.");
    req.status = "accepted";
    state.friends.add(friendshipKey(req.requesterUserId, req.receiverUserId));
    state.friends.add(friendshipKey(req.receiverUserId, req.requesterUserId));
    const profile = [...state.profiles.values()].find((p) => p.userId === req.requesterUserId);
    if (!profile) return fail("PROFILE_NOT_FOUND", "Profil nie istnieje.");
    return { ok: true, value: buildView(profile, viewerUserId) };
  },
  async requestProfileContactAccess(viewerUserId, profileOwnerUserId, message) {
    if (message.trim().length === 0) return fail("PROFILE_FORBIDDEN", "Treść wiadomości jest wymagana.");
    const profile = [...state.profiles.values()].find((p) => p.userId === profileOwnerUserId);
    if (!profile) return fail("PROFILE_NOT_FOUND", "Profil nie istnieje.");
    const exists = state.contactRequests.some(
      (r) => r.fromUserId === viewerUserId && r.toUserId === profileOwnerUserId && r.status === "pending",
    );
    if (!exists) {
      state.contactRequests.push({
        id: `cr-${state.seq++}`,
        fromUserId: viewerUserId,
        toUserId: profileOwnerUserId,
        status: "pending",
        approvedFields: [],
      });
    }
    return { ok: true, value: buildView(profile, viewerUserId) };
  },
};

/** Test-only reset so test files can run in isolation. */
export function __resetPersonalProfileMockForTests(): void {
  state = freshState();
}
