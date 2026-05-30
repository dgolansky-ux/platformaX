/**
 * features-v2/professional-profile / WorkplaceMicroFeed — UI_SHELL_ONLY.
 *
 * Renders the workplace micro-feed: composer (owner only), list of posts,
 * empty state. NOT the friend feed — this is the workplace page's own feed.
 * No `@server/*` imports; goes through `professionalProfileMockAdapter`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { professionalProfileMockAdapter } from "./mock-adapter";
import type {
  WorkplaceMicroFeedItemUi,
  WorkplaceMicroFeedPageUi,
  WorkplacePublicUi,
  WorkplaceViewerStateUi,
} from "./types";
import { WorkplaceComposer } from "../publishing";
import { WorkplacePostCard } from "../content-display";
import { createWorkplacePublishingAdapter, workplacePublishingTarget } from "./publishing-adapter";
import { workplacePostToDisplay } from "./post-display-mappers";
import styles from "./Workplace.module.css";

type Props = {
  viewerUserId: string;
  workplaceId: string;
  workplace: WorkplacePublicUi;
  viewerState: WorkplaceViewerStateUi;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: WorkplaceMicroFeedPageUi };

export function WorkplaceMicroFeed({ viewerUserId, workplaceId, workplace, viewerState }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const target = useMemo(
    () => workplacePublishingTarget(workplaceId, workplace.name, viewerState.viewerCanPostInMicroFeed),
    [workplaceId, workplace.name, viewerState.viewerCanPostInMicroFeed],
  );
  const publishingAdapter = useMemo(() => createWorkplacePublishingAdapter(viewerUserId, target), [viewerUserId, target]);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await professionalProfileMockAdapter.listMicroFeed(viewerUserId, workplaceId);
    if (!res.ok) {
      setState({ status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", page: res.value });
  }, [viewerUserId, workplaceId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className={styles.section} aria-labelledby="workplace-micro-feed-title">
      <h2 id="workplace-micro-feed-title" className={styles.sectionTitle}>Mikro-feed miejsca pracy</h2>

      {viewerState.viewerCanPostInMicroFeed ? (
        <WorkplaceComposer
          viewerUserId={viewerUserId}
          adapter={publishingAdapter}
          availableTargets={[target]}
          workplaceTarget={target}
          onPublished={() => void load()}
        />
      ) : null}

      {state.status === "loading" ? (
        <p className={styles.loading} aria-busy="true">Ładuję mikro-feed…</p>
      ) : null}
      {state.status === "error" ? (
        <p className={styles.errorBanner} role="alert">{state.message}</p>
      ) : null}
      {state.status === "ready" ? (
        state.page.items.length === 0 ? (
          <p className={styles.empty}>
            Brak wpisów w mikro-feedzie.{" "}
            {viewerState.viewerCanPostInMicroFeed ? "Opublikuj pierwszy wpis powyżej." : null}
          </p>
        ) : (
          <ul className={styles.microFeedList}>
            {state.page.items.map((item: WorkplaceMicroFeedItemUi) => (
              <li key={item.post.id} className={styles.microFeedItem}>
                <WorkplacePostCard vm={workplacePostToDisplay(item, workplace)} />
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
