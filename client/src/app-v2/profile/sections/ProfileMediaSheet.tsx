import type { MediaPurpose } from "../../../features-v2/media";
import { useProfileMediaUpload } from "./useProfileMediaUpload";
import styles from "../styles/profile-media.module.css";

type ProfileMediaSheetProps = {
  purpose: MediaPurpose;
  /** Owner of the asset. Placeholder until session wiring (step-33). */
  userId: string;
  onClose: () => void;
};

const COPY: Record<MediaPurpose, { title: string; hint: string }> = {
  avatar: {
    title: "Zmień zdjęcie profilowe",
    hint: "Wybierz zdjęcie (JPG, PNG lub WEBP, maks. 5 MB). Podgląd jest lokalny.",
  },
  banner: {
    title: "Zmień baner",
    hint: "Wybierz grafikę banera (JPG, PNG lub WEBP, maks. 10 MB). Podgląd jest lokalny.",
  },
  statusPhoto: {
    title: "Zdjęcie statusowe",
    hint: "Wybierz zdjęcie (JPG, PNG lub WEBP, maks. 5 MB). Podgląd jest lokalny.",
  },
};

/**
 * Local upload sheet for avatar/banner. The file input runs real validation via
 * the media boundary and shows a local preview; with no storage backend wired
 * the save action is an honest disabled-policy state (never a fake success).
 */
export function ProfileMediaSheet({ purpose, userId, onClose }: ProfileMediaSheetProps) {
  const upload = useProfileMediaUpload(purpose, userId);
  const copy = COPY[purpose];

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={copy.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{copy.title}</h2>
          <button type="button" className={styles.close} aria-label="Zamknij" onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.hint}>{copy.hint}</p>

        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className={styles.fileInput}
          aria-label="Wybierz plik graficzny"
          onChange={(event) => {
            void upload.selectFile(event.target.files?.[0] ?? null);
          }}
        />

        {upload.previewUrl ? (
          <img src={upload.previewUrl} alt="Podgląd wybranego pliku" className={styles.preview} />
        ) : null}

        {upload.error ? (
          <p className={styles.error} role="alert">
            {upload.error}
          </p>
        ) : null}

        {!upload.error && upload.envRequired ? (
          <p className={styles.policy} role="status">
            Plik jest poprawny. Zapis zdjęcia będzie dostępny po podłączeniu
            przechowywania plików.
          </p>
        ) : null}

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Anuluj
          </button>
          <button
            type="button"
            className={styles.primary}
            disabled
            title="Zapis dostępny po podłączeniu przechowywania plików (wkrótce)"
          >
            Zapisz — wkrótce
          </button>
        </div>
      </div>
    </div>
  );
}
