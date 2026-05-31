/**
 * features-v2/media — preview grid + item.
 *
 * Renders the local object-URL previews returned by `MediaPicker`. Removal is
 * delegated upstream so the picker can revoke the object URL and emit the
 * updated refs.
 */
import styles from "./Media.module.css";

export type MediaPreviewItem = {
  assetId: string;
  previewUrl: string;
  fileName: string;
};

interface GridProps {
  items: readonly MediaPreviewItem[];
  onRemove(assetId: string): void;
}

export function MediaPreviewGrid({ items, onRemove }: GridProps) {
  if (items.length === 0) return null;
  return (
    <div className={styles.previewGrid} role="list" aria-label="Wybrane media">
      {items.map((item) => (
        <div key={item.assetId} className={styles.previewItem} role="listitem">
          <img src={item.previewUrl} alt={item.fileName} loading="lazy" />
          <button
            type="button"
            className={styles.removeButton}
            aria-label={`Usuń ${item.fileName}`}
            onClick={() => onRemove(item.assetId)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
