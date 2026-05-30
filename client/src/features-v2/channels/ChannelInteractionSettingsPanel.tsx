import { useState } from "react";
import type { ChannelFeedDTO } from "@shared/contracts/channel-posts";
import type { ChannelCommentPolicyDTO } from "@shared/contracts/channel-interactions";
import { channelsMockAdapter } from "./channels-mock-adapter";
import baseStyles from "./Channels.module.css";
import styles from "./ChannelInteractions.module.css";

type Props = {
  channelSlug: string;
  feed: ChannelFeedDTO;
  onChanged: () => Promise<void>;
};

const policyLabels: Record<ChannelCommentPolicyDTO, string> = {
  followers: "obserwujący",
  community_members: "członkowie społeczności",
  leads_only: "tylko prowadzący",
};

export function ChannelInteractionSettingsPanel({ channelSlug, feed, onChanged }: Props) {
  const [commentsEnabled, setCommentsEnabled] = useState(feed.interactionSettings.commentsEnabled);
  const [reactionsEnabled, setReactionsEnabled] = useState(feed.interactionSettings.reactionsEnabled);
  const [commentPolicy, setCommentPolicy] = useState<ChannelCommentPolicyDTO>(feed.interactionSettings.commentPolicy);
  const [status, setStatus] = useState<string | null>(null);

  if (!feed.interactionSettings.viewerCanUpdate) {
    return null;
  }

  async function save() {
    setStatus(null);
    const res = await channelsMockAdapter.updateInteractionSettings({
      channelSlug,
      commentsEnabled,
      reactionsEnabled,
      commentPolicy,
    });
    if (!res.ok) {
      setStatus(res.error.message);
      return;
    }
    setStatus("Zapisano ustawienia interakcji.");
    await onChanged();
  }

  return (
    <section className={styles.settingsPanel} aria-label="Ustawienia interakcji">
      <div className={baseStyles.sectionHead}>
        <div>
          <h2 className={baseStyles.sectionTitle}>Ustawienia interakcji</h2>
          <p className={baseStyles.sectionSubtitle}>Komentarze, reakcje i moderacja pod wpisami kanału.</p>
        </div>
      </div>
      <label className={styles.toggleRow}>
        <input type="checkbox" checked={commentsEnabled} onChange={(event) => setCommentsEnabled(event.target.checked)} />
        Komentarze włączone
      </label>
      <label className={styles.toggleRow}>
        <input type="checkbox" checked={reactionsEnabled} onChange={(event) => setReactionsEnabled(event.target.checked)} />
        Reakcje włączone
      </label>
      <label className={baseStyles.fieldLabel}>
        Kto może komentować
        <select className={baseStyles.input} value={commentPolicy} onChange={(event) => setCommentPolicy(event.target.value as ChannelCommentPolicyDTO)}>
          {Object.entries(policyLabels).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </label>
      <p className={baseStyles.notice}>Komentarze może ukrywać prowadzący z uprawnieniem moderacji komentarzy.</p>
      <div className={baseStyles.formActions}>
        <button type="button" className={baseStyles.secondaryBtn} onClick={() => void save()}>
          Zapisz ustawienia
        </button>
        {status ? <span className={status.startsWith("Zapisano") ? baseStyles.formSuccess : baseStyles.formError}>{status}</span> : null}
      </div>
    </section>
  );
}
