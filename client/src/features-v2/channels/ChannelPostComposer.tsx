import { useState } from "react";
import { channelsMockAdapter } from "./channels-mock-adapter";
import styles from "./Channels.module.css";

type Props = {
  channelSlug: string;
  canPublish: boolean;
  onPublished: () => Promise<void>;
};

export function ChannelPostComposer({ channelSlug, canPublish, onPublished }: Props) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canPublish) return null;

  async function submit() {
    const nextBody = body.trim();
    if (!nextBody) return;
    setBusy(true);
    const res = await channelsMockAdapter.createChannelPost({ channelSlug, body: nextBody });
    setBusy(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setBody("");
    setError(null);
    await onPublished();
  }

  return (
    <section className={styles.composer} aria-label="Publikowanie wpisu kanału">
      <textarea
        className={styles.composerInput}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder="Napisz wpis na kanale..."
        rows={4}
      />
      <div className={styles.composerActions}>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={busy || body.trim().length === 0}
          onClick={() => void submit()}
        >
          {busy ? "Publikowanie..." : "Opublikuj"}
        </button>
        {error ? <span className={styles.formError}>{error}</span> : null}
      </div>
    </section>
  );
}
