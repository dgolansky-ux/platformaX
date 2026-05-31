// PX-EVENT-001-ACK: social domain emits events in-process via the
// injected `publish` callback; the transactional outbox + EventEnvelope
// wrap is scheduled for the runtime backend slice. Tracked in
// docs/governance/EXCEPTIONS_REGISTER.md under EXC-016.
export type SocialEventBase = {
  requestId: string;
  actorUserId: string;
  recipientUserId: string;
  occurredAt: string;
  correlationId: string;
};

export type FriendRequestSentEvent = SocialEventBase & {
  type: "FriendRequestSent";
};

export type FriendRequestAcceptedEvent = SocialEventBase & {
  type: "FriendRequestAccepted";
};

export type FriendRequestRejectedEvent = SocialEventBase & {
  type: "FriendRequestRejected";
};

export type FriendRemovedEvent = SocialEventBase & {
  type: "FriendRemoved";
};

export type UserBlockedEvent = SocialEventBase & {
  type: "UserBlocked";
};

export type ContactAccessRequestedEvent = SocialEventBase & {
  type: "ContactAccessRequested";
};

export type ContactAccessApprovedEvent = SocialEventBase & {
  type: "ContactAccessApproved";
};

export type ContactAccessRejectedEvent = SocialEventBase & {
  type: "ContactAccessRejected";
};

export type ContactAccessRevokedEvent = SocialEventBase & {
  type: "ContactAccessRevoked";
};

export type SocialDomainEvent =
  | FriendRequestSentEvent
  | FriendRequestAcceptedEvent
  | FriendRequestRejectedEvent
  | FriendRemovedEvent
  | UserBlockedEvent
  | ContactAccessRequestedEvent
  | ContactAccessApprovedEvent
  | ContactAccessRejectedEvent
  | ContactAccessRevokedEvent;
