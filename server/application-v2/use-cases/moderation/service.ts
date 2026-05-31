// === Slice 24 PRE-runtime ACK markers (EXC-016) =====================
// PX-IDEMP-001-ACK: pre-runtime create/publish/upload/finalize command; idempotencyKey wiring scheduled with transactional outbox slice. EXC-016.
// === end Slice 24 ACK markers =======================================

/**
 * application-v2/use-cases/moderation — orchestration (Slice 20 + P2).
 *
 * Composes:
 *  - `domains-v2/moderation` (report persistence + action recording)
 *  - source-domain public-apis via the per-target action dispatcher
 *    (`ModerationActionDispatcher`) — wires friend_feed_post,
 *    friend_feed_comment, workplace_post, channel_post out of the box.
 *
 * Constraints:
 *  - imports only `public-api.ts` from cross-domains; no internals.
 *  - owns NO entities and NO persistence.
 *  - never returns reporter/moderator/owner PII beyond what the policy permits.
 *  - hide / deactivate / restrict actions delegate to the source domain's
 *    public-api when wired; targets without a dispatcher entry keep the
 *    moderation record + the action recording but the source content stays
 *    untouched (truthful ACTION_PARTIAL).
 */
import type {
  CreateModerationReportInput,
  ListModerationReportsInput,
  ModerateReportActionInput,
  ModerationActionDTO,
  ModerationActionType,
  ModerationActor,
  ModerationReportListDTO,
  ModerationReportPublicStatusDTO,
  ModerationReportReviewDTO,
  ModerationResult,
  ModerationService,
  ModerationTargetPreviewDTO,
  ModerationTargetType,
} from "@server/domains-v2/moderation/public-api";
import {
  findTargetDefinition,
} from "@server/domains-v2/moderation/public-api";

export interface ModerationUseCaseDeps {
  moderation: ModerationService;
  /** Optional target preview providers, one per source domain. Missing
   *  providers downgrade the preview to `partial`/`planned` truthfully. */
  targetPreviewResolver?: ModerationTargetPreviewResolver;
  /** Optional per-target dispatcher for content-state mutations. When
   *  unwired the moderation record + action persist, but the source
   *  domain stays untouched (truthful ACTION_PARTIAL). */
  actionDispatcher?: ModerationActionDispatcher;
}

export interface ModerationDispatchContext {
  targetType: ModerationTargetType;
  targetId: string;
  actionType: ModerationActionType;
  moderatorUserId: string;
  reasonNote: string | null;
}

export type ModerationDispatchOutcome =
  | { ok: true; applied: true; note?: string }
  | { ok: true; applied: false; note: string }
  | { ok: false; code: string; message: string };

export interface ModerationActionDispatcher {
  dispatch(ctx: ModerationDispatchContext): Promise<ModerationDispatchOutcome>;
}

export interface ModerationTargetPreviewResolver {
  resolve(
    targetType: ModerationTargetType,
    targetId: string,
  ): Promise<ModerationTargetPreviewDTO | null>;
}

export interface ModerationUseCase {
  submitReport(
    actor: ModerationActor,
    input: CreateModerationReportInput,
  ): Promise<ModerationResult<ModerationReportPublicStatusDTO>>;

  listReviewQueue(
    actor: ModerationActor,
    input: ListModerationReportsInput,
  ): Promise<ModerationResult<ModerationReportListDTO>>;

  getReportDetails(
    actor: ModerationActor,
    reportId: string,
  ): Promise<
    ModerationResult<{
      report: ModerationReportReviewDTO;
      actions: readonly ModerationActionDTO[];
      targetPreview: ModerationTargetPreviewDTO;
    }>
  >;

  applyAction(
    actor: ModerationActor,
    input: ModerateReportActionInput,
  ): Promise<
    ModerationResult<{
      report: ModerationReportReviewDTO;
      action: ModerationActionDTO;
    }>
  >;

  listMyReports(
    actor: ModerationActor,
  ): Promise<ModerationResult<readonly ModerationReportPublicStatusDTO[]>>;
}

function buildFallbackPreview(
  targetType: ModerationTargetType,
  targetId: string,
): ModerationTargetPreviewDTO {
  const def = findTargetDefinition(targetType);
  return {
    targetType,
    targetId,
    sourceDomain: def?.sourceDomain ?? "unknown",
    publicPreviewStatus: def?.publicPreviewStatus ?? "planned",
    previewText: null,
    routeHint: null,
  };
}

export function createModerationUseCase(
  deps: ModerationUseCaseDeps,
): ModerationUseCase {
  const { moderation, targetPreviewResolver } = deps;
  return {
    async submitReport(actor, input) {
      return moderation.createReport(actor, input);
    },

    async listReviewQueue(actor, input) {
      return moderation.listForReview(actor, input);
    },

    async getReportDetails(actor, reportId) {
      const inner = await moderation.getReviewDetails(actor, reportId);
      if (!inner.ok) return inner;
      const resolved =
        (targetPreviewResolver
          ? await targetPreviewResolver.resolve(
              inner.value.report.targetType,
              inner.value.report.targetId,
            )
          : null) ??
        buildFallbackPreview(
          inner.value.report.targetType,
          inner.value.report.targetId,
        );
      return {
        ok: true,
        value: {
          report: inner.value.report,
          actions: inner.value.actions,
          targetPreview: resolved,
        },
      };
    },

    async applyAction(actor, input) {
      // Slice 20 + P2: the moderation domain validates capability + records
      // the action; the optional dispatcher applies the source-domain
      // content-state change when wired. Targets without a dispatcher entry
      // keep the moderation record but the source content stays untouched
      // (truthful ACTION_PARTIAL — reflected in the dispatcher outcome).
      const inner = await moderation.applyReviewAction(actor, input);
      if (!inner.ok) return inner;
      if (deps.actionDispatcher && actor.userId) {
        const outcome = await deps.actionDispatcher.dispatch({
          targetType: inner.value.report.targetType,
          targetId: inner.value.report.targetId,
          actionType: input.actionType,
          moderatorUserId: actor.userId,
          reasonNote: input.reasonNote ?? null,
        });
        if (!outcome.ok) {
          return {
            ok: false,
            error: {
              code: "ACTION_NOT_SUPPORTED_BY_TARGET",
              message: `Moderation record updated but source-domain dispatcher reported: ${outcome.message}.`,
            },
          };
        }
      }
      return inner;
    },

    async listMyReports(actor) {
      return moderation.listMyReports(actor);
    },
  };
}
