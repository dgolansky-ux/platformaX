/**
 * features-v2/friend-feed / FriendFeedPage — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Composes the friend feed: header, composer, list of post cards, loading /
 * empty / error / permission states. Composer disabled state explains why.
 * No `@server/*` imports.
 */
import { useCallback, useEffect, useState } from "react";
import type {
  FriendFeedComposerStateUi,
  FriendFeedItemUi,
  FriendFeedPageUi,
  FriendFeedVisibility,
} from "./types";
import { friendFeedMockAdapter } from "./mock-adapter";
import { FriendFeedPostCard } from "./FriendFeedPostCard";
import styles from "./FriendFeed.module.css";

type Props = {
  viewerUserId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: FriendFeedPageUi; composerState: FriendFeedComposerStateUi };

const VISIBILITY_LABEL: Record<FriendFeedVisibility, string> = {
  friends_only: "Znajomi",
  private: "Tylko Ty",
  public: "Publiczny",
};

const FEED_LIMIT = 20;

function isVisibility(value: string): value is FriendFeedVisibility {
  return value === "friends_only" || value === "private" || value === "public";
}

export function FriendFeedPage({ viewerUserId }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [composerBody, setComposerBody] = useState("");
  const [composerVisibility, setComposerVisibility] = useState<FriendFeedVisibility>("friends_only");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const [pageRes, composerRes] = await Promise.all([
      friendFeedMockAdapter.listFeed(viewerUserId, null, FEED_LIMIT),
      friendFeedMockAdapter.getComposerState(viewerUserId),
    ]);
    if (!pageRes.ok) {
      setState({ status: "error", message: pageRes.error.message });
      return;
    }
    if (!composerRes.ok) {
      setState({ status: "error", message: composerRes.error.message });
      return;
    }
    setState({ status: "ready", page: pageRes.value, composerState: composerRes.value });
    setComposerVisibility(composerRes.value.defaultVisibility);
  }, [viewerUserId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładuję feed znajomych…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.errorBanner} role="alert">{state.message}</div>;
  }

  const { page, composerState } = state;
  const items: readonly FriendFeedItemUi[] = page.items;
  const composerDisabled = !composerState.canPublish || composerState.disabledReason === "transport_not_ready";
  const composerStatus =
    composerState.disabledReason === "no_friends"
      ? "Dodaj znajomych, aby Twoje wpisy ich osiągnęły."
      : composerState.disabledReason === "transport_not_ready"
        ? "Publikowanie chwilowo niedostępne."
        : "Twój wpis trafi do znajomych.";

  async function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (composerBody.trim().length === 0) {
      setComposerError("Treść nie może być pusta.");
      return;
    }
    setComposerError(null);
    setPublishing(true);
    const res = await friendFeedMockAdapter.createPost({
      viewerUserId,
      body: composerBody,
      visibility: composerVisibility,
    });
    setPublishing(false);
    if (!res.ok) {
      setComposerError(res.error.message);
      return;
    }
    setComposerBody("");
    await load();
  }

  return (
    <section className={styles.root} aria-labelledby="friend-feed-heading">
      <header className={styles.header}>
        <p className={styles.headerKicker}>Społeczność znajomych</p>
        <h1 id="friend-feed-heading" className={styles.headerTitle}>Feed znajomych</h1>
        <p className={styles.headerSubtitle}>Widzisz wpisy swoje i swoich znajomych — bez globalnego feedu, bez rankingu.</p>
      </header>

      <form className={styles.composer} onSubmit={handlePublish}>
        <div className={styles.composerHeader}>
          <span className={styles.avatar} aria-hidden="true">Ty</span>
          <span className={styles.composerStatus}>{composerStatus}</span>
        </div>
        <textarea
          className={styles.composerTextarea}
          placeholder="Co u Ciebie?"
          value={composerBody}
          onChange={(e) => setComposerBody(e.target.value)}
          aria-label="Treść wpisu"
          disabled={composerDisabled}
        />
        <div className={styles.composerRow}>
          <label className={styles.composerStatus} htmlFor="composer-visibility">Widoczność:&nbsp;</label>
          <select
            id="composer-visibility"
            className={styles.visibilitySelect}
            value={composerVisibility}
            onChange={(e) => {
              if (isVisibility(e.target.value)) setComposerVisibility(e.target.value);
            }}
            disabled={composerDisabled}
          >
            {composerState.supportedVisibilities.map((v) => (
              <option key={v} value={v}>{VISIBILITY_LABEL[v]}</option>
            ))}
          </select>
          <button
            type="submit"
            className={styles.primaryButton}
            disabled={composerDisabled || publishing || composerBody.trim().length === 0}
          >
            {publishing ? "Publikowanie…" : "Opublikuj"}
          </button>
        </div>
        {composerError ? <p className={styles.composerError} role="alert">{composerError}</p> : null}
      </form>

      {items.length === 0 ? (
        <div className={styles.emptyState} role="status">
          Twoi znajomi jeszcze nic nie opublikowali. Bądź pierwszy.
        </div>
      ) : (
        <ul className={styles.list} aria-label="Wpisy znajomych">
          {items.map((item) => (
            <FriendFeedPostCard key={item.postId} viewerUserId={viewerUserId} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}
