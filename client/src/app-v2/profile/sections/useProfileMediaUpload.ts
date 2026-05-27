import { useCallback, useEffect, useRef, useState } from "react";
import { mediaAdapter, type MediaPurpose } from "../../../features-v2/media";

/**
 * Local upload controller for the profile avatar/banner sheet.
 *
 * Runs real validation/intent through the media boundary and builds a local
 * object-URL preview (revoked on change/unmount). It never inline-encodes the
 * file and never writes to browser storage. With no storage backend wired the
 * intent comes back as env-required, which the sheet surfaces honestly.
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

export function useProfileMediaUpload(purpose: MediaPurpose, userId: string) {
  const [state, setState] = useState<UploadState>(EMPTY);
  const previewRef = useRef<string | null>(null);

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
      const meta = { mimeType: file.type, sizeBytes: file.size };
      const create =
        purpose === "avatar"
          ? mediaAdapter.createAvatarUploadIntent
          : purpose === "banner"
            ? mediaAdapter.createBannerUploadIntent
            : mediaAdapter.createStatusPhotoUploadIntent;
      const result = await create(userId, meta);
      if (!result.ok) {
        setState({ ...EMPTY, fileName: file.name, error: result.error.message });
        return;
      }
      const preview = URL.createObjectURL(file);
      previewRef.current = preview;
      setState({
        fileName: file.name,
        previewUrl: preview,
        error: null,
        envRequired: result.value.transport === "ENV_REQUIRED",
      });
    },
    [purpose, userId, revokePreview],
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
    storageConnected: mediaAdapter.isStorageConnected(),
    selectFile,
    reset,
  };
}
