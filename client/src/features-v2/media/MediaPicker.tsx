/**
 * features-v2/media — MediaPicker (generic surface picker).
 *
 * Purpose-aware multi-file picker used by every composer / editor:
 *  - reads limits from the purpose registry (max files, mime, size),
 *  - validates locally before calling the upload adapter,
 *  - uses object URLs for preview (cleaned up — never base64/dataURL),
 *  - surfaces a truthful blocked state when storage is offline.
 *
 * The picker only emits `MediaRefDTO[]` — composers / editors never see file
 * bytes. `onChange` is invoked when refs are added or removed.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  MediaOwnerRefDTO,
  MediaPurpose,
  MediaRefDTO,
} from "@shared/contracts/media";
import { getMediaPurposeDefinition } from "@shared/contracts/media-purpose-registry";
import { mediaAdapter } from "./media-adapter";
import {
  generateIdempotencyKey,
  metaFromFile,
  purposeAcceptAttr,
  validateFileCount,
  validateFileForPurpose,
} from "./mediaValidation";
import { MediaPreviewGrid } from "./MediaPreviewGrid";
import { MediaPurposeHint } from "./MediaPurposeHint";
import { MediaUploadBlockedState } from "./MediaUploadBlockedState";
import styles from "./Media.module.css";

type LocalPreview = {
  assetId: string;
  previewUrl: string;
  fileName: string;
};

interface Props {
  actorUserId: string;
  ownerRef: MediaOwnerRefDTO;
  purpose: MediaPurpose;
  value: readonly MediaRefDTO[];
  onChange(next: readonly MediaRefDTO[]): void;
  /** Optional label/title above the picker. */
  label?: string;
  /** Render compact (no header). Useful inside composers. */
  compact?: boolean;
}

export function MediaPicker({
  actorUserId,
  ownerRef,
  purpose,
  value,
  onChange,
  label,
  compact = false,
}: Props) {
  const def = useMemo(() => getMediaPurposeDefinition(purpose), [purpose]);
  const storageConnected = useMemo(() => mediaAdapter.isStorageConnected(), []);

  const [previews, setPreviews] = useState<readonly LocalPreview[]>([]);
  const [error, setError] = useState<string | null>(null);
  const previewMapRef = useRef<Map<string, string>>(new Map());

  useEffect(
    () => () => {
      for (const url of previewMapRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      previewMapRef.current.clear();
    },
    [],
  );

  function removePreview(assetId: string) {
    const url = previewMapRef.current.get(assetId);
    if (url) {
      URL.revokeObjectURL(url);
      previewMapRef.current.delete(assetId);
    }
    setPreviews((prev) => prev.filter((p) => p.assetId !== assetId));
    onChange(value.filter((ref) => ref.assetId !== assetId));
  }

  async function handleFiles(files: FileList | null) {
    setError(null);
    if (!files || files.length === 0) return;
    const incoming = Array.from(files);

    const countErr = validateFileCount(purpose, value.length, incoming.length);
    if (countErr) {
      setError(countErr.message);
      return;
    }

    const addedRefs: MediaRefDTO[] = [];
    const addedPreviews: LocalPreview[] = [];
    for (const file of incoming) {
      const meta = metaFromFile(file);
      const localErr = validateFileForPurpose(purpose, meta);
      if (localErr) {
        setError(localErr.message);
        continue;
      }
      const result = await mediaAdapter.createUploadIntent({
        actorUserId,
        ownerRef,
        purpose,
        fileMeta: meta,
        idempotencyKey: generateIdempotencyKey(),
      });
      if (!result.ok) {
        setError(result.error.message);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      previewMapRef.current.set(result.value.assetId, previewUrl);
      addedRefs.push({ assetId: result.value.assetId });
      addedPreviews.push({
        assetId: result.value.assetId,
        previewUrl,
        fileName: file.name,
      });
    }
    if (addedRefs.length === 0) return;
    setPreviews((prev) => [...prev, ...addedPreviews]);
    onChange([...value, ...addedRefs]);
  }

  const dropDisabled = value.length >= def.maxFiles;

  return (
    <div className={styles.picker} aria-label={label ?? "Media"}>
      {!compact && (
        <div className={styles.pickerHeader}>
          <span aria-hidden="true">🖼️</span>
          <span>{label ?? "Dodaj media"}</span>
        </div>
      )}

      <MediaPurposeHint definition={def} />

      <label
        className={[
          styles.dropzone,
          dropDisabled ? styles.dropzoneDisabled : "",
        ].join(" ")}
      >
        <input
          type="file"
          className={styles.input}
          multiple={def.maxFiles > 1}
          accept={purposeAcceptAttr(def)}
          disabled={dropDisabled}
          aria-label="Wybierz pliki"
          onChange={(event) => {
            void handleFiles(event.target.files);
            event.target.value = "";
          }}
        />
        <span>
          {dropDisabled
            ? `Osiągnięto limit ${def.maxFiles} plik(ów)`
            : "Przeciągnij pliki tutaj lub kliknij, aby wybrać"}
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {!storageConnected && previews.length > 0 && (
        <MediaUploadBlockedState />
      )}

      <MediaPreviewGrid items={previews} onRemove={removePreview} />
    </div>
  );
}
