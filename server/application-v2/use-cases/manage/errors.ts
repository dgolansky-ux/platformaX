/**
 * application-v2/use-cases/manage — error types.
 *
 * Tiny, frontend-safe error code-set for the Manage Dashboard orchestrator.
 * No raw domain errors leak through — each domain failure maps to one of
 * these codes via `service.ts`.
 */
import type {
  ManageDashboardError,
  ManageSettingsUpdateResult,
} from "@shared/contracts/manage-dashboard";

export type ManageApplicationError = ManageDashboardError;

export type ManageApplicationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ManageApplicationError };

export type ManageApplicationUpdateResult = ManageSettingsUpdateResult;

export function makeManageError(
  code: ManageApplicationError["code"],
  message: string,
): ManageApplicationError {
  return { code, message };
}
