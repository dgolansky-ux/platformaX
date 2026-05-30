/**
 * application-v2/use-cases/moderation — orchestration (Slice 20 foundation).
 *
 * Composes:
 *  - `domains-v2/moderation` (report persistence + action recording)
 *  - source-domain public-apis (planned, per target capability)
 *
 * Constraints:
 *  - imports only `public-api.ts` from cross-domains; no internals.
 *  - owns NO entities and NO persistence.
 *  - never returns reporter/moderator/owner PII beyond what the policy permits.
 *  - hide / deactivate / restrict actions delegate to the source domain's
 *    public-api when supported (`ACTION_PARTIAL` otherwise — the moderation
 *    record still updates, the source domain stays untouched).
 */
import type {
  CreateModerationReportInput,
  ListModerationReportsInput,
  ModerateReportActionInput,
  ModerationActionDTO,
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
      // Slice 20 wires the moderation record + action lifecycle. Source-domain
      // hide/deactivate/restore is ACTION_PARTIAL: the source-domain public-api
      // does not yet expose a moderator-actor surface for any content type
      // (existing deactivate flows are author-only). The moderation service
      // already validates `canHide` / `canDeactivate` / `canRestore` from the
      // target registry, so unsupported transitions are blocked at the
      // domain boundary.
      return moderation.applyReviewAction(actor, input);
    },

    async listMyReports(actor) {
      return moderation.listMyReports(actor);
    },
  };
}
