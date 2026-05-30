/**
 * notifications-v2 — event registry (decision table).
 *
 * Single source of truth for "does this product event create an in-app
 * notification, and to whom?". Adding a new product event should always be
 * accompanied by a new entry here; the `event-registry` test asserts that no
 * entry is malformed (empty recipient/actor/reason, unknown category).
 *
 * Statuses:
 *   - implemented                       — application-v2 handler wired in Slice 14
 *   - planned                           — decision is `yes` but handler not wired yet
 *   - no_notification_needed            — explicit decision NOT to notify
 *   - blocked_by_missing_source_event   — handler intent exists but source event
 *                                         hasn't been emitted yet by the source domain
 */
import type { NotificationCategory, NotificationEventHandlerStatus } from "./contracts";

export interface NotificationEventRegistryEntry {
  eventType: string;
  sourceDomain: string;
  createsNotification: boolean;
  recipientRule: string;
  actorRule: string;
  category: NotificationCategory | null;
  reason: string;
  handlerStatus: NotificationEventHandlerStatus;
}

export const NOTIFICATION_EVENT_REGISTRY: readonly NotificationEventRegistryEntry[] = [
  // ── Friend feed ────────────────────────────────────────────────────────
  {
    eventType: "FriendFeedPostCreated",
    sourceDomain: "content-v2/friend-posts",
    createsNotification: false,
    recipientRule: "—",
    actorRule: "postAuthorId",
    category: null,
    reason:
      "Friends already see new posts through the friend feed itself — pushing a notification per post would be noise.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "FriendFeedCommentCreated",
    sourceDomain: "content-v2/friend-posts",
    createsNotification: true,
    recipientRule: "postAuthorId",
    actorRule: "commentAuthorId",
    category: "friend_feed",
    reason: "Post author should be notified about a new comment on their post.",
    handlerStatus: "implemented",
  },
  {
    eventType: "FriendFeedReactionAdded",
    sourceDomain: "content-v2/friend-posts",
    createsNotification: true,
    recipientRule: "postAuthorId",
    actorRule: "reactorId",
    category: "friend_feed",
    reason: "Post author should be notified about a new reaction on their post.",
    handlerStatus: "implemented",
  },
  {
    eventType: "FriendFeedCommentReactionAdded",
    sourceDomain: "content-v2/friend-posts",
    createsNotification: true,
    recipientRule: "commentAuthorId",
    actorRule: "reactorId",
    category: "friend_feed",
    reason: "Comment author should be notified about a new reaction on their comment.",
    handlerStatus: "implemented",
  },
  {
    eventType: "FriendRequestSent",
    sourceDomain: "social",
    createsNotification: true,
    recipientRule: "recipientUserId",
    actorRule: "actorUserId",
    category: "system",
    reason:
      "Recipient should be notified about a new friend request from another user.",
    handlerStatus: "planned",
  },
  {
    eventType: "FriendRequestAccepted",
    sourceDomain: "social",
    createsNotification: true,
    recipientRule: "recipientUserId (requester)",
    actorRule: "actorUserId",
    category: "system",
    reason:
      "Requester should be notified that their friend request was accepted.",
    handlerStatus: "planned",
  },
  {
    eventType: "FriendRequestRejected",
    sourceDomain: "social",
    createsNotification: false,
    recipientRule: "requesterUserId",
    actorRule: "actorUserId",
    category: "system",
    reason:
      "No notification by default to reduce rejection noise in activity center.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "FriendRemoved",
    sourceDomain: "social",
    createsNotification: false,
    recipientRule: "otherUserId",
    actorRule: "actorUserId",
    category: "system",
    reason:
      "Friend remove is intentionally silent to avoid punitive notification spam.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "UserBlocked",
    sourceDomain: "social",
    createsNotification: false,
    recipientRule: "blockedUserId",
    actorRule: "actorUserId",
    category: "system",
    reason:
      "User blocking is a safety control and should not ping blocked users.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "ContactAccessRequested",
    sourceDomain: "identity/contact-access",
    createsNotification: true,
    recipientRule: "ownerUserId",
    actorRule: "actorUserId",
    category: "professional",
    reason: "Profile owner should receive a request for contact data access.",
    handlerStatus: "planned",
  },
  {
    eventType: "ContactAccessApproved",
    sourceDomain: "identity/contact-access",
    createsNotification: true,
    recipientRule: "requesterUserId",
    actorRule: "actorUserId",
    category: "professional",
    reason: "Requester should be notified when selected fields are approved.",
    handlerStatus: "planned",
  },
  {
    eventType: "ContactAccessRejected",
    sourceDomain: "identity/contact-access",
    createsNotification: false,
    recipientRule: "requesterUserId",
    actorRule: "actorUserId",
    category: "professional",
    reason:
      "Contact rejection is silent by policy for now to avoid negative nudges.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "ContactAccessRevoked",
    sourceDomain: "identity/contact-access",
    createsNotification: false,
    recipientRule: "requesterUserId",
    actorRule: "actorUserId",
    category: "professional",
    reason:
      "Revocation is owner privacy control; explicit notification not required.",
    handlerStatus: "no_notification_needed",
  },

  // ── Moderation (Slice 20) ──────────────────────────────────────────────
  {
    eventType: "ModerationReportCreated",
    sourceDomain: "moderation",
    createsNotification: false,
    recipientRule: "—",
    actorRule: "reporterUserId",
    category: null,
    reason:
      "Public users do not receive a per-report notification; moderator queue is the surface that reflects new reports. Future internal admin notification is planned.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "ModerationReportReviewed",
    sourceDomain: "moderation",
    createsNotification: false,
    recipientRule: "—",
    actorRule: "actorModeratorUserId",
    category: null,
    reason:
      "Status changes between pending/under_review/dismissed are internal — no public notification by policy in Slice 20.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "ModerationActionTaken",
    sourceDomain: "moderation",
    createsNotification: true,
    recipientRule: "targetOwnerUserId",
    actorRule: "actorModeratorUserId",
    category: "system",
    reason:
      "When content is hidden / deactivated / restricted, the content owner may need to know — wiring deferred to a later slice with explicit policy. Skipped for the reporter to avoid retaliation cues.",
    handlerStatus: "planned",
  },

  // ── Communities ────────────────────────────────────────────────────────
  {
    eventType: "CommunityInviteCreated",
    sourceDomain: "communities-v2",
    createsNotification: true,
    recipientRule: "invitedUserId",
    actorRule: "inviterUserId",
    category: "communities",
    reason: "Invited user should see a clear inbox entry for new invites.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "CommunityJoinRequestCreated",
    sourceDomain: "communities-v2",
    createsNotification: true,
    recipientRule: "communityAdmins",
    actorRule: "requesterId",
    category: "communities",
    reason: "Founders / admins need to see incoming join requests.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "CommunityJoinRequestAccepted",
    sourceDomain: "communities-v2",
    createsNotification: true,
    recipientRule: "requesterId",
    actorRule: "decisionMakerId",
    category: "communities",
    reason: "Requester should be notified once their request is accepted.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "CommunityJoinRequestRejected",
    sourceDomain: "communities-v2",
    createsNotification: true,
    recipientRule: "requesterId",
    actorRule: "decisionMakerId",
    category: "communities",
    reason: "Requester should be notified once their request is rejected.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "CommunityRoleChanged",
    sourceDomain: "communities-v2",
    createsNotification: true,
    recipientRule: "affectedUserId",
    actorRule: "actorUserId",
    category: "communities",
    reason: "Member affected by a role change should be informed.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "SubcommunityCreated",
    sourceDomain: "communities-v2",
    createsNotification: false,
    recipientRule: "—",
    actorRule: "actorUserId",
    category: "communities",
    reason: "Default policy is silent until target audience is configured per community.",
    handlerStatus: "planned",
  },

  // ── Channels ───────────────────────────────────────────────────────────
  {
    eventType: "ChannelPostCreated",
    sourceDomain: "channels + content-v2/channel-posts",
    createsNotification: true,
    recipientRule: "channelFollowers",
    actorRule: "publisherId",
    category: "channels",
    reason: "Followers want to know about new posts on channels they follow.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "ChannelLeadAssigned",
    sourceDomain: "channels",
    createsNotification: true,
    recipientRule: "assignedUserId",
    actorRule: "actorUserId",
    category: "channels",
    reason: "Assigned lead should be informed about the new responsibility.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "ChannelLeadRevoked",
    sourceDomain: "channels",
    createsNotification: true,
    recipientRule: "affectedUserId",
    actorRule: "actorUserId",
    category: "channels",
    reason: "Affected lead should be informed when permissions are revoked.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "ChannelPostCommentCreated",
    sourceDomain: "content-v2/channel-posts (comments)",
    createsNotification: true,
    recipientRule: "postAuthorId",
    actorRule: "commentAuthorId",
    category: "channels",
    reason: "Channel post author should know about new comments.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "ChannelPostReactionAdded",
    sourceDomain: "content-v2/channel-posts (reactions)",
    createsNotification: true,
    recipientRule: "postAuthorId",
    actorRule: "reactorId",
    category: "channels",
    reason: "Channel post author should know about new reactions.",
    handlerStatus: "blocked_by_missing_source_event",
  },

  // ── Modules ────────────────────────────────────────────────────────────
  {
    eventType: "EventCreated",
    sourceDomain: "events-v2",
    createsNotification: true,
    recipientRule: "ownerAudience",
    actorRule: "actorUserId",
    category: "modules",
    reason: "Owner audience (subscribers / interested users) should see new events.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "EventUpdated",
    sourceDomain: "events-v2",
    createsNotification: true,
    recipientRule: "interestedUsers",
    actorRule: "actorUserId",
    category: "modules",
    reason: "Interested / going users should know when an event changes.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "TopicCreated",
    sourceDomain: "topics-v2",
    createsNotification: false,
    recipientRule: "—",
    actorRule: "actorUserId",
    category: "modules",
    reason: "Topics are reference data; per-create notifications would be noise.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "NewsletterMessagePublished",
    sourceDomain: "newsletter-chat-v2",
    createsNotification: true,
    recipientRule: "newsletterSubscribers",
    actorRule: "publisherId",
    category: "modules",
    reason: "Subscribers should see in-app notifications about new newsletter messages.",
    handlerStatus: "blocked_by_missing_source_event",
  },
  {
    eventType: "IntegrationCreated",
    sourceDomain: "integrations-v2",
    createsNotification: false,
    recipientRule: "—",
    actorRule: "actorUserId",
    category: "modules",
    reason: "Integrations are operator-led and not urgent enough to push.",
    handlerStatus: "no_notification_needed",
  },

  // ── Professional / Workplaces ──────────────────────────────────────────
  {
    eventType: "WorkplacePostCreated",
    sourceDomain: "content-v2/workplace-posts",
    createsNotification: false,
    recipientRule: "—",
    actorRule: "authorUserId",
    category: "professional",
    reason: "Workplace mini-teaser already appears on the friend feed — no extra notification needed.",
    handlerStatus: "no_notification_needed",
  },
  {
    eventType: "WorkplaceContactRequestCreated",
    sourceDomain: "identity/workplaces (planned)",
    createsNotification: true,
    recipientRule: "workplaceOwnerId",
    actorRule: "requesterId",
    category: "professional",
    reason: "Workplace owner should see a contact request from another user.",
    handlerStatus: "blocked_by_missing_source_event",
  },
];

/**
 * The integrity check used by tests + a CI guard to ensure every registry
 * entry has the fields required to drive a real decision. Returns the list
 * of failing entries (empty when all entries are well-formed).
 */
export function findRegistryIntegrityViolations(
  registry: readonly NotificationEventRegistryEntry[] = NOTIFICATION_EVENT_REGISTRY,
): readonly { eventType: string; field: string }[] {
  const violations: { eventType: string; field: string }[] = [];
  for (const entry of registry) {
    if (entry.eventType.trim().length === 0) violations.push({ eventType: entry.eventType, field: "eventType" });
    if (entry.sourceDomain.trim().length === 0) violations.push({ eventType: entry.eventType, field: "sourceDomain" });
    if (entry.recipientRule.trim().length === 0) violations.push({ eventType: entry.eventType, field: "recipientRule" });
    if (entry.actorRule.trim().length === 0) violations.push({ eventType: entry.eventType, field: "actorRule" });
    if (entry.reason.trim().length === 0) violations.push({ eventType: entry.eventType, field: "reason" });
    if (entry.createsNotification && !entry.category) {
      violations.push({ eventType: entry.eventType, field: "category" });
    }
  }
  return violations;
}
