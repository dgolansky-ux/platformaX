/**
 * features-v2/publishing — PublishingPreview.
 *
 * Read-only preview built from the server-shaped PublishingPreviewUi. No
 * permission checks here — the registry/dispatcher already did them.
 */
import type { PublishingPreviewUi } from "./types";
import styles from "./Publishing.module.css";

interface Props {
  preview: PublishingPreviewUi | null;
}

export function PublishingPreview({ preview }: Props) {
  if (!preview) {
    return (
      <section className={styles.preview} aria-label="Podgląd publikacji">
        <p className={styles.previewLabel}>Podgląd</p>
        <p className={styles.previewMeta}>Wpisz treść, aby zobaczyć podgląd.</p>
      </section>
    );
  }
  return (
    <section className={styles.preview} aria-label="Podgląd publikacji">
      <p className={styles.previewLabel}>Podgląd — {preview.targetLabel}</p>
      {preview.contentPreview.length > 0 ? (
        <p className={styles.previewBody}>{preview.contentPreview}</p>
      ) : (
        <p className={styles.previewMeta}>Brak treści do podglądu.</p>
      )}
      <p className={styles.previewMeta}>
        Widoczność: <strong>{preview.visibilityLabel}</strong>
        {preview.expectedDestinations.length > 0 && (
          <> · Trafi do: {preview.expectedDestinations.join(", ")}</>
        )}
      </p>
      {preview.warnings.length > 0 && (
        <ul className={styles.warningList}>
          {preview.warnings.map((w) => <li key={w}>{w}</li>)}
        </ul>
      )}
      {preview.disabledReason && (
        <p className={styles.partialBadge}>{disabledReasonLabel(preview.disabledReason)}</p>
      )}
    </section>
  );
}

function disabledReasonLabel(r: NonNullable<PublishingPreviewUi["disabledReason"]>): string {
  switch (r) {
    case "permission_denied": return "Brak uprawnień";
    case "feed_disabled_for_community": return "Feed wyłączony";
    case "quota_exceeded_relational": return "Wyczerpany miesięczny limit";
    case "channel_not_a_lead": return "Tylko prowadzący kanał";
    case "workplace_not_owner": return "Tylko właściciel miejsca pracy";
    case "profile_not_owner": return "Tylko właściciel profilu";
    case "backend_not_ready_v2": return "Backend w przygotowaniu";
    case "media_runtime_partial": return "Media w przygotowaniu";
  }
}
