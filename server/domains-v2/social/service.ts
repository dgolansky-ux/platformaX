/**
 * server/domains-v2/social/service — friendship + block relationship orchestrator.
 *
 * QUALITY_STRUCTURE_EXCEPTION — Slice 19 foundation. Co-locates the
 * pending/accepted/rejected/cancelled lifecycle, block/unblock symmetric
 * state, and the read-side (listFriends / pending lists / relationship
 * state) in a single factory so the in-memory mock + future repository
 * adapter share one closure over repository/clock/createId. Splitting now
 * would fragment the response-shape contract before the runtime stabilizes.
 * Registered in EXCEPTIONS_REGISTER.md (EXC-010).
 */
import type { SendFriendRequestInput } from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import type {
  BlockUserInput,
  CancelFriendRequestInput,
  RespondFriendRequestInput,
  SocialRelationshipErrorCode,
  SocialRelationshipResult,
  UnblockUserInput,
} from "./dto";
import type { SocialRelationshipServiceContract } from "./contracts";
import {
  createInMemorySocialRelationshipRepository,
  type SocialRelationshipRepository,
} from "./repository";
import {
  hasAcceptedFriendship,
  isPendingBetween,
  isSelfRelation,
  resolveRelationshipState,
} from "./policy";
import {
  relationshipState,
  toBlockedUserDTO,
  toFriendDTO,
  toFriendRequestDTO,
} from "./mapper";

export {
  createSocialContactsService,
  type SocialContactsService,
  type SocialContactsServiceDeps,
  type SocialContactsError,
  type SocialContactsErrorCode,
  type SocialContactsResult,
  type SocialContactsClock,
  type SocialContactsIdGenerator,
} from "./social-contacts-service";

export type SocialRelationshipServiceDeps = {
  repository?: SocialRelationshipRepository;
  clock?: () => Date;
  createId?: () => string;
};

export type SocialRelationshipService = SocialRelationshipServiceContract;

function ok<T>(value: T): SocialRelationshipResult<T> {
  return { ok: true, value };
}

function fail<T>(
  code: SocialRelationshipErrorCode,
  message: string,
): SocialRelationshipResult<T> {
  return { ok: false, error: { code, message } };
}

function nowIso(now: () => Date): string {
  return now().toISOString();
}

async function activeBlocksBetween(
  repository: SocialRelationshipRepository,
  a: UserId,
  b: UserId,
): Promise<{ blockedByA: boolean; blockedByB: boolean }> {
  // SCALABILITY_EXCEPTION: fixed-cap two-call lookup (a→b and b→a) for symmetric block check; not user-input bounded.
  const [ab, ba] = await Promise.all([
    repository.getActiveBlock(a, b),
    repository.getActiveBlock(b, a),
  ]);
  return { blockedByA: Boolean(ab), blockedByB: Boolean(ba) };
}

async function updatePendingBetweenTo(
  repository: SocialRelationshipRepository,
  a: UserId,
  b: UserId,
  status: "cancelled" | "blocked",
  at: string,
): Promise<void> {
  const between = await repository.listFriendshipsBetween(a, b);
  const pending = between.filter((row) => row.status === "pending");
  // SCALABILITY_EXCEPTION: bounded by friendships between two specific users (FIXED_CAP, typically 0–2 pending rows).
  await Promise.all(
    pending.map((row) =>
      repository.updateFriendship(row.id, {
        status,
        respondedAt: at,
        updatedAt: at,
      }),
    ),
  );
}

export function createSocialRelationshipService(
  deps: SocialRelationshipServiceDeps = {},
): SocialRelationshipService {
  const repository =
    deps.repository ?? createInMemorySocialRelationshipRepository();
  const clock = deps.clock ?? (() => new Date());
  const createId =
    deps.createId ??
    (() => `soc_${Math.random().toString(36).slice(2, 10)}`);

  return {
    async sendFriendRequest(input: SendFriendRequestInput) {
      if (isSelfRelation(input.requesterUserId, input.recipientUserId)) {
        return fail("SELF_RELATION_NOT_ALLOWED", "Cannot send request to self.");
      }
      const blockState = await activeBlocksBetween(
        repository,
        input.requesterUserId,
        input.recipientUserId,
      );
      if (blockState.blockedByA || blockState.blockedByB) {
        return fail(
          "BLOCKED_RELATIONSHIP",
          "Cannot send request while users are blocked.",
        );
      }
      const between = await repository.listFriendshipsBetween(
        input.requesterUserId,
        input.recipientUserId,
      );
      if (hasAcceptedFriendship(between)) {
        return fail("ALREADY_FRIENDS", "Users are already friends.");
      }
      if (
        isPendingBetween(
          between,
          input.requesterUserId,
          input.recipientUserId,
        ) ||
        isPendingBetween(
          between,
          input.recipientUserId,
          input.requesterUserId,
        )
      ) {
        return fail(
          "DUPLICATE_PENDING_REQUEST",
          "Pending friend request already exists.",
        );
      }
      const timestamp = nowIso(clock);
      const created = await repository.createFriendship({
        id: createId(),
        requesterUserId: input.requesterUserId,
        recipientUserId: input.recipientUserId,
        status: "pending",
        createdAt: timestamp,
        respondedAt: null,
        updatedAt: timestamp,
      });
      return ok(toFriendRequestDTO(created));
    },

    async cancelFriendRequest(input: CancelFriendRequestInput) {
      const existing = await repository.getFriendshipById(input.requestId);
      if (!existing) return fail("REQUEST_NOT_FOUND", "Request not found.");
      if (existing.requesterUserId !== input.requesterUserId) {
        return fail("NOT_REQUESTER", "Only requester can cancel.");
      }
      if (existing.status !== "pending") {
        return fail(
          "REQUEST_NOT_PENDING",
          `Cannot cancel request in status ${existing.status}.`,
        );
      }
      const timestamp = nowIso(clock);
      const updated = await repository.updateFriendship(input.requestId, {
        status: "cancelled",
        respondedAt: timestamp,
        updatedAt: timestamp,
      });
      return ok(toFriendRequestDTO(updated));
    },

    async acceptFriendRequest(input: RespondFriendRequestInput) {
      const existing = await repository.getFriendshipById(input.requestId);
      if (!existing) return fail("REQUEST_NOT_FOUND", "Request not found.");
      if (existing.recipientUserId !== input.responderUserId) {
        return fail("NOT_RECIPIENT", "Only recipient can accept.");
      }
      if (existing.status !== "pending") {
        return fail(
          "REQUEST_NOT_PENDING",
          `Cannot accept request in status ${existing.status}.`,
        );
      }
      const timestamp = nowIso(clock);
      const updated = await repository.updateFriendship(input.requestId, {
        status: "accepted",
        respondedAt: timestamp,
        updatedAt: timestamp,
      });
      return ok(toFriendRequestDTO(updated));
    },

    async rejectFriendRequest(input: RespondFriendRequestInput) {
      const existing = await repository.getFriendshipById(input.requestId);
      if (!existing) return fail("REQUEST_NOT_FOUND", "Request not found.");
      if (existing.recipientUserId !== input.responderUserId) {
        return fail("NOT_RECIPIENT", "Only recipient can reject.");
      }
      if (existing.status !== "pending") {
        return fail(
          "REQUEST_NOT_PENDING",
          `Cannot reject request in status ${existing.status}.`,
        );
      }
      const timestamp = nowIso(clock);
      const updated = await repository.updateFriendship(input.requestId, {
        status: "rejected",
        respondedAt: timestamp,
        updatedAt: timestamp,
      });
      return ok(toFriendRequestDTO(updated));
    },

    async removeFriend(actorUserId, otherUserId) {
      const between = await repository.listFriendshipsBetween(
        actorUserId,
        otherUserId,
      );
      const accepted = between.find((row) => row.status === "accepted");
      if (!accepted) {
        return fail("REQUEST_NOT_FOUND", "Friendship not found.");
      }
      const timestamp = nowIso(clock);
      await repository.updateFriendship(accepted.id, {
        status: "removed",
        respondedAt: timestamp,
        updatedAt: timestamp,
      });
      return ok(toFriendDTO(actorUserId, accepted));
    },

    async blockUser(input: BlockUserInput) {
      if (isSelfRelation(input.blockerUserId, input.blockedUserId)) {
        return fail("SELF_RELATION_NOT_ALLOWED", "Cannot block self.");
      }
      const timestamp = nowIso(clock);
      await updatePendingBetweenTo(
        repository,
        input.blockerUserId,
        input.blockedUserId,
        "blocked",
        timestamp,
      );
      const active = await repository.getActiveBlock(
        input.blockerUserId,
        input.blockedUserId,
      );
      const row = await repository.upsertBlock({
        id: active?.id ?? createId(),
        blockerUserId: input.blockerUserId,
        blockedUserId: input.blockedUserId,
        reason: input.reason,
        createdAt: active?.createdAt ?? timestamp,
        revokedAt: null,
      });
      return ok(toBlockedUserDTO(row));
    },

    async unblockUser(input: UnblockUserInput) {
      const active = await repository.getActiveBlock(
        input.blockerUserId,
        input.blockedUserId,
      );
      if (!active) {
        return fail("REQUEST_NOT_FOUND", "Active block not found.");
      }
      const row = await repository.upsertBlock({
        ...active,
        revokedAt: nowIso(clock),
      });
      return ok(toBlockedUserDTO(row));
    },

    async getRelationshipState(viewerUserId, otherUserId) {
      const between = await repository.listFriendshipsBetween(
        viewerUserId,
        otherUserId,
      );
      const blockState = await activeBlocksBetween(
        repository,
        viewerUserId,
        otherUserId,
      );
      return relationshipState(
        viewerUserId,
        otherUserId,
        resolveRelationshipState({
          viewerUserId,
          otherUserId,
          blockedByViewer: blockState.blockedByA,
          blockedByOther: blockState.blockedByB,
          hasAcceptedFriendship: hasAcceptedFriendship(between),
          hasPendingSent: isPendingBetween(
            between,
            viewerUserId,
            otherUserId,
          ),
          hasPendingReceived: isPendingBetween(
            between,
            otherUserId,
            viewerUserId,
          ),
        }),
      );
    },

    async listFriends(ownerUserId) {
      const accepted = await repository.listFriendshipsByStatusForUser(
        ownerUserId,
        "accepted",
      );
      // SCALABILITY_EXCEPTION: bounded by ownerUserId friend count (FIXED_CAP per user); accepted is already filtered by indexed status query.
      const evaluated = await Promise.all(
        accepted.map(async (record) => {
          const otherId =
            record.requesterUserId === ownerUserId
              ? record.recipientUserId
              : record.requesterUserId;
          const blocks = await activeBlocksBetween(
            repository,
            ownerUserId,
            otherId,
          );
          return { record, blocked: blocks.blockedByA || blocks.blockedByB };
        }),
      );
      const rows = evaluated
        .filter((row) => !row.blocked)
        .map((row) => toFriendDTO(ownerUserId, row.record));
      return { ownerUserId, items: rows, nextCursor: null };
    },

    async listPendingSentRequests(ownerUserId) {
      const rows = await repository.listFriendshipsByStatusForUser(
        ownerUserId,
        "pending",
      );
      return rows
        .filter((row) => row.requesterUserId === ownerUserId)
        .map(toFriendRequestDTO);
    },

    async listPendingReceivedRequests(ownerUserId) {
      const rows = await repository.listFriendshipsByStatusForUser(
        ownerUserId,
        "pending",
      );
      return rows
        .filter((row) => row.recipientUserId === ownerUserId)
        .map(toFriendRequestDTO);
    },

    async areFriends(a, b) {
      const state = await this.getRelationshipState(a, b);
      return state.state === "friends";
    },

    async getFriendIdsForViewer(viewerUserId) {
      const list = await this.listFriends(viewerUserId);
      return list.items.map((item) => item.friendId);
    },

    async listBlockedUsers(blockerUserId) {
      const rows = await repository.listActiveBlocksByBlocker(blockerUserId);
      return rows.map(toBlockedUserDTO);
    },
  };
}
