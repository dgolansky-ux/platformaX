import { useEffect, useState } from "react";
import {
  PROFILE_BIO_MAX_LENGTH,
  useProfileBioEdit,
} from "../data/useProfileBioEdit";
import styles from "../styles/profile-media.module.css";

type ProfileBioSheetProps = {
  userId: string;
  currentBio: string | null;
  onClose: () => void;
  onSaved: (bio: string | null) => void;
};

/**
 * Container: owner-only sheet for editing the personal bio. Owns the bio-edit
 * data hook (wired through the profile adapter's `updateMyProfile`) and renders
 * the form. The shell stays UI-only and never reaches a service directly.
 */
export function ProfileBioSheet({
  userId,
  currentBio,
  onClose,
  onSaved,
}: ProfileBioSheetProps) {
  const [draft, setDraft] = useState<string>(currentBio ?? "");
  const edit = useProfileBioEdit();

  useEffect(() => {
    setDraft(currentBio ?? "");
  }, [currentBio]);

  async function handleSave() {
    const ok = await edit.saveBio(userId, draft);
    if (ok) {
      const next = draft.trim();
      onSaved(next.length === 0 ? null : next);
      onClose();
    }
  }

  const remaining = PROFILE_BIO_MAX_LENGTH - draft.length;
  const overLimit = remaining < 0;

  return (
    <div className={styles.backdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label="Edytuj bio"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Edytuj bio</h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Zamknij"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <p className={styles.hint}>
          Krótki opis publiczny (do {PROFILE_BIO_MAX_LENGTH} znaków). Nie podawaj
          numeru telefonu, daty urodzenia ani adresu e-mail — to dane prywatne.
        </p>

        <label htmlFor="profile-bio-edit" className={styles.hint}>
          O mnie
        </label>
        <textarea
          id="profile-bio-edit"
          className={styles.fileInput}
          value={draft}
          maxLength={PROFILE_BIO_MAX_LENGTH * 2}
          rows={5}
          onChange={(event) => setDraft(event.target.value)}
          aria-describedby="profile-bio-edit-remaining"
        />
        <p
          id="profile-bio-edit-remaining"
          className={styles.hint}
          aria-live="polite"
        >
          Pozostało {remaining} znaków.
        </p>

        {edit.state.error ? (
          <p className={styles.error} role="alert">
            {edit.state.error}
          </p>
        ) : null}

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            onClick={onClose}
            disabled={edit.state.saving}
          >
            Anuluj
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={handleSave}
            disabled={edit.state.saving || overLimit}
          >
            {edit.state.saving ? "Zapisywanie…" : "Zapisz"}
          </button>
        </div>
      </div>
    </div>
  );
}
