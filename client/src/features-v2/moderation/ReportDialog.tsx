/**
 * features-v2/moderation — ReportDialog.
 *
 * QUALITY_STRUCTURE_EXCEPTION — Slice 20 co-locates the reason picker, the
 * description field validation, the submit state, and the success/error
 * banners in a single dialog component so the dialog open/close + submit
 * lifecycle lives in one closure (instead of being threaded through props
 * across split sub-components). Registered in EXCEPTIONS_REGISTER.md
 * (EXC-012).
 *
 * Subtle modal with reason picker + optional/required description + submit.
 * UI shell uses the in-memory mock adapter; the wiring is identical to a real
 * transport — the dialog never imports `@server/*`.
 */
import { useState } from "react";
import {
  UI_MODERATION_REPORT_REASONS,
  type UiModerationAdapter,
  type UiModerationReportReason,
  type UiModerationTargetType,
  type UiModerationViewer,
  type UiReportSubmitResult,
} from "./types";
import styles from "./Moderation.module.css";

interface ReportDialogProps {
  open: boolean;
  viewer: UiModerationViewer;
  targetType: UiModerationTargetType;
  targetId: string;
  targetOwnerUserId: string | null;
  adapter: UiModerationAdapter;
  onClose(): void;
  onSubmitted?(result: UiReportSubmitResult): void;
}

export function ReportDialog({
  open,
  viewer,
  targetType,
  targetId,
  targetOwnerUserId,
  adapter,
  onClose,
  onSubmitted,
}: ReportDialogProps) {
  const [reason, setReason] = useState<UiModerationReportReason | null>(null);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<UiReportSubmitResult | null>(null);

  if (!open) return null;

  const selectedDef = reason
    ? UI_MODERATION_REPORT_REASONS.find((r) => r.key === reason) ?? null
    : null;

  const requiresDescription = selectedDef?.requiresDescription ?? false;
  const descTrimmed = description.trim();
  const descMissing = requiresDescription && descTrimmed.length < 4;
  const canSubmit = !!reason && !descMissing && !submitting;

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    setResult(null);
    try {
      const submitResult = await adapter.submitReport(viewer, {
        targetType,
        targetId,
        targetOwnerUserId,
        reason,
        description: descTrimmed.length > 0 ? descTrimmed : null,
      });
      setResult(submitResult);
      onSubmitted?.(submitResult);
    } finally {
      setSubmitting(false);
    }
  }

  function resetAndClose() {
    setReason(null);
    setDescription("");
    setResult(null);
    onClose();
  }

  return (
    <div
      className={styles.dialogBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-dialog-title"
    >
      <div className={styles.dialog}>
        <div className={styles.dialogHeader}>
          <h2 id="report-dialog-title" className={styles.dialogTitle}>
            Zgłoś
          </h2>
          <button
            type="button"
            className={styles.dialogClose}
            aria-label="Zamknij"
            onClick={resetAndClose}
          >
            ×
          </button>
        </div>

        {result?.ok ? (
          <div className={`${styles.statusBanner} ${styles.statusSuccess}`}>
            Dziękujemy. Zgłoszenie zostało zapisane.
          </div>
        ) : null}

        {result && !result.ok ? (
          <div className={`${styles.statusBanner} ${styles.statusError}`}>
            {result.error.message}
          </div>
        ) : null}

        {!result?.ok ? (
          <>
            <div className={styles.field}>
              <span className={styles.fieldLabel}>Wybierz powód:</span>
              <div className={styles.reasonList} role="radiogroup" aria-label="Powód zgłoszenia">
                {UI_MODERATION_REPORT_REASONS.map((def) => (
                  <label key={def.key} className={styles.reasonItem}>
                    <input
                      className={styles.reasonRadio}
                      type="radio"
                      name="report-reason"
                      value={def.key}
                      checked={reason === def.key}
                      onChange={() => setReason(def.key)}
                    />
                    <span className={styles.reasonText}>
                      <span className={styles.reasonLabel}>{def.label}</span>
                      <span className={styles.reasonDescription}>{def.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {reason ? (
              <div className={styles.field}>
                <label className={styles.fieldLabel} htmlFor="report-description">
                  Opis {requiresDescription ? "(wymagany)" : "(opcjonalny)"}
                </label>
                <textarea
                  id="report-description"
                  className={styles.textarea}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  maxLength={1000}
                  placeholder="Krótko opisz, co jest nie tak."
                />
                {descMissing ? (
                  <span className={styles.requiredHint}>
                    Opis jest wymagany dla wybranego powodu.
                  </span>
                ) : null}
              </div>
            ) : null}

            <div className={styles.submitRow}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={resetAndClose}
                disabled={submitting}
              >
                Anuluj
              </button>
              <button
                type="button"
                className={styles.submitBtn}
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {submitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.submitRow}>
            <button type="button" className={styles.submitBtn} onClick={resetAndClose}>
              Zamknij
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
