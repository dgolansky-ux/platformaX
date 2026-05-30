/**
 * QUALITY_STRUCTURE_EXCEPTION: Slice 12 grew this page by one section
 * (workplace mini-teasers list) to surface "Aktualizacje zawodowe znajomych"
 * inline; splitting per-section would dilute the page header context. The
 * page stays a thin orchestrator over the friend-feed mock adapter.
 *
 * features-v2/friend-feed / FriendFeedPage — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Composes the friend feed: header, composer, optional workplace mini-teaser
 * list, list of post cards, loading / empty / error / permission states.
 * Composer disabled state explains why. No `@server/*` imports.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  FriendFeedComposerStateUi,
  FriendFeedItemUi,
  FriendFeedPageUi,
} from "./types";
import { friendFeedMockAdapter } from "./mock-adapter";
import { FriendFeedPostCard } from "./FriendFeedPostCard";
import { FriendFeedWorkplaceTeaserCard } from "./FriendFeedWorkplaceTeaserCard";
import type { FriendFeedWorkplaceTeaserPageUi } from "./types";
import { FriendFeedComposer } from "../publishing";
import { createFriendFeedPublishingAdapter } from "./publishing-adapter";
import styles from "./FriendFeed.module.css";

type Props = {
  viewerUserId: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: FriendFeedPageUi; composerState: FriendFeedComposerStateUi; teasers: FriendFeedWorkplaceTeaserPageUi };

const FEED_LIMIT = 20;

const DEFAULT_COMPOSER_STATE: FriendFeedComposerStateUi = {
  canPublish: true,
  disabledReason: "none",
  defaultVisibility: "friends_only",
  supportedVisibilities: ["friends_only", "private", "public"],
};

export function FriendFeedPage({ viewerUserId }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const publishingAdapter = useMemo(() => createFriendFeedPublishingAdapter(), []);
  const composerState = state.status === "ready" ? state.composerState : DEFAULT_COMPOSER_STATE;
  const friendFeedTarget = useMemo(() => ({
    targetType: "friend_feed" as const,
    targetId: "friend-feed",
    label: "Twój feed znajomych",
    description: composerState.disabledReason === "no_friends"
      ? "Dodaj znajomych, aby Twoje wpisy ich osiągnęły."
      : "Publikacja widoczna zgodnie z wybraną widocznością.",
    allowedContentTypes: ["text_post" as const, "media_post" as const],
    allowedMediaTypes: ["image" as const, "video" as const, "document" as const, "link" as const],
    visibilityOptions: composerState.supportedVisibilities,
    defaultVisibility: composerState.defaultVisibility,
    maxBodyLength: 4000,
    maxMediaCount: 4,
    permissionsRequired: [],
    status: composerState.canPublish && composerState.disabledReason !== "transport_not_ready" ? "available" as const : "disabled" as const,
    routeTarget: "/friends-feed",
  }), [composerState]);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const [pageRes, composerRes, teaserRes] = await Promise.all([
      friendFeedMockAdapter.listFeed(viewerUserId, null, FEED_LIMIT),
      friendFeedMockAdapter.getComposerState(viewerUserId),
      friendFeedMockAdapter.listWorkplaceTeasersForViewer(viewerUserId),
    ]);
    if (!pageRes.ok) {
      setState({ status: "error", message: pageRes.error.message });
      return;
    }
    if (!composerRes.ok) {
      setState({ status: "error", message: composerRes.error.message });
      return;
    }
    const teasers: FriendFeedWorkplaceTeaserPageUi = teaserRes.ok
      ? teaserRes.value
      : { items: [], nextCursor: null };
    setState({ status: "ready", page: pageRes.value, composerState: composerRes.value, teasers });
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

  const { page } = state;
  const items: readonly FriendFeedItemUi[] = page.items;

  return (
    <section className={styles.root} aria-labelledby="friend-feed-heading">
      <header className={styles.header}>
        <p className={styles.headerKicker}>Społeczność znajomych</p>
        <h1 id="friend-feed-heading" className={styles.headerTitle}>Feed znajomych</h1>
        <p className={styles.headerSubtitle}>Widzisz wpisy swoje i swoich znajomych — bez globalnego feedu, bez rankingu.</p>
      </header>

      <FriendFeedComposer
        viewerUserId={viewerUserId}
        adapter={publishingAdapter}
        availableTargets={[friendFeedTarget]}
        friendFeedTarget={friendFeedTarget}
        onPublished={() => void load()}
      />
      {state.composerState.disabledReason === "no_friends" ? (
        <p className={styles.composerStatus}>Dodaj znajomych, aby Twoje wpisy ich osiągnęły.</p>
      ) : null}

      {state.teasers.items.length > 0 ? (
        <ul className={styles.list} aria-label="Aktualizacje zawodowe znajomych">
          {state.teasers.items.map((item) => (
            <FriendFeedWorkplaceTeaserCard
              key={item.teaser.id}
              item={item}
              onOpen={(route) => {
                window.location.assign(route);
              }}
            />
          ))}
        </ul>
      ) : null}

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
