/**
 * features-v2/content-display — pure helpers + label maps used by the kit.
 */
import type { PostDisplayBadge, PostDisplayVisibility } from "./types";
import styles from "./ContentDisplay.module.css";

export function initials(displayName: string): string {
  const parts = displayName.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function formatRelative(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function privacyClass(v: PostDisplayVisibility): string {
  switch (v) {
    case "public": return styles.privacyPublic;
    case "private": return styles.privacyPrivate;
    case "community_staff": return styles.privacyStaff;
    case "channel_followers": return styles.privacyChannel;
    case "workplace_public":
    case "workplace_friends_only":
    case "workplace_private":
      return styles.privacyWorkplace;
    default:
      return "";
  }
}

export function privacyLabel(v: PostDisplayVisibility): string {
  switch (v) {
    case "friends_only": return "Znajomi";
    case "public": return "Publiczne";
    case "private": return "Tylko Ty";
    case "community_all": return "Społeczność";
    case "community_staff": return "Tylko kadra";
    case "community_relational": return "Relacyjny";
    case "channel_followers": return "Obserwujący";
    case "workplace_public": return "Miejsce pracy";
    case "workplace_friends_only": return "Miejsce — znajomi";
    case "workplace_private": return "Miejsce — prywatne";
  }
}

export function badgeClass(tone: PostDisplayBadge["tone"]): string {
  switch (tone) {
    case "info": return styles.badgeInfo;
    case "warning": return styles.badgeWarning;
    case "success": return styles.badgeSuccess;
    default: return styles.badgeNeutral;
  }
}
