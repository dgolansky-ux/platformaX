/**
 * features-v2/content-display — Post Display Kit base components.
 *
 * Compound shell every variant card reuses. Each piece is small, memo-
 * friendly and renders only from the view model (no permission checks, no
 * @server/* imports, no fake counters).
 *
 * State + action bar + helpers live in sibling files
 * (`PostDisplayStates.tsx`, `PostActionBar.tsx`, `PostDisplayHelpers.ts`)
 * to keep each file inside the code-quality size guard.
 */
import { memo } from "react";
import type {
  PostDisplayAuthor,
  PostDisplayBadge,
  PostDisplayMediaRef,
  PostDisplaySourceContext,
  PostDisplayVisibility,
} from "./types";
import { badgeClass, formatRelative, initials, privacyClass, privacyLabel } from "./PostDisplayHelpers";
import { BrokenMediaFallback } from "../media";
import styles from "./ContentDisplay.module.css";

interface RootProps {
  variantClassName?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

export const PostDisplayRoot = memo(function PostDisplayRoot({ variantClassName, children, ariaLabel }: RootProps) {
  const className = variantClassName ? `${styles.card} ${variantClassName}` : styles.card;
  return (
    <article className={className} aria-label={ariaLabel}>
      {children}
    </article>
  );
});

interface AuthorProps {
  author: PostDisplayAuthor;
  meta?: string;
}

export const PostAuthorSummary = memo(function PostAuthorSummary({ author, meta }: AuthorProps) {
  return (
    <>
      <span className={styles.avatar} aria-hidden="true">{initials(author.displayName)}</span>
      <div className={styles.authorBlock}>
        <p className={styles.authorName}>{author.displayName}</p>
        {meta && <p className={styles.authorMeta}>{meta}</p>}
      </div>
    </>
  );
});

interface HeaderProps {
  author: PostDisplayAuthor;
  sourceContext: PostDisplaySourceContext | null;
  visibility: PostDisplayVisibility;
  createdAt: string;
}

export const PostDisplayHeader = memo(function PostDisplayHeader({ author, sourceContext, visibility, createdAt }: HeaderProps) {
  const meta = [sourceContext?.sourceLabel, formatRelative(createdAt)].filter(Boolean).join(" · ");
  return (
    <header className={styles.cardHeader}>
      <PostAuthorSummary author={author} meta={meta} />
      <PostPrivacyBadge visibility={visibility} />
    </header>
  );
});

interface BodyProps { title: string | null; text: string; teaser?: boolean }

export const PostBody = memo(function PostBody({ title, text, teaser }: BodyProps) {
  return (
    <>
      {title && <h3 className={styles.title}>{title}</h3>}
      {text.length > 0 && (
        <p className={teaser ? styles.bodyTeaser : styles.body}>{text}</p>
      )}
    </>
  );
});

interface MediaGridProps { mediaRefs: readonly PostDisplayMediaRef[] }

export const PostMediaGrid = memo(function PostMediaGrid({ mediaRefs }: MediaGridProps) {
  if (mediaRefs.length === 0) return null;
  return (
    <div className={styles.mediaGrid}>
      {mediaRefs.slice(0, 4).map((m) => (
        <div
          key={m.refId}
          className={styles.mediaCell}
          role="img"
          aria-label={m.altText ?? m.mediaType}
        >
          {m.mediaType === "image" && m.previewUrl ? (
            <img
              src={m.previewUrl}
              alt={m.altText ?? ""}
              loading="lazy"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <BrokenMediaFallback label={m.altText ?? m.mediaType} />
          )}
        </div>
      ))}
    </div>
  );
});

interface MetaProps {
  createdAt: string;
  updatedAt?: string;
  extra?: readonly string[];
}

export const PostMeta = memo(function PostMeta({ createdAt, updatedAt, extra }: MetaProps) {
  const parts: string[] = [];
  parts.push(`Utworzono: ${formatRelative(createdAt)}`);
  if (updatedAt && updatedAt !== createdAt) parts.push(`Edycja: ${formatRelative(updatedAt)}`);
  if (extra) parts.push(...extra);
  return (
    <div className={styles.metaRow}>
      {parts.map((p) => <span key={p}>{p}</span>)}
    </div>
  );
});

export const PostPrivacyBadge = memo(function PostPrivacyBadge({ visibility }: { visibility: PostDisplayVisibility }) {
  const cls = privacyClass(visibility);
  return <span className={`${styles.privacyBadge} ${cls}`}>{privacyLabel(visibility)}</span>;
});

export const PostBadgeRow = memo(function PostBadgeRow({ badges }: { badges: readonly PostDisplayBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <div className={styles.badgeRow}>
      {badges.map((b) => (
        <span key={b.label} className={`${styles.badge} ${badgeClass(b.tone)}`}>{b.label}</span>
      ))}
    </div>
  );
});

interface StatsRowProps {
  likeCount: number;
  commentCount: number;
  shareCount?: number;
}

export const PostStatsRow = memo(function PostStatsRow({ likeCount, commentCount, shareCount }: StatsRowProps) {
  if (likeCount === 0 && commentCount === 0 && (shareCount ?? 0) === 0) return null;
  const rightParts: string[] = [];
  if (commentCount > 0) rightParts.push(`${commentCount} ${pluralPL(commentCount, "komentarz", "komentarze", "komentarzy")}`);
  if (shareCount && shareCount > 0) rightParts.push(`${shareCount} ${pluralPL(shareCount, "udostępnienie", "udostępnienia", "udostępnień")}`);
  return (
    <div className={styles.statsRow}>
      <span className={styles.statsLeft}>
        {likeCount > 0 ? (
          <>
            <span className={styles.statsReactionBubble} aria-hidden="true">👍</span>
            <span>{likeCount}</span>
          </>
        ) : null}
      </span>
      {rightParts.length > 0 ? <span className={styles.statsRight}>{rightParts.join(" · ")}</span> : null}
    </div>
  );
});

function pluralPL(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
