/**
 * features-v2/communities-v2 / feeds / interactions / CommunityCommentComposer
 *
 * Small inline composer under the comments list. Disabled when the viewer has
 * no permission (e.g. stranger on community_all); copy explains why.
 */
import { useState } from "react";
import styles from "./Interactions.module.css";

type Props = {
  canComment: boolean;
  disabledReason?: string;
  onSubmit: (body: string) => Promise<{ ok: true } | { ok: false; message: string }>;
  busy?: boolean;
};

export function CommunityCommentComposer({ canComment, disabledReason, onSubmit, busy }: Props) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!canComment) {
    return (
      <div className={styles.permissionState} role="status">
        {disabledReason ?? "Tylko członkowie społeczności mogą komentować."}
      </div>
    );
  }

  const handleSubmit = async () => {
    setError(null);
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setError("Treść komentarza nie może być pusta.");
      return;
    }
    const res = await onSubmit(trimmed);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setValue("");
  };

  return (
    <div>
      <div className={styles.composer}>
        <textarea
          className={styles.composerTextarea}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Skomentuj…"
          aria-label="Treść komentarza"
          maxLength={2000}
          disabled={busy}
        />
        <button
          type="button"
          className={styles.composerSend}
          onClick={() => void handleSubmit()}
          disabled={busy || value.trim().length === 0}
        >
          Opublikuj
        </button>
      </div>
      {error ? <p className={styles.composerError} role="alert">{error}</p> : null}
    </div>
  );
}
