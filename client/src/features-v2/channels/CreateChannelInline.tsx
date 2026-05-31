/**
 * features-v2/channels / CreateChannelInline — small create-channel form used
 * from the community-channels view (Slice 3) and the channel directory's
 * "Kanały, które prowadzę" toolbar. Reuses the channels mock adapter and
 * delegates membership / authority rules to it.
 */
import { useState, type FormEvent } from "react";
import type { ChannelCardDTO, ChannelVisibility } from "@shared/contracts/channels";
import { channelsMockAdapter } from "./channels-mock-adapter";
import styles from "./Channels.module.css";

type Props = {
  communitySlug: string;
  /** Called when a new channel is created so the parent can refresh state. */
  onCreated: (channel: ChannelCardDTO) => Promise<void>;
};

export function CreateChannelInline({ communitySlug, onCreated }: Props) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ChannelVisibility>("public");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    const res = await channelsMockAdapter.createChannel({
      communitySlug,
      slug: slug.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim(),
      visibility,
    });
    setBusy(false);
    if (!res.ok) { setError(res.error.message); return; }
    setName(""); setSlug(""); setDescription("");
    setSuccess(`Utworzono kanał ${res.value.name}.`);
    await onCreated(res.value);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} aria-label="Utwórz kanał">
      <div className={styles.formRow}>
        <label className={styles.fieldLabel}>
          Nazwa
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={60}
            required
          />
        </label>
        <label className={styles.fieldLabel}>
          Slug
          <input
            className={styles.input}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            maxLength={40}
            required
          />
        </label>
      </div>
      <label className={styles.fieldLabel}>
        Opis (opcjonalny)
        <textarea
          className={`${styles.input} ${styles.textarea}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={280}
        />
      </label>
      <label className={styles.fieldLabel}>
        Widoczność
        <select
          className={styles.input}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as ChannelVisibility)}
        >
          <option value="public">Publiczny</option>
          <option value="private">Prywatny</option>
        </select>
      </label>
      {error ? <p className={styles.formError} role="alert">{error}</p> : null}
      {success ? <p className={styles.formSuccess} role="status">{success}</p> : null}
      <div className={styles.formActions}>
        <button type="submit" className={styles.primaryBtn} disabled={busy}>
          {busy ? "Tworzenie…" : "Utwórz kanał"}
        </button>
      </div>
    </form>
  );
}
