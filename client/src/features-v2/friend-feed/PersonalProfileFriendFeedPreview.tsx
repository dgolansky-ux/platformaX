/**
 * features-v2/friend-feed / PersonalProfileFriendFeedPreview — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY.
 *
 * Compact friend-feed preview surfaced on the personal profile page. Renders
 * 3–5 most recent entries, owner/friend/stranger states, and a CTA to the
 * full feed. Mock adapter, no `@server/*` imports.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PersonalProfileFriendFeedPreviewUi } from "./types";
import { friendFeedMockAdapter } from "./mock-adapter";
import styles from "./FriendFeed.module.css";
import previewStyles from "./PersonalProfileFriendFeedPreview.module.css";

type Props = {
  viewerUserId: string;
  profileOwnerId: string;
  limit?: number;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; view: PersonalProfileFriendFeedPreviewUi };

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pl-PL", { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

const RELATION_KICKER: Record<PersonalProfileFriendFeedPreviewUi["viewerRelation"], string> = {
  owner: "Twoje ostatnie wpisy",
  friend: "Ostatnie wpisy znajomego",
  stranger: "Wpisy",
};

export function PersonalProfileFriendFeedPreview({ viewerUserId, profileOwnerId, limit = 4 }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    void (async () => {
      const res = await friendFeedMockAdapter.getProfilePreview(viewerUserId, profileOwnerId, limit);
      if (!alive) return;
      if (!res.ok) setState({ status: "error", message: res.error.message });
      else setState({ status: "ready", view: res.value });
    })();
    return () => {
      alive = false;
    };
  }, [viewerUserId, profileOwnerId, limit]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładuję wpisy…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.errorBanner} role="alert">{state.message}</div>;
  }

  const { view } = state;
  const kicker = RELATION_KICKER[view.viewerRelation];

  return (
    <section className={previewStyles.previewRoot} aria-labelledby="profile-preview-heading">
      <header className={previewStyles.previewHeader}>
        <div>
          <p className={previewStyles.previewKicker}>{kicker}</p>
          <h2 id="profile-preview-heading" className={previewStyles.previewTitle}>Feed znajomych</h2>
        </div>
        <Link to={view.ctaTargetRoute} className={previewStyles.previewCta}>
          Zobacz więcej →
        </Link>
      </header>

      {view.items.length === 0 ? (
        view.restrictedReason === "not_friends" ? (
          <p className={previewStyles.previewRestricted}>
            Aby zobaczyć wpisy tej osoby, musisz być w gronie jej znajomych.
          </p>
        ) : view.viewerRelation === "owner" ? (
          <p className={previewStyles.previewEmpty}>Nie masz jeszcze wpisów. Otwórz composer w feedzie znajomych.</p>
        ) : (
          <p className={previewStyles.previewEmpty}>Brak publicznych wpisów.</p>
        )
      ) : (
        <ul className={previewStyles.previewItems}>
          {view.items.map((item) => (
            <li key={item.postId} className={previewStyles.previewItem}>
              <div className={previewStyles.previewItemTop}>
                <span className={previewStyles.previewItemAuthor}>
                  {view.viewerRelation === "owner" ? "Ty" : item.author.displayName}
                </span>
                <span className={previewStyles.previewItemDate}>{formatDate(item.createdAt)}</span>
                {item.visibility === "private" ? (
                  <span className={previewStyles.previewItemPrivacy}>Tylko Ty</span>
                ) : null}
              </div>
              <p className={previewStyles.previewItemBody}>{item.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
