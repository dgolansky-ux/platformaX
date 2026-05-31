/**
 * features-v2/content-display — loading / error / empty states.
 */
import styles from "./ContentDisplay.module.css";

export function PostSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={`${styles.skeletonRow} ${styles.skeletonHeader}`} />
      <div className={`${styles.skeletonRow} ${styles.skeletonBody}`} />
      <div className={`${styles.skeletonRow} ${styles.skeletonBodyShort}`} />
    </div>
  );
}

export function PostErrorState({ message }: { message: string }) {
  return <div className={styles.errorState} role="alert">{message}</div>;
}

export function PostEmptyState({ message }: { message: string }) {
  return <div className={styles.emptyState}>{message}</div>;
}
