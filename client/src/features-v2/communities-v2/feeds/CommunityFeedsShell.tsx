/**
 * features-v2/communities-v2 / feeds / CommunityFeedsShell — the community feeds
 * screen (UI_SHELL_ONLY + MOCK_LOCAL_ONLY). Three feeds as tabs (Główny /
 * Relacyjny / Kadra) + composer with publish-scope (descendant publishing) +
 * relational quota. Mirrors the legacy CommunityDetailFeedTab. No `@server/*`
 * imports; every action hits the feeds mock-adapter (no fake save).
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  CommunityFeedTabsStateDTO,
  CommunityFeedType,
  DescendantPublishTargetDTO,
} from "@shared/contracts/community-feeds";
import { communityFeedsMockAdapter } from "./community-feeds-mock-adapter";
import { CommunityFeedTabs } from "./CommunityFeedTabs";
import { CommunityFeedComposer, type ComposerSubmit } from "./CommunityFeedComposer";
import { CommunityFeedList, type FeedListState } from "./CommunityFeedList";
import styles from "./Feeds.module.css";

type TabsLoad =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; tabs: CommunityFeedTabsStateDTO };

function firstVisible(tabs: CommunityFeedTabsStateDTO): CommunityFeedType | null {
  if (tabs.communityAll.visible) return "community_all";
  if (tabs.relational.visible) return "relational";
  if (tabs.staffOnly.visible) return "staff_only";
  return null;
}

export function CommunityFeedsShell({ slug }: { slug: string }) {
  const [tabsLoad, setTabsLoad] = useState<TabsLoad>({ status: "loading" });
  const [active, setActive] = useState<CommunityFeedType>("community_all");
  const [feed, setFeed] = useState<FeedListState>({ status: "loading" });
  const [descendants, setDescendants] = useState<readonly DescendantPublishTargetDTO[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const loadFeed = useCallback(async (feedType: CommunityFeedType) => {
    setFeed({ status: "loading" });
    const res = await communityFeedsMockAdapter.listFeed(slug, feedType);
    if (!res.ok) {
      setFeed(res.error.code === "FORBIDDEN" ? { status: "forbidden", message: res.error.message } : { status: "error", message: res.error.message });
      return;
    }
    setFeed({ status: "ready", items: res.value.items });
  }, [slug]);

  const loadTabs = useCallback(async () => {
    const [tabsRes, descRes] = await Promise.all([
      communityFeedsMockAdapter.getFeedTabsState(slug),
      communityFeedsMockAdapter.listDescendantTargets(slug),
    ]);
    if (descRes.ok) setDescendants(descRes.value);
    if (!tabsRes.ok) { setTabsLoad({ status: "error", message: tabsRes.error.message }); return; }
    setTabsLoad({ status: "ready", tabs: tabsRes.value });
    const first = firstVisible(tabsRes.value);
    if (first) { setActive(first); await loadFeed(first); }
  }, [slug, loadFeed]);

  useEffect(() => { void loadTabs(); }, [loadTabs]);

  const onSelect = (feedType: CommunityFeedType) => { setActive(feedType); setPublishError(null); setFlash(null); void loadFeed(feedType); };

  const onPublish = async (input: ComposerSubmit) => {
    setPublishing(true);
    setPublishError(null);
    setFlash(null);
    const res = await communityFeedsMockAdapter.publishPost({
      communitySlug: slug, feedType: active, body: input.body, scope: input.scope, selectedDescendantCommunityIds: input.selectedDescendantCommunityIds,
    });
    setPublishing(false);
    if (!res.ok) { setPublishError(res.error.message); return; }
    setFlash(res.value.distributedCount > 0 ? `Opublikowano i rozesłano do ${res.value.distributedCount} podspołeczności.` : "Opublikowano.");
    const tabsRes = await communityFeedsMockAdapter.getFeedTabsState(slug);
    if (tabsRes.ok) setTabsLoad({ status: "ready", tabs: tabsRes.value });
    await loadFeed(active);
  };

  if (tabsLoad.status === "loading") {
    return <div className={styles.root}><div className={styles.state} aria-busy="true">Ładowanie feedów…</div></div>;
  }
  if (tabsLoad.status === "error") {
    return <div className={styles.root}><div className={styles.errorState} role="alert">{tabsLoad.message}</div></div>;
  }

  const tabs = tabsLoad.tabs;
  return (
    <section className={styles.root} aria-labelledby="feeds-heading">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Feedy społeczności</p>
          <h1 id="feeds-heading" className={styles.title}>Feed</h1>
          <p className={styles.subtitle}>Główny · Relacyjny · Kadra</p>
        </div>
        <Link to={`/communities/${slug}`} className={styles.backButton}>← Wróć do profilu</Link>
      </header>
      <CommunityFeedTabs tabs={tabs} active={active} onSelect={onSelect} />
      {flash ? <p className={styles.successFlash} role="status">{flash}</p> : null}
      <CommunityFeedComposer
        feedType={active}
        tabs={tabs}
        descendants={descendants}
        publishing={publishing}
        error={publishError}
        onPublish={(input) => void onPublish(input)}
      />
      <CommunityFeedList state={feed} />
    </section>
  );
}
