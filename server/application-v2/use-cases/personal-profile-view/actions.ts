/**
 * application-v2/use-cases/personal-profile-view — thin action wrappers.
 *
 * Forwarders that translate "user did X on the profile page" into the
 * canonical domain calls. They DELIBERATELY do not duplicate the underlying
 * logic — friendship lives in `social-contacts-service` and contact requests
 * live in `identity/contact-access-service`. The wrappers exist so the
 * frontend never reaches multiple services from one click.
 */
import { toUserId } from "@shared/contracts/branded-ids";
import type { UserId } from "@shared/contracts/branded-ids";
import type { ContactAccessService } from "@server/domains-v2/identity/public-api";
import type {
  FriendRequest,
  SocialContactsResult,
  SocialContactsService,
} from "@server/domains-v2/social/public-api";
import type { ContactRequest } from "@shared/contracts/contacts";

export interface ProfilePageActionDeps {
  social: SocialContactsService;
  contactAccess: ContactAccessService;
}

export interface ProfilePageActions {
  sendFriendRequestFromProfile(input: {
    viewerUserId: string;
    profileOwnerUserId: string;
  }): Promise<SocialContactsResult<FriendRequest>>;
  acceptFriendRequestFromProfile(input: {
    viewerUserId: string;
    pendingRequestId: string;
  }): Promise<SocialContactsResult<FriendRequest>>;
  requestProfileContactAccess(input: {
    viewerUserId: string;
    profileOwnerUserId: string;
    message: string;
    purpose?: string;
  }): Promise<{ ok: true; value: ContactRequest } | { ok: false; error: { code: string; message: string } }>;
}

export function createProfilePageActions(deps: ProfilePageActionDeps): ProfilePageActions {
  return {
    sendFriendRequestFromProfile({ viewerUserId, profileOwnerUserId }) {
      const requester: UserId = toUserId(viewerUserId);
      const receiver: UserId = toUserId(profileOwnerUserId);
      return deps.social.sendFriendRequest({ requesterUserId: requester, receiverUserId: receiver });
    },
    acceptFriendRequestFromProfile({ viewerUserId, pendingRequestId }) {
      return deps.social.respondToFriendRequest({
        requestId: pendingRequestId,
        responderUserId: toUserId(viewerUserId),
        action: "accepted",
      });
    },
    async requestProfileContactAccess({ viewerUserId, profileOwnerUserId, message, purpose }) {
      const res = await deps.contactAccess.sendContactRequest({
        fromUserId: toUserId(viewerUserId),
        toUserId: toUserId(profileOwnerUserId),
        message,
        purpose,
      });
      if (!res.ok) return res;
      return { ok: true, value: res.value };
    },
  };
}
