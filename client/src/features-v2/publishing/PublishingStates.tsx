/**
 * features-v2/publishing — state badges (loading / success / error / blocked).
 *
 * One file because each "state" is one block — no need for separate
 * components yet.
 */
import type { PublishingResultUi } from "./types";
import styles from "./Publishing.module.css";

export function PublishingLoadingState() {
  return <p className={styles.previewMeta} role="status">Publikuję…</p>;
}

export function PublishingSuccessState({ result }: { result: PublishingResultUi }) {
  return (
    <p className={styles.successBadge + " " + styles.partialBadge}>
      Opublikowano · {result.publishedEntity?.entityType ?? "wpis"}
    </p>
  );
}

export function PublishingPartialState({ result }: { result: PublishingResultUi }) {
  const message = result.warnings[0] ?? result.errors[0]?.message ?? "Częściowy wynik publikacji.";
  return (
    <div role="status">
      <p className={styles.partialBadge}>Częściowy wynik</p>
      <p className={styles.previewMeta}>{message}</p>
    </div>
  );
}

export function PublishingBlockedState({ result }: { result: PublishingResultUi }) {
  const message = result.errors[0]?.message ?? "Publikacja zablokowana.";
  return (
    <div role="alert">
      <p className={styles.blockedBadge}>Zablokowane</p>
      <p className={styles.previewMeta}>{message}</p>
    </div>
  );
}

export function PublishingErrorState({ message }: { message: string }) {
  return (
    <div role="alert">
      <p className={styles.blockedBadge}>Błąd</p>
      <p className={styles.previewMeta}>{message}</p>
    </div>
  );
}
