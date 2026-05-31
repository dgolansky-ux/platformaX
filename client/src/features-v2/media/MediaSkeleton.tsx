/**
 * features-v2/media — MediaSkeleton.
 *
 * Loading shimmer for media slots before the asset DTO is resolved.
 */
import styles from "./Media.module.css";

export function MediaSkeleton({ ariaLabel = "Ładowanie podglądu" }: { ariaLabel?: string }) {
  return <div className={styles.skeleton} role="status" aria-label={ariaLabel} />;
}
