/**
 * features-v2/content-display/variants — visual variants for the Post
 * Display Kit. Each variant composes the base components from
 * `PostDisplayKit.tsx`; structure is identical, only the accent / extras
 * differ. Keeps logic single-source while leaving room for distinct UX per
 * surface.
 */
import { memo } from "react";
import {
  PostBadgeRow,
  PostBody,
  PostDisplayHeader,
  PostDisplayRoot,
  PostMediaGrid,
  PostMeta,
} from "../PostDisplayKit";
import { PostActionBar, PostRouteLink } from "../PostActionBar";
import type { PostDisplayViewModel } from "../types";
import styles from "../ContentDisplay.module.css";

interface Props {
  vm: PostDisplayViewModel;
  onReact?(): void;
  onComment?(): void;
  onShare?(): void;
}

function StandardCard({ vm, variantClassName, ariaLabel, onReact, onComment, onShare }: Props & { variantClassName: string; ariaLabel: string }) {
  return (
    <PostDisplayRoot variantClassName={variantClassName} ariaLabel={ariaLabel}>
      <PostDisplayHeader
        author={vm.author}
        sourceContext={vm.sourceContext}
        visibility={vm.visibility}
        createdAt={vm.createdAt}
      />
      <PostBadgeRow badges={vm.badges} />
      <PostBody title={vm.title} text={vm.bodyFull ?? vm.bodyPreview} />
      <PostMediaGrid mediaRefs={vm.mediaRefs} />
      <PostMeta createdAt={vm.createdAt} updatedAt={vm.updatedAt} />
      <PostActionBar
        config={vm.actions}
        interaction={vm.interactionSummary}
        routeTarget={vm.routeTarget}
        onReact={onReact}
        onComment={onComment}
        onShare={onShare}
      />
    </PostDisplayRoot>
  );
}

export const FriendFeedPostCard = memo(function FriendFeedPostCard(props: Props) {
  return <StandardCard {...props} variantClassName={styles.variantFriend} ariaLabel="Post znajomego" />;
});

export const CommunityFeedPostCard = memo(function CommunityFeedPostCard(props: Props) {
  return <StandardCard {...props} variantClassName={styles.variantCommunity} ariaLabel="Wpis społeczności" />;
});

export const StaffFeedPostCard = memo(function StaffFeedPostCard(props: Props) {
  return <StandardCard {...props} variantClassName={styles.variantStaff} ariaLabel="Wpis kadry" />;
});

export const RelationalFeedPostCard = memo(function RelationalFeedPostCard(props: Props) {
  return <StandardCard {...props} variantClassName={styles.variantRelational} ariaLabel="Wpis relacyjny" />;
});

export const ChannelPostCard = memo(function ChannelPostCard(props: Props) {
  return <StandardCard {...props} variantClassName={styles.variantChannel} ariaLabel="Wpis kanału" />;
});

export const WorkplacePostCard = memo(function WorkplacePostCard(props: Props) {
  return <StandardCard {...props} variantClassName={styles.variantWorkplace} ariaLabel="Wpis miejsca pracy" />;
});

/**
 * Compact teaser — no full body, no media grid, action bar only routes to
 * the full workplace post. Reflects rule 10: teaser is NOT the full post.
 */
export const WorkplaceTeaserCard = memo(function WorkplaceTeaserCard({ vm, onShare }: Props) {
  return (
    <PostDisplayRoot variantClassName={styles.variantWorkplaceTeaser} ariaLabel="Zajawka miejsca pracy">
      <PostDisplayHeader
        author={vm.author}
        sourceContext={vm.sourceContext}
        visibility={vm.visibility}
        createdAt={vm.createdAt}
      />
      <PostBadgeRow badges={vm.badges} />
      <PostBody title={vm.title} text={vm.bodyPreview} teaser />
      <PostActionBar
        config={{ ...vm.actions, showReact: false, showComment: false, showShare: vm.actions.showShare, showOpen: true }}
        routeTarget={vm.routeTarget}
        onShare={onShare}
      />
    </PostDisplayRoot>
  );
});

export const ImportantEventCard = memo(function ImportantEventCard({ vm, onShare }: Props) {
  return (
    <PostDisplayRoot variantClassName={styles.variantImportantEvent} ariaLabel="Ważne wydarzenie">
      <header className={styles.cardHeader}>
        {vm.date && (
          <span className={styles.eventDateBadge}>{formatEventDate(vm.date)}</span>
        )}
        <div className={styles.authorBlock}>
          {vm.title && <h3 className={styles.title}>{vm.title}</h3>}
          <p className={styles.authorMeta}>{vm.author.displayName}</p>
        </div>
      </header>
      <PostBadgeRow badges={vm.badges} />
      <PostBody title={null} text={vm.bodyFull ?? vm.bodyPreview} />
      <PostMediaGrid mediaRefs={vm.mediaRefs} />
      <PostMeta createdAt={vm.createdAt} updatedAt={vm.updatedAt} />
      <div className={styles.actionBar}>
        <PostRouteLink href={vm.routeTarget}>Szczegóły</PostRouteLink>
        {vm.actions.showShare && (
          <button type="button" className={styles.actionButton} onClick={onShare}>🔗 Udostępnij</button>
        )}
      </div>
    </PostDisplayRoot>
  );
});

export const ProfilePresentationCard = memo(function ProfilePresentationCard({ vm, onShare }: Props) {
  return (
    <PostDisplayRoot variantClassName={styles.variantPresentation} ariaLabel="Prezentacja profilu">
      <header className={styles.cardHeader}>
        <div className={styles.authorBlock}>
          {vm.title && <h3 className={styles.title}>{vm.title}</h3>}
          <p className={styles.authorMeta}>{vm.author.displayName}</p>
        </div>
        <PostBadgeRow badges={vm.badges} />
      </header>
      <PostBody title={null} text={vm.bodyFull ?? vm.bodyPreview} />
      <PostMediaGrid mediaRefs={vm.mediaRefs} />
      <div className={styles.actionBar}>
        <PostRouteLink href={vm.routeTarget}>Otwórz sekcję</PostRouteLink>
        {vm.actions.showShare && (
          <button type="button" className={styles.actionButton} onClick={onShare}>🔗 Udostępnij</button>
        )}
      </div>
    </PostDisplayRoot>
  );
});

/**
 * Compact preview card — used in lists / activity hovers; truncates body
 * and hides media. The route link is the only interaction.
 */
export const CompactPostPreviewCard = memo(function CompactPostPreviewCard({ vm }: Props) {
  return (
    <PostDisplayRoot variantClassName={`${styles.variantCompact}`} ariaLabel="Skrócony podgląd posta">
      <header className={styles.cardHeader}>
        <div className={styles.authorBlock}>
          <p className={styles.authorName}>{vm.author.displayName}</p>
          <p className={styles.authorMeta}>{vm.sourceContext?.sourceLabel ?? "Wpis"}</p>
        </div>
        <PostRouteLink href={vm.routeTarget}>Otwórz</PostRouteLink>
      </header>
      <PostBody title={vm.title} text={vm.bodyPreview} teaser />
    </PostDisplayRoot>
  );
});

function formatEventDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return iso;
  }
}
