/**
 * features-v2/media — AvatarUploader.
 *
 * Subtle avatar editor used by profile / community / channel / workplace
 * owners. Renders a circular preview plus a "Zmień" subtle button. Reads
 * limits from the purpose registry and uses `useMediaUpload`. Only the owner
 * (per the owner-only gating that the caller enforces) sees it.
 */
import type {
  MediaOwnerRefDTO,
  MediaPurpose,
} from "@shared/contracts/media";
import { useMediaUpload } from "./useMediaUpload";
import { MediaUploadBlockedState } from "./MediaUploadBlockedState";
import { MediaPurposeHint } from "./MediaPurposeHint";
import { getMediaPurposeDefinition } from "@shared/contracts/media-purpose-registry";
import styles from "./Media.module.css";

interface Props {
  actorUserId: string;
  ownerRef: MediaOwnerRefDTO;
  purpose: MediaPurpose;
  /** Currently saved avatar URL, if any (from backend). */
  currentUrl: string | null;
  fallback?: string;
  label?: string;
}

export function AvatarUploader({
  actorUserId,
  ownerRef,
  purpose,
  currentUrl,
  fallback = "🙂",
  label = "Zmień avatar",
}: Props) {
  const def = getMediaPurposeDefinition(purpose);
  const upload = useMediaUpload({ actorUserId, ownerRef, purpose });
  const previewUrl = upload.state.previewUrl ?? currentUrl;
  return (
    <div className={styles.avatarEditor}>
      <div className={styles.avatarPreview} aria-label="Avatar">
        {previewUrl ? (
          <img src={previewUrl} alt="Avatar" />
        ) : (
          <span aria-hidden="true">{fallback}</span>
        )}
      </div>
      <label className={styles.subtleButton}>
        <input
          type="file"
          accept={def.allowedMimeTypes.join(",")}
          style={{ display: "none" }}
          aria-label={label}
          onChange={(event) => void upload.selectFile(event.target.files?.[0] ?? null)}
        />
        {label}
      </label>
      <MediaPurposeHint definition={def} />
      {upload.state.error && (
        <p className={styles.error} role="alert">
          {upload.state.error}
        </p>
      )}
      {!upload.storageConnected && upload.state.intent && (
        <MediaUploadBlockedState />
      )}
    </div>
  );
}
