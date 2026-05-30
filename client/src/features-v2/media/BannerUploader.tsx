/**
 * features-v2/media — BannerUploader.
 *
 * Subtle banner editor used by profile / community / channel / workplace
 * owners. Wide 4:1 preview plus a "Zmień" subtle button.
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
  currentUrl: string | null;
  label?: string;
}

export function BannerUploader({
  actorUserId,
  ownerRef,
  purpose,
  currentUrl,
  label = "Zmień baner",
}: Props) {
  const def = getMediaPurposeDefinition(purpose);
  const upload = useMediaUpload({ actorUserId, ownerRef, purpose });
  const previewUrl = upload.state.previewUrl ?? currentUrl;
  return (
    <div className={styles.bannerEditor}>
      <div className={styles.bannerPreview} aria-label="Baner">
        {previewUrl ? <img src={previewUrl} alt="Baner" /> : null}
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
