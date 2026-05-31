/**
 * features-v2/communities-v2 / profile / CommunityProfileHero
 *
 * Presentational hero (banner + avatar + title + chips + Crown). Mirrors the
 * legacy CommunityDetailHeader 1:1 visually (banner aspect, avatar orbit ring,
 * Crown on owner, dark-glass visibility/member chips) without copying its
 * runtime — no `@server/*`, no image upload, no localStorage.
 */
import type { CommunityProfileDTO } from "@shared/contracts/communities";
import type { CommunityViewerStateDTO } from "@shared/contracts/communities-viewer";
import styles from "../CommunityProfile.module.css";

type Props = {
  profile: CommunityProfileDTO;
  viewer: CommunityViewerStateDTO;
  onBack: () => void;
};

const BANNER_GRADIENTS = [
  "linear-gradient(135deg, #6366f1, #1e4fd8 70%)",
  "linear-gradient(135deg, #f97316, #fbbf24 70%)",
  "linear-gradient(135deg, #10b981, #0ea5e9 70%)",
  "linear-gradient(135deg, #8b5cf6, #ec4899 70%)",
  "linear-gradient(135deg, #f43f5e, #fb923c 70%)",
  "linear-gradient(135deg, #0ea5e9, #6366f1 70%)",
];

function avatarInitial(name: string): string {
  return name.trim().slice(0, 1).toUpperCase() || "?";
}

export function CommunityProfileHero({ profile, viewer, onBack }: Props) {
  const gradient = BANNER_GRADIENTS[(profile.bannerGradientIdx ?? 0) % BANNER_GRADIENTS.length];
  const isOwner = viewer.relation === "founder";
  const visibilityLabel = profile.visibility === "public" ? "Publiczna" : "Prywatna";

  return (
    <section className={styles.hero} aria-labelledby="community-profile-heading">
      <div className={styles.banner} style={{ background: gradient }}>
        <div className={styles.bannerOverlay} aria-hidden />
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Wróć do listy">
          ←
        </button>
        <div className={styles.bannerChips}>
          <span className={styles.visibilityChip} aria-label={`Widoczność: ${visibilityLabel}`}>
            {profile.visibility === "public" ? "🌐" : "🔒"} {visibilityLabel}
          </span>
          <span className={styles.memberChip} aria-label={`${profile.memberCount} członków`}>
            👥 {profile.memberCount.toLocaleString("pl-PL")}
          </span>
        </div>
      </div>
      <div className={styles.heroBody}>
        <div className={styles.avatarFrame}>
          <svg className={styles.avatarRing} viewBox="0 0 124 124" aria-hidden>
            <defs>
              <linearGradient id="cp-orbit" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,248,180,0)" />
                <stop offset="50%" stopColor="rgba(255,248,180,0.55)" />
                <stop offset="100%" stopColor="rgba(255,248,180,0)" />
              </linearGradient>
            </defs>
            <path
              d="M 62 4 A 58 58 0 0 1 120 62"
              fill="none"
              stroke="rgba(255,248,180,0.45)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          <div className={styles.avatarInner} style={{ background: gradient }} aria-hidden>
            {avatarInitial(profile.name)}
          </div>
        </div>
        <div className={styles.heroText}>
          <p className={styles.kicker}>/{profile.slug}</p>
          <div className={styles.titleRow}>
            <h1 id="community-profile-heading" className={styles.title}>
              {profile.name}
            </h1>
            {isOwner ? <span className={styles.founderCrown} aria-label="Twoja społeczność">👑</span> : null}
          </div>
        </div>
      </div>
      <p className={`${styles.description}${profile.description ? "" : ` ${styles.descriptionEmpty}`}`}>
        {profile.description || "Społeczność nie dodała jeszcze opisu."}
      </p>
    </section>
  );
}
