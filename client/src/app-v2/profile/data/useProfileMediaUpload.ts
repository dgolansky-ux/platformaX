import { useCallback, useEffect, useRef, useState } from "react";
import { mediaAdapter, type MediaPurpose } from "../../../features-v2/media";

/**
 * Local upload controller for the profile avatar/banner sheet (data layer).
 *
 * Performs lightweight client-side file validation (type/size) purely as a UI
 * affordance and builds a local object-URL preview (revoked on change/unmount).
 * It never inline-encodes the file and never writes to browser storage. The
 * authoritative validation + upload runs server-side in the media domain once a
 * transport is wired; until then the sheet honestly surfaces "storage not
 * connected" (`mediaAdapter.isStorageConnected() === false`).
 */
export type MediaPurposeOption = MediaPurpose;

type UploadState = {
  fileName: string | null;
  previewUrl: string | null;
  error: string | null;
  /** Set when the file is valid but storage is not connected yet. */
  envRequired: boolean;
};

const EMPTY: UploadState = {
  fileName: null,
  previewUrl: null,
  error: null,
  envRequired: false,
};

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MB = 1024 * 1024;
const MAX_BYTES: Record<MediaPurpose, number> = {
  avatar: 5 * MB,
  statusPhoto: 5 * MB,
  banner: 10 * MB,
};

function validate(file: File, purpose: MediaPurpose): string | null {
  if (!ALLOWED_MIME.has(file.type)) {
    return "Nieobsługiwany format pliku. Dozwolone: JPG, PNG, WEBP.";
  }
  if (file.size > MAX_BYTES[purpose]) {
    const mb = Math.round(MAX_BYTES[purpose] / MB);
    return `Plik jest za duży. Maksymalny rozmiar: ${mb} MB.`;
  }
  return null;
}

export function useProfileMediaUpload(purpose: MediaPurpose) {
  const [state, setState] = useState<UploadState>(EMPTY);
  const previewRef = useRef<string | null>(null);
  const storageConnected = mediaAdapter.isStorageConnected();

  const revokePreview = useCallback(() => {
    if (previewRef.current) {
      URL.revokeObjectURL(previewRef.current);
      previewRef.current = null;
    }
  }, []);

  useEffect(() => revokePreview, [revokePreview]);

  const selectFile = useCallback(
    async (file: File | null) => {
      revokePreview();
      if (!file) {
        setState(EMPTY);
        return;
      }
      const error = validate(file, purpose);
      if (error) {
        setState({ ...EMPTY, fileName: file.name, error });
        return;
      }
      const preview = URL.createObjectURL(file);
      previewRef.current = preview;
      setState({
        fileName: file.name,
        previewUrl: preview,
        error: null,
        envRequired: !storageConnected,
      });
    },
    [purpose, revokePreview, storageConnected],
  );

  const reset = useCallback(() => {
    revokePreview();
    setState(EMPTY);
  }, [revokePreview]);

  return {
    fileName: state.fileName,
    previewUrl: state.previewUrl,
    error: state.error,
    envRequired: state.envRequired,
    storageConnected,
    selectFile,
    reset,
  };
}
