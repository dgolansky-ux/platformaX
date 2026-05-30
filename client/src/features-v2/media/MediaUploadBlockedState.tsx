/**
 * features-v2/media — MediaUploadBlockedState.
 *
 * Honest disabled state shown when the storage adapter is offline
 * (STORAGE_ADAPTER_ENV_REQUIRED). Surfaces the fact that bytes will NOT be
 * persisted yet, instead of pretending an upload succeeded.
 */
import styles from "./Media.module.css";

export function MediaUploadBlockedState() {
  return (
    <p className={styles.blockedState} role="status">
      <span aria-hidden="true">⚠️</span>
      Przechowywanie plików nie jest jeszcze podłączone — podgląd lokalny,
      zapis zdjęcia będzie dostępny po podłączeniu storage.
    </p>
  );
}
