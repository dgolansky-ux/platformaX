import { useCallback, useState } from "react";
import type {
  ApprovedContactField,
  ContactPersonSummary,
  ContactProfileAction,
  ContactProfileRelationshipDTO,
  ContactRequest,
  ContactsTabData,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import { contactsMockAdapter } from "./mock-adapter";

type Detail = {
  summary: ContactPersonSummary;
  relationship: ContactProfileRelationshipDTO;
};

type ActionCtx = {
  viewerId: UserId;
  personId: UserId;
  tabData: ContactsTabData | null;
  openRequest: () => void;
  openAccept: (req: ContactRequest) => void;
};

/** Maps one availableAction to a mock-adapter mutation (or opens a modal). */
async function runDetailAction(
  action: ContactProfileAction,
  ctx: ActionCtx,
): Promise<void> {
  const a = contactsMockAdapter;
  const { viewerId, personId } = ctx;
  switch (action) {
    case "REQUEST_CONTACT":
      return ctx.openRequest();
    case "RESPOND_TO_CONTACT_REQUEST": {
      const req = ctx.tabData?.incomingContactRequests.find((r) => r.fromUserId === personId);
      if (req) ctx.openAccept(req);
      return;
    }
    case "ADD_TO_CONTACTS":
      return a.addAddressBookContact(viewerId, personId);
    case "REMOVE_FROM_CONTACTS":
      return a.removeAddressBookContact(viewerId, personId);
    case "ADD_AS_SPECIALIST":
      return a.addSpecialist(viewerId, personId);
    case "REMOVE_SPECIALIST":
      return a.removeSpecialist(viewerId, personId);
    case "SEND_FRIEND_REQUEST":
      return a.sendFriendRequest(viewerId, personId);
    case "REMOVE_FRIEND":
      return a.removeFriend(viewerId, personId);
    case "RESPOND_TO_FRIEND_REQUEST": {
      const fr = ctx.tabData?.incomingFriendRequests.find((r) => r.fromUserId === personId);
      if (fr) await a.respondToFriendRequest({ requestId: fr.id, responderId: viewerId, action: "accepted" });
      return;
    }
  }
}

export type ContactInteractions = {
  detail: Detail | null;
  requestTarget: ContactPersonSummary | null;
  acceptRequest: ContactRequest | null;
  openDetail: (summary: ContactPersonSummary) => Promise<void>;
  closeDetail: () => void;
  dispatch: (action: ContactProfileAction) => Promise<void>;
  openAccept: (req: ContactRequest) => void;
  submitRequest: (input: { message: string; purpose?: string }) => Promise<void>;
  submitAccept: (fields: readonly ApprovedContactField[]) => Promise<void>;
  closeRequestModal: () => void;
  closeAcceptModal: () => void;
};

export function useContactInteractions(
  viewerId: UserId,
  tabData: ContactsTabData | null,
  reload: () => Promise<void>,
): ContactInteractions {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [requestTarget, setRequestTarget] = useState<ContactPersonSummary | null>(null);
  const [acceptRequest, setAcceptRequest] = useState<ContactRequest | null>(null);

  const loadDetail = useCallback(
    async (summary: ContactPersonSummary) => {
      const relationship = await contactsMockAdapter.getViewerSafeProfileState(summary.userId, viewerId);
      setDetail({ summary, relationship });
    },
    [viewerId],
  );

  const dispatch = useCallback(
    async (action: ContactProfileAction) => {
      if (!detail) return;
      await runDetailAction(action, {
        viewerId,
        personId: detail.summary.userId,
        tabData,
        openRequest: () => setRequestTarget(detail.summary),
        openAccept: setAcceptRequest,
      });
      await reload();
      await loadDetail(detail.summary);
    },
    [detail, viewerId, tabData, reload, loadDetail],
  );

  const submitRequest = useCallback(
    async (input: { message: string; purpose?: string }) => {
      if (!requestTarget) return;
      await contactsMockAdapter.sendContactRequest({ fromUserId: viewerId, toUserId: requestTarget.userId, ...input });
      setRequestTarget(null);
      await reload();
      if (detail) await loadDetail(detail.summary);
    },
    [requestTarget, viewerId, reload, detail, loadDetail],
  );

  const submitAccept = useCallback(
    async (fields: readonly ApprovedContactField[]) => {
      if (!acceptRequest) return;
      await contactsMockAdapter.respondToContactRequest({ requestId: acceptRequest.id, responderId: viewerId, action: "accepted", approvedFields: fields });
      setAcceptRequest(null);
      await reload();
      if (detail) await loadDetail(detail.summary);
    },
    [acceptRequest, viewerId, reload, detail, loadDetail],
  );

  return {
    detail,
    requestTarget,
    acceptRequest,
    openDetail: loadDetail,
    closeDetail: () => setDetail(null),
    dispatch,
    openAccept: setAcceptRequest,
    submitRequest,
    submitAccept,
    closeRequestModal: () => setRequestTarget(null),
    closeAcceptModal: () => setAcceptRequest(null),
  };
}
