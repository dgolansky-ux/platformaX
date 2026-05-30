/**
 * features-v2/professional-profile / WorkplaceMicroFeed — UI_SHELL_ONLY.
 *
 * Renders the workplace micro-feed: composer (owner only), list of posts,
 * empty state. NOT the friend feed — this is the workplace page's own feed.
 * No `@server/*` imports; goes through `professionalProfileMockAdapter`.
 */
import { useCallback, useEffect, useState } from "react";
import { professionalProfileMockAdapter } from "./mock-adapter";
import type {
  WorkplaceMicroFeedItemUi,
  WorkplaceMicroFeedPageUi,
  WorkplacePostTypeUi,
  WorkplacePostVisibilityUi,
  WorkplaceViewerStateUi,
} from "./types";
import styles from "./Workplace.module.css";

type Props = {
  viewerUserId: string;
  workplaceId: string;
  viewerState: WorkplaceViewerStateUi;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: WorkplaceMicroFeedPageUi };

const POST_TYPE_LABEL: Record<WorkplacePostTypeUi, string> = {
  update: "Aktualizacja",
  realization: "Realizacja",
  offer: "Oferta",
  photo_note: "Notatka ze zdjęciem",
  announcement: "Ogłoszenie",
};

const VISIBILITY_LABEL: Record<WorkplacePostVisibilityUi, string> = {
  workplace_public: "Publiczne dla strony pracy",
  friends_only: "Tylko znajomi",
  private: "Prywatne (tylko Ty)",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("pl-PL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function WorkplaceMicroFeed({ viewerUserId, workplaceId, viewerState }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [body, setBody] = useState("");
  const [postType, setPostType] = useState<WorkplacePostTypeUi>("update");
  const [visibility, setVisibility] = useState<WorkplacePostVisibilityUi>("workplace_public");
  const [composerError, setComposerError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

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

  async function handlePublish() {
    if (body.trim().length === 0) {
      setComposerError("Treść nie może być pusta.");
      return;
    }
    setComposerError(null);
    setPublishing(true);
    const res = await professionalProfileMockAdapter.createPost({
      viewerUserId,
      workplaceId,
      body,
      postType,
      visibility,
    });
    setPublishing(false);
    if (!res.ok) {
      setComposerError(res.error.message);
      return;
    }
    setBody("");
    await load();
  }

  return (
    <section className={styles.section} aria-labelledby="workplace-micro-feed-title">
      <h2 id="workplace-micro-feed-title" className={styles.sectionTitle}>Mikro-feed miejsca pracy</h2>

      {viewerState.viewerCanPostInMicroFeed ? (
        <form
          className={styles.composer}
          onSubmit={(e) => {
            e.preventDefault();
            void handlePublish();
          }}
        >
          <textarea
            className={styles.textarea}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Co nowego w miejscu pracy?"
            aria-label="Treść wpisu w mikro-feedzie"
            disabled={publishing}
          />
          <div className={styles.composerRow}>
            <label className={styles.contactLabel} htmlFor="wp-post-type">Typ:</label>
            <select
              id="wp-post-type"
              className={styles.composerSelect}
              value={postType}
              onChange={(e) => setPostType(e.target.value as WorkplacePostTypeUi)}
              disabled={publishing}
            >
              {(Object.keys(POST_TYPE_LABEL) as readonly WorkplacePostTypeUi[]).map((t) => (
                <option key={t} value={t}>{POST_TYPE_LABEL[t]}</option>
              ))}
            </select>
            <label className={styles.contactLabel} htmlFor="wp-post-visibility">Widoczność:</label>
            <select
              id="wp-post-visibility"
              className={styles.composerSelect}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as WorkplacePostVisibilityUi)}
              disabled={publishing}
            >
              {(Object.keys(VISIBILITY_LABEL) as readonly WorkplacePostVisibilityUi[]).map((v) => (
                <option key={v} value={v}>{VISIBILITY_LABEL[v]}</option>
              ))}
            </select>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={publishing || body.trim().length === 0}
            >
              {publishing ? "Publikuję…" : "Opublikuj"}
            </button>
          </div>
          {composerError ? <p className={styles.errorBanner} role="alert">{composerError}</p> : null}
        </form>
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
                <div className={styles.microFeedMeta}>
                  <span>{item.author.displayName}</span>
                  <span>·</span>
                  <span>{POST_TYPE_LABEL[item.post.postType]}</span>
                  <span>·</span>
                  <span>{formatDate(item.post.createdAt)}</span>
                </div>
                <p className={styles.microFeedBody}>{item.post.body}</p>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}
