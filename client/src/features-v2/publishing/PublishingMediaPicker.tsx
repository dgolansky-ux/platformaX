/**
 * features-v2/publishing — PublishingMediaPicker.
 *
 * Media is referenced by ID — never base64 / dataURL. When the live media
 * runtime is not wired, the picker shows a truthful "media w przygotowaniu"
 * state instead of pretending to upload.
 */
import type { PublishingMediaRefUi, PublishingTargetDefinitionUi } from "./types";
import styles from "./Publishing.module.css";

interface Props {
  target: PublishingTargetDefinitionUi;
  mediaRefs: readonly PublishingMediaRefUi[];
  onChange(next: readonly PublishingMediaRefUi[]): void;
  mediaRuntimeReady?: boolean;
}

export function PublishingMediaPicker({ target, mediaRefs, onChange, mediaRuntimeReady }: Props) {
  const disabled = !mediaRuntimeReady;
  return (
    <div className={`${styles.mediaPicker} ${disabled ? styles.mediaPickerDisabled : ""}`}>
      <span aria-hidden="true">📎</span>
      <span>
        {disabled
          ? "Media w przygotowaniu — można już publikować tekst."
          : `Dodaj media (do ${target.maxMediaCount}, typy: ${target.allowedMediaTypes.join(", ")})`}
      </span>
      {!disabled && mediaRefs.length > 0 && (
        <button
          type="button"
          onClick={() => onChange([])}
          aria-label="Usuń wszystkie media"
        >
          Usuń ({mediaRefs.length})
        </button>
      )}
    </div>
  );
}
