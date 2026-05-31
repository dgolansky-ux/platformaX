import type { ReactElement } from "react";
import type { UserId } from "@shared/contracts/branded-ids";
import { ContactPersonDetailsPanel } from "./ContactPersonDetailsPanel";
import { ContactRequestModal } from "./ContactRequestModal";
import { AcceptContactRequestModal } from "./AcceptContactRequestModal";
import type { ContactInteractions } from "./useContactInteractions";

/**
 * Renders the person-detail panel + the request/grant modals driven by the
 * `useContactInteractions` hook. Kept out of ContactsTab so the orchestrator
 * stays small; all actions still flow through `availableActions`.
 */
export function ContactsInteractionLayer({
  viewerId,
  interactions,
}: {
  viewerId: UserId;
  interactions: ContactInteractions;
}): ReactElement | null {
  const {
    detail,
    requestTarget,
    acceptRequest,
    dispatch,
    closeDetail,
    submitRequest,
    submitAccept,
    closeRequestModal,
    closeAcceptModal,
  } = interactions;

  return (
    <>
      {detail ? (
        <ContactPersonDetailsPanel
          summary={detail.summary}
          relationship={detail.relationship}
          onAction={dispatch}
          onClose={closeDetail}
        />
      ) : null}

      {requestTarget ? (
        <ContactRequestModal
          target={requestTarget}
          onClose={closeRequestModal}
          onSubmit={submitRequest}
        />
      ) : null}

      {acceptRequest ? (
        <AcceptContactRequestModal
          request={acceptRequest}
          viewerId={viewerId}
          onClose={closeAcceptModal}
          onSubmit={submitAccept}
        />
      ) : null}
    </>
  );
}
