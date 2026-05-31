/**
 * features-v2/media — useMediaUpload hook.
 *
 * Generic upload controller used by every surface (avatar/banner/post media/
 * gallery). Tracks a single in-flight upload with:
 *  - object-URL preview (cleaned up on change/unmount — never base64),
 *  - inline validation against the purpose registry,
 *  - upload intent creation through the adapter,
 *  - honest `STORAGE_UNAVAILABLE` surfacing while no real storage is wired.
 *
 * It never writes to `localStorage`/`sessionStorage` and never inline-encodes
 * file bytes.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { mediaAdapter } from "./media-adapter";
import {
  generateIdempotencyKey,
  metaFromFile,
  validateFileForPurpose,
} from "./mediaValidation";
import type {
  MediaOwnerRefDTO,
  MediaPurpose,
  UploadIntentDTO,
} from "@shared/contracts/media";

export type MediaUploadPhase =
  | "idle"
  | "validating"
  | "intent_pending"
  | "intent_ready"
  | "blocked_storage";

export type MediaUploadState = {
  phase: MediaUploadPhase;
  fileName: string | null;
  previewUrl: string | null;
  intent: UploadIntentDTO | null;
  error: string | null;
  envRequired: boolean;
};

const EMPTY: MediaUploadState = {
  phase: "idle",
  fileName: null,
  previewUrl: null,
  intent: null,
  error: null,
  envRequired: false,
};

export type UseMediaUploadConfig = {
  actorUserId: string;
  purpose: MediaPurpose;
  ownerRef: MediaOwnerRefDTO;
};

export function useMediaUpload(cfg: UseMediaUploadConfig) {
  const [state, setState] = useState<MediaUploadState>(EMPTY);
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
      setState((s) => ({ ...s, phase: "validating", fileName: file.name, error: null }));
      const meta = metaFromFile(file);
      const localErr = validateFileForPurpose(cfg.purpose, meta);
      if (localErr) {
        setState({ ...EMPTY, fileName: file.name, error: localErr.message });
        return;
      }
      setState((s) => ({ ...s, phase: "intent_pending" }));

      const result = await mediaAdapter.createUploadIntent({
        actorUserId: cfg.actorUserId,
        ownerRef: cfg.ownerRef,
        purpose: cfg.purpose,
        fileMeta: meta,
        idempotencyKey: generateIdempotencyKey(),
      });
      if (!result.ok) {
        setState({ ...EMPTY, fileName: file.name, error: result.error.message });
        return;
      }
      const preview = URL.createObjectURL(file);
      previewRef.current = preview;
      const envRequired = result.value.transport === "ENV_REQUIRED";
      setState({
        phase: envRequired ? "blocked_storage" : "intent_ready",
        fileName: file.name,
        previewUrl: preview,
        intent: result.value,
        error: null,
        envRequired,
      });
    },
    [cfg.actorUserId, cfg.purpose, cfg.ownerRef, revokePreview],
  );

  const reset = useCallback(() => {
    revokePreview();
    setState(EMPTY);
  }, [revokePreview]);

  const storageConnected = useMemo(() => mediaAdapter.isStorageConnected(), []);

  return {
    state,
    storageConnected,
    selectFile,
    reset,
  };
}
