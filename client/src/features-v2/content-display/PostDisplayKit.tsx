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
