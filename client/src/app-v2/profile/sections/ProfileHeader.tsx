import type { PersonalProfileView, ProfilePreviewKind, ProfileViewMode } from "../types";
import { ProfileAvatar } from "./ProfileAvatar";
import { ProfileBio } from "./ProfileBio";
import { ProfileStatusBar } from "./ProfileStatusBar";
import { ProfileModeSwitcher } from "./ProfileModeSwitcher";
import { ProfileBanner } from "./ProfileBanner";
import styles from "../styles/profile-header.module.css";

type ProfileHeaderProps = {
  profile: PersonalProfileView;
  mode: ProfileViewMode;
  previewOpen: boolean;
  onTogglePreview: () => void;
  onSelectPreview: (kind: ProfilePreviewKind) => void;
  onSelectPersonal: () => void;
  onSelectProfessional: () => void;
  onShare: () => void;
  onEditAvatar?: () => void;
  onEditBanner?: () => void;
};

/**
 * Mobile header. Order is fixed per blueprint §6.1:
 * name → [avatar | separator | bio] → status bar → mode switcher → banner.
 */
export function ProfileHeader({
  profile,
  mode,
  previewOpen,
  onTogglePreview,
  onSelectPreview,
  onSelectPersonal,
  onSelectProfessional,
  onShare,
  onEditAvatar,
  onEditBanner,
}: ProfileHeaderProps) {
  return (
    <header className={styles.header}>
      <h1 className={styles.name}>{profile.displayName}</h1>

      <div className={styles.avatarBioRow}>
        <div className={styles.avatarCol}>
          <ProfileAvatar
            initial={profile.avatarInitial}
            avatarUrl={profile.avatarUrl}
            isOwner={profile.isOwner}
            previewOpen={previewOpen}
            onTogglePreview={onTogglePreview}
            onEdit={onEditAvatar}
          />
        </div>
        <div className={styles.separator} aria-hidden="true" />
        <ProfileBio bio={profile.bio} isOwner={profile.isOwner} />
      </div>

      {previewOpen ? (
        <div className={styles.previewMenu} role="menu">
          <p className={styles.previewMenuTitle}>Podgląd profilu</p>
          <button
            type="button"
            role="menuitem"
            className={styles.previewOption}
            onClick={() => onSelectPreview("friend")}
          >
            Widok znajomego
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.previewOption}
            onClick={() => onSelectPreview("stranger")}
          >
            Widok nieznajomego
          </button>
          <button
            type="button"
            role="menuitem"
            className={styles.previewOption}
            onClick={() => onSelectPreview("none")}
          >
            Zamknij podgląd
          </button>
        </div>
      ) : null}

      <ProfileStatusBar status={profile.status} isOwner={profile.isOwner} />

      {profile.location ? (
        <p className={styles.locationRow}>
          <span aria-hidden="true">📍</span> {profile.location}
        </p>
      ) : null}

      <ProfileModeSwitcher
        mode={mode}
        onSelectPersonal={onSelectPersonal}
        onSelectProfessional={onSelectProfessional}
      />

      <ProfileBanner
        onShare={onShare}
        isOwner={profile.isOwner}
        onEditImage={onEditBanner}
        bannerUrl={profile.bannerUrl}
      />
    </header>
  );
}
