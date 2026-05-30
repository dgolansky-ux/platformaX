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
import {
  CommunityFeedComposer as UnifiedCommunityFeedComposer,
  RelationalFeedComposer,
  StaffFeedComposer,
  type PublishingAdapter,
  type PublishingCommandUi,
  type PublishingPreviewUi,
  type PublishingResultUi,
  type PublishingTargetDefinitionUi,
} from "../../publishing";
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
  const [scope, setScope] = useState<CommunityPublishScope>("current_community_only");
  const [selected, setSelected] = useState<string[]>([]);

  const canPost = feedType === "community_all" ? tabs.communityAll.canPost
    : feedType === "relational" ? tabs.relational.canPost
    : tabs.staffOnly.canPost;

  const showScope = feedType !== "relational" && tabs.canPublishToDescendants;
  const relationalFull = feedType === "relational" && tabs.relational.remaining <= 0;

  const toggleTarget = (id: string) =>
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  if (!canPost && feedType !== "relational") {
    return <p className={styles.notice}>Publikować w tym feedzie może tylko uprawniona kadra.</p>;
  }

  const targetType = feedType === "staff_only"
    ? "community_staff_feed"
    : feedType === "relational"
      ? "community_relational_feed"
      : "community_feed";
  const visibility = feedType === "staff_only"
    ? "community_staff"
    : feedType === "relational"
      ? "community_relational"
      : "community_all";
  const target: PublishingTargetDefinitionUi = {
    targetType,
    targetId: tabs.communityId,
    label: feedType === "staff_only" ? "Społeczność · Kadra" : feedType === "relational" ? "Społeczność · Relacyjny" : "Społeczność · Feed",
    description: "Publikacja do feedu społeczności.",
    allowedContentTypes: ["community_post"],
    allowedMediaTypes: ["image", "video", "document", "link"],
    visibilityOptions: [visibility],
    defaultVisibility: visibility,
    maxBodyLength: 2000,
    maxMediaCount: 6,
    permissionsRequired: [],
    status: canPost && !relationalFull ? "available" : "blocked",
    blockedReason: canPost ? undefined : "permission_denied",
    routeTarget: `/communities/${tabs.communityId}/feed`,
  };
  const adapter: PublishingAdapter = {
    async listAvailableTargets() {
      return [target];
    },
    async buildPreview(_viewerUserId: string, command: PublishingCommandUi): Promise<PublishingPreviewUi> {
      return {
        targetType: target.targetType,
        targetId: target.targetId,
        targetLabel: target.label,
        contentPreview: command.body.slice(0, 400),
        mediaPreviewRefs: command.mediaRefs ?? [],
        visibilityLabel: visibility,
        expectedDestinations: target.routeTarget ? [target.routeTarget] : [],
        warnings: publishing ? ["Publikacja już trwa."] : [],
        disabledReason: target.blockedReason,
      };
    },
    async publish(_viewerUserId: string, command: PublishingCommandUi): Promise<PublishingResultUi> {
      onPublish({ body: command.body, scope, selectedDescendantCommunityIds: selected });
      setScope("current_community_only");
      setSelected([]);
      return {
        status: "published",
        publishedEntity: {
          domain: "content-v2",
          entityType: `${target.targetType}_post`,
          entityId: "community-feed-pending",
          routeTarget: target.routeTarget ?? "",
        },
        feedEffects: { createdFriendFeedItem: false, createdTeaser: false, createdNotificationEvent: false, noFeedEffect: false },
        warnings: [],
        errors: [],
      };
    },
  };
  const Composer = feedType === "staff_only"
    ? StaffFeedComposer
    : feedType === "relational"
      ? RelationalFeedComposer
      : UnifiedCommunityFeedComposer;

  return (
    <section className={styles.composer} aria-label="Nowy post">
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
      <Composer
        viewerUserId="u-viewer-demo"
        adapter={adapter}
        availableTargets={[target]}
        communityTarget={target}
      />
    </section>
  );
}
