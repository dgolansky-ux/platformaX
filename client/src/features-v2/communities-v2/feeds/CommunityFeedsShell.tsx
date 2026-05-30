/**
 * features-v2/communities-v2 / feeds / CommunityFeedsShell — the community feeds
 * screen (UI_SHELL_ONLY + MOCK_LOCAL_ONLY). Three feeds as tabs (Główny /
 * Relacyjny / Kadra) + composer with publish-scope (descendant publishing) +
 * relational quota. Slice 6 adds the interactions panel under each card
 * (reaction + lazy comments thread); the shell wires the per-feed comment +
 * reaction permissions and registers visible items with the interactions
 * adapter so the mock backend can gate access without an HTTP transport.
 *
 * No `@server/*` imports; every action hits a mock adapter (no fake save).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type {
  CommunityFeedItemDTO,
  CommunityFeedTabsStateDTO,
  CommunityFeedType,
  DescendantPublishTargetDTO,
} from "@shared/contracts/community-feeds";
import { communityFeedsMockAdapter } from "./community-feeds-mock-adapter";
import { communityInteractionsMockAdapter } from "./community-interactions-mock-adapter";
import { CommunityFeedTabs } from "./CommunityFeedTabs";
import { CommunityFeedComposer, type ComposerSubmit } from "./CommunityFeedComposer";
import { CommunityFeedList, type FeedListState } from "./CommunityFeedList";
import { ComposerModal, ComposerTrigger, useComposerOpenEvent } from "../../publishing";
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

/**
 * The feeds adapter doesn't expose its internal viewer role — we infer the
 * minimal info the interactions adapter needs (can the viewer see the
 * staff_only feed?) from tabs.staffOnly.visible. Plain members get role
 * "member"; staff get "founder" (the demo viewer is community founder where
 * staff is visible). Anonymous/strangers are not exercised in the demo.
 */
function viewerRoleFor(tabs: CommunityFeedTabsStateDTO): "founder" | "member" {
  return tabs.staffOnly.visible ? "founder" : "member";
}

export function CommunityFeedsShell({ slug }: { slug: string }) {
  const [tabsLoad, setTabsLoad] = useState<TabsLoad>({ status: "loading" });
  const [active, setActive] = useState<CommunityFeedType>("community_all");
  const [feed, setFeed] = useState<FeedListState>({ status: "loading" });
  const [descendants, setDescendants] = useState<readonly DescendantPublishTargetDTO[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const registerItems = useCallback((items: readonly CommunityFeedItemDTO[], tabs: CommunityFeedTabsStateDTO) => {
    const role = viewerRoleFor(tabs);
    for (const item of items) {
      communityInteractionsMockAdapter.registerFeedItem({
        id: item.id, communityId: item.communityId, feedType: item.feedType, viewerRole: role,
      });
    }
  }, []);

  const loadFeed = useCallback(async (feedType: CommunityFeedType, tabs: CommunityFeedTabsStateDTO) => {
    setFeed({ status: "loading" });
    const res = await communityFeedsMockAdapter.listFeed(slug, feedType);
    if (!res.ok) {
      setFeed(res.error.code === "FORBIDDEN" ? { status: "forbidden", message: res.error.message } : { status: "error", message: res.error.message });
      return;
    }
    registerItems(res.value.items, tabs);
    setFeed({ status: "ready", items: res.value.items });
  }, [slug, registerItems]);

  const loadTabs = useCallback(async () => {
    const [tabsRes, descRes] = await Promise.all([
      communityFeedsMockAdapter.getFeedTabsState(slug),
      communityFeedsMockAdapter.listDescendantTargets(slug),
    ]);
    if (descRes.ok) setDescendants(descRes.value);
    if (!tabsRes.ok) { setTabsLoad({ status: "error", message: tabsRes.error.message }); return; }
    setTabsLoad({ status: "ready", tabs: tabsRes.value });
    const first = firstVisible(tabsRes.value);
    if (first) { setActive(first); await loadFeed(first, tabsRes.value); }
  }, [slug, loadFeed]);

  useEffect(() => { void loadTabs(); }, [loadTabs]);

  const handleFabOpen = useCallback(() => {
    setPublishError(null);
    setComposerOpen(true);
  }, []);
  useComposerOpenEvent("community_feed", handleFabOpen);

  const onSelect = (feedType: CommunityFeedType) => {
    setActive(feedType); setPublishError(null); setFlash(null);
    if (tabsLoad.status === "ready") void loadFeed(feedType, tabsLoad.tabs);
  };

  const onPublish = async (input: ComposerSubmit) => {
    setPublishing(true);
    setPublishError(null);
    setFlash(null);
    const res = await communityFeedsMockAdapter.publishPost({
      communitySlug: slug, feedType: active, body: input.body, scope: input.scope, selectedDescendantCommunityIds: input.selectedDescendantCommunityIds,
    });
    setPublishing(false);
    if (!res.ok) { setPublishError(res.error.message); return; }
    setComposerOpen(false);
    setFlash(res.value.distributedCount > 0 ? `Opublikowano i rozesłano do ${res.value.distributedCount} podspołeczności.` : "Opublikowano.");
    const tabsRes = await communityFeedsMockAdapter.getFeedTabsState(slug);
    if (tabsRes.ok) {
      setTabsLoad({ status: "ready", tabs: tabsRes.value });
      await loadFeed(active, tabsRes.value);
    }
  };

  const { canComment, canReact, noPermissionMessage } = useMemo(() => {
    if (tabsLoad.status !== "ready") return { canComment: false, canReact: false, noPermissionMessage: undefined as string | undefined };
    if (active === "community_all") {
      const ok = tabsLoad.tabs.communityAll.visible;
      return { canComment: ok, canReact: ok, noPermissionMessage: ok ? undefined : "Tylko członkowie społeczności mogą komentować." };
    }
    if (active === "relational") {
      const ok = tabsLoad.tabs.relational.visible;
      return { canComment: ok, canReact: ok, noPermissionMessage: ok ? undefined : "Feed relacyjny jest dostępny dla członków społeczności." };
    }
    const ok = tabsLoad.tabs.staffOnly.visible;
    return { canComment: ok, canReact: ok, noPermissionMessage: ok ? undefined : "Tylko kadra może komentować w feedzie staff." };
  }, [active, tabsLoad]);

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
      <ComposerTrigger
        avatarInitial="D"
        placeholder="Co chcesz pokazać społeczności?"
        onOpen={() => {
          setPublishError(null);
          setComposerOpen(true);
        }}
      />
      <ComposerModal
        open={composerOpen}
        title="Wpis dla społeczności"
        subtitle={active === "staff_only" ? "Widoczne tylko dla kadry." : undefined}
        onClose={() => setComposerOpen(false)}
      >
        <CommunityFeedComposer
          feedType={active}
          tabs={tabs}
          descendants={descendants}
          publishing={publishing}
          error={publishError}
          onPublish={(input) => void onPublish(input)}
        />
      </ComposerModal>
      <CommunityFeedList
        state={feed}
        canComment={canComment}
        canReact={canReact}
        noPermissionMessage={noPermissionMessage}
      />
    </section>
  );
}
