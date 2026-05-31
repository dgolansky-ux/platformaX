// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-OBS-003-ACK: pre-runtime use-case; request-context tracing wiring scheduled with RequestContext slice. EXC-016.
// PX-OWN-001-ACK: pre-runtime mutation; ownership currently delegated to policy/closure; explicit owner check to be added with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/manage — Slice 21 orchestrator.
 *
 * Thin composition layer that produces a single, owner-only Manage Dashboard
 * view by reading public-api surfaces of the underlying domains. The
 * orchestrator owns NO entities and never mutates domain state directly.
 *
 * Constraints (enforced by tests + arch guards):
 *  - Owner-only: every call must carry `currentUserId === targetUserId`,
 *    otherwise OWNER_MISMATCH is returned.
 *  - No raw domain DTOs leak to the UI — only the section view shapes in
 *    `@shared/contracts/manage-dashboard`.
 *  - No PII outside the owner's own contact section.
 *  - No internals imports (only `public-api.ts` of each domain).
 *  - Returns `partial` / `needs_setup` truthfully when a section's backend
 *    is not wired yet — never `ready` if it isn't.
 *
 * Deps are injected so tests can supply tiny stubs.
 */
import type {
  ManageDashboardDTO,
  ManageDashboardHeader,
  ManageSection,
} from "@shared/contracts/manage-dashboard";
import {
  makeManageError,
  type ManageApplicationError,
  type ManageApplicationResult,
} from "./errors";
import type { ManageDashboardPort } from "./snapshots";
import {
  buildAccount,
  buildChannels,
  buildCommunities,
  buildContact,
  buildFriends,
  buildMedia,
  buildModules,
  buildNotifications,
  buildPrivacy,
  buildProfessional,
  buildProfile,
  buildSecurity,
  buildWorkplaces,
  collectStatuses,
} from "./section-builders";

export type {
  ManageChannelsSnapshot,
  ManageCommunitiesSnapshot,
  ManageContactSnapshot,
  ManageDashboardPort,
  ManageFriendsSnapshot,
  ManageMediaSnapshot,
  ManageModulesSnapshot,
  ManageNotificationsSnapshot,
  ManageOwnerSummary,
  ManagePrivacySnapshot,
  ManageProfessionalSnapshot,
  ManageSecuritySnapshot,
  ManageWorkplacesSnapshot,
} from "./snapshots";

export interface ManageApplicationServiceDeps {
  readonly port: ManageDashboardPort;
  readonly clock?: () => Date;
  readonly runtimeBackend?: "mock" | "supabase";
}

export interface ManageApplicationService {
  getManageDashboardView(
    currentUserId: string,
    targetUserId: string,
  ): Promise<ManageApplicationResult<ManageDashboardDTO>>;
}

function unauth(): ManageApplicationError {
  return makeManageError("UNAUTHENTICATED", "Wymagane zalogowanie.");
}

function ownerMismatch(): ManageApplicationError {
  return makeManageError(
    "OWNER_MISMATCH",
    "Brak uprawnień — panel zarządzania jest tylko dla właściciela profilu.",
  );
}

export function createManageApplicationService(
  deps: ManageApplicationServiceDeps,
): ManageApplicationService {
  const clock = deps.clock ?? (() => new Date());
  const runtimeBackend = deps.runtimeBackend ?? "mock";
  return {
    async getManageDashboardView(currentUserId, targetUserId) {
      if (!currentUserId) return { ok: false, error: unauth() };
      if (currentUserId !== targetUserId) return { ok: false, error: ownerMismatch() };

      const owner = await deps.port.loadOwnerSummary(currentUserId);
      if (!owner) {
        return {
          ok: false,
          error: makeManageError("INTERNAL", "Nie udało się załadować profilu właściciela."),
        };
      }

      const [privacy, contact, friends, notifications, media, professional, workplaces, modules, channels, communities, security] = await Promise.all([
        deps.port.loadPrivacySnapshot(currentUserId),
        deps.port.loadContactSnapshot(currentUserId),
        deps.port.loadFriendsSnapshot(currentUserId),
        deps.port.loadNotificationsSnapshot(currentUserId),
        deps.port.loadMediaSnapshot(currentUserId),
        deps.port.loadProfessionalSnapshot(currentUserId),
        deps.port.loadWorkplacesSnapshot(currentUserId),
        deps.port.loadModulesSnapshot(currentUserId),
        deps.port.loadChannelsSnapshot(currentUserId),
        deps.port.loadCommunitiesSnapshot(currentUserId),
        deps.port.loadSecuritySnapshot(currentUserId),
      ]);

      const sections: readonly ManageSection[] = [
        buildAccount(owner),
        buildProfile(owner),
        buildPrivacy(privacy),
        buildContact(contact),
        buildFriends(friends),
        buildNotifications(notifications),
        buildMedia(media),
        buildProfessional(professional),
        buildWorkplaces(workplaces),
        buildModules(modules),
        buildChannels(channels),
        buildCommunities(communities),
        buildSecurity(security),
      ];

      const header: ManageDashboardHeader = {
        ownerUserId: owner.userId,
        ownerDisplayName: owner.displayName,
        ownerHandle: owner.handle,
        ownerAvatarInitial: owner.avatarInitial,
        generatedAt: clock().toISOString(),
        runtimeBackend,
      };

      return {
        ok: true,
        value: {
          header,
          sections,
          sectionStatuses: collectStatuses(sections),
        },
      };
    },
  };
}
