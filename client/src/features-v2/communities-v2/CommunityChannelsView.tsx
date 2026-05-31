/**
 * features-v2/communities-v2 / CommunityChannelsView — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY.
 *
 * Lists channels for a community, lets viewers follow/unfollow, and shows a
 * create-channel form to founder/admin. Channel follow is independent of
 * community membership (separate relation by design).
 */
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import type {
  CommunityChannelSummaryDTO,
  CommunityProfileDTO,
} from "@shared/contracts/communities";
import { communitiesMockAdapter } from "./mock-adapter";
import styles from "./CommunitySubScreens.module.css";

type CommunityChannelsViewProps = {
  slug: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: CommunityProfileDTO; channels: CommunityChannelSummaryDTO[] };

export function CommunityChannelsView({ slug }: CommunityChannelsViewProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [profileRes, channelsRes] = await Promise.all([
      communitiesMockAdapter.getCommunityProfile(slug),
      communitiesMockAdapter.listChannels(slug),
    ]);
    if (!profileRes.ok) {
      setState({ status: "error", message: profileRes.error.message });
      return;
    }
    if (!channelsRes.ok) {
      setState({ status: "error", message: channelsRes.error.message });
      return;
    }
    setState({ status: "ready", profile: profileRes.value, channels: channelsRes.value });
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładowanie kanałów…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.error} role="alert">{state.message}</div>;
  }

  const { profile, channels } = state;

  async function toggleFollow(channel: CommunityChannelSummaryDTO) {
    setActionError(null);
    const op = channel.viewerFollows
      ? communitiesMockAdapter.unfollowChannel(slug, channel.id)
      : communitiesMockAdapter.followChannel(slug, channel.id);
    const res = await op;
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }
    await load();
  }

  return (
    <section className={styles.root} aria-labelledby="channels-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{profile.name}</p>
          <h1 id="channels-heading" className={styles.title}>Kanały społeczności</h1>
          <p className={styles.subtitle}>
            Kanały są niezależne od członkostwa — można subskrybować pojedynczy kanał bez bycia członkiem.
          </p>
        </div>
        <Link to={`/communities/${slug}`} className={styles.backLink}>← Wróć do społeczności</Link>
      </header>

      {actionError ? <p className={styles.error} role="alert">{actionError}</p> : null}

      {profile.canManage ? <CreateChannelForm slug={slug} onCreated={load} /> : null}

      {channels.length === 0 ? (
        <p className={styles.empty}>Brak kanałów w tej społeczności.</p>
      ) : (
        <ul className={styles.list}>
          {channels.map((channel) => (
            <li key={channel.id} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>#{channel.slug} · {channel.name}</p>
                <p className={styles.rowDesc}>{channel.description || "Bez opisu."}</p>
                <p className={styles.meta}>{channel.followerCount} obserwujących · {channel.visibility === "public" ? "Publiczny" : "Prywatny"}</p>
              </div>
              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={channel.viewerFollows ? styles.secondaryButton : styles.primaryButton}
                  onClick={() => toggleFollow(channel)}
                >
                  {channel.viewerFollows ? "Przestań obserwować" : "Obserwuj"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type CreateChannelFormProps = {
  slug: string;
  onCreated: () => Promise<void>;
};

function CreateChannelForm({ slug, onCreated }: CreateChannelFormProps) {
  const [name, setName] = useState("");
  const [channelSlug, setChannelSlug] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await communitiesMockAdapter.createChannel({
      communitySlug: slug,
      slug: channelSlug.trim().toLowerCase(),
      name: name.trim(),
      description: description.trim(),
      visibility: "public",
    });
    setSubmitting(false);
    if (!res.ok) {
      setError(res.error.message);
      return;
    }
    setName("");
    setChannelSlug("");
    setDescription("");
    await onCreated();
  }

  return (
    <form className={styles.inlineForm} onSubmit={handleSubmit} aria-label="Utwórz kanał">
      <h3 className={styles.inlineFormTitle}>Utwórz nowy kanał</h3>
      <div className={styles.inlineFormRow}>
        <label className={styles.inlineField}>
          <span className={styles.inlineLabel}>Nazwa</span>
          <input
            className={styles.inlineInput}
            value={name}
            onChange={(e) => setName(e.target.value)}
            minLength={2}
            maxLength={60}
            required
          />
        </label>
        <label className={styles.inlineField}>
          <span className={styles.inlineLabel}>Slug</span>
          <input
            className={styles.inlineInput}
            value={channelSlug}
            onChange={(e) => setChannelSlug(e.target.value)}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            maxLength={40}
            required
          />
        </label>
      </div>
      <label className={styles.inlineField}>
        <span className={styles.inlineLabel}>Opis</span>
        <input
          className={styles.inlineInput}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={140}
        />
      </label>
      {error ? <p className={styles.error} role="alert">{error}</p> : null}
      <div className={styles.inlineFormActions}>
        <button type="submit" className={styles.primaryButton} disabled={submitting}>
          {submitting ? "Tworzenie…" : "Utwórz kanał"}
        </button>
      </div>
    </form>
  );
}
