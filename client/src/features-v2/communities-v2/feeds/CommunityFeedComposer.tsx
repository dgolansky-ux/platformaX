/**
 * features-v2/communities-v2 / feeds / CommunityFeedComposer — write + publish.
 * Mirrors legacy composer ("Napisz coś do społeczności…") + scope selector. The
 * scope selector + descendant picker appear only for staff allowed to publish
 * down and never for the relational feed. Relational shows its monthly quota.
 * Submits through the feeds mock-adapter — no fake save.
 */
import { useState } from "react";
import type {
  CommunityFeedTabsStateDTO,
  CommunityFeedType,
  CommunityPublishScope,
  DescendantPublishTargetDTO,
} from "@shared/contracts/community-feeds";
import { CommunityPublishScopeSelector } from "./CommunityPublishScopeSelector";
import styles from "./Feeds.module.css";

export type ComposerSubmit = {
  body: string;
  scope: CommunityPublishScope;
  selectedDescendantCommunityIds: string[];
};

export function CommunityFeedComposer({
  feedType,
  tabs,
  descendants,
  publishing,
  error,
  onPublish,
}: {
  feedType: CommunityFeedType;
  tabs: CommunityFeedTabsStateDTO;
  descendants: readonly DescendantPublishTargetDTO[];
  publishing: boolean;
  error: string | null;
  onPublish: (input: ComposerSubmit) => void;
}) {
  const [body, setBody] = useState("");
  const [scope, setScope] = useState<CommunityPublishScope>("current_community_only");
  const [selected, setSelected] = useState<string[]>([]);

  const canPost = feedType === "community_all" ? tabs.communityAll.canPost
    : feedType === "relational" ? tabs.relational.canPost
    : tabs.staffOnly.canPost;

  const showScope = feedType !== "relational" && tabs.canPublishToDescendants;
  const relationalFull = feedType === "relational" && tabs.relational.remaining <= 0;
  const disabled = publishing || body.trim().length === 0 || !canPost;

  const toggleTarget = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  if (!canPost && feedType !== "relational") {
    return <p className={styles.notice}>Publikować w tym feedzie może tylko uprawniona kadra.</p>;
  }

  return (
    <section className={styles.composer} aria-label="Nowy post">
      <textarea
        className={styles.composerTextarea}
        placeholder={feedType === "staff_only" ? "Napisz coś do kadry…" : "Napisz coś do społeczności…"}
        value={body}
        maxLength={2000}
        onChange={(e) => setBody(e.target.value)}
        aria-label="Treść posta"
      />
      {feedType === "relational" ? (
        <p className={`${styles.quota} ${relationalFull ? styles.quotaFull : ""}`.trim()}>
          Limit miesięczny: {tabs.relational.usedThisMonth}/{tabs.relational.monthlyLimit}
          {relationalFull ? " — wyczerpany" : ""}
        </p>
      ) : null}
      {showScope ? (
        <CommunityPublishScopeSelector
          scope={scope}
          onScope={(s) => { setScope(s); if (s !== "selected_descendants") setSelected([]); }}
          descendants={descendants}
          selectedIds={selected}
          onToggleTarget={toggleTarget}
        />
      ) : null}
      {error ? <p className={styles.fieldError} role="alert">{error}</p> : null}
      <div className={styles.composerFoot}>
        <span className={styles.composerMeta}>{body.length}/2000</span>
        <button
          type="button"
          className={styles.primaryBtn}
          disabled={disabled || relationalFull}
          onClick={() => {
            onPublish({ body, scope, selectedDescendantCommunityIds: selected });
            setBody("");
            setScope("current_community_only");
            setSelected([]);
          }}
        >
          {publishing ? "Publikowanie…" : "Opublikuj"}
        </button>
      </div>
    </section>
  );
}
