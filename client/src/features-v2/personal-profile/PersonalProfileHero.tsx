import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import { ProfileViewerActions } from "./ProfileViewerActions";
import styles from "./PersonalProfilePage.module.css";

type Props = {
  view: PersonalProfileViewDTO;
  onEditAvatar?: () => void;
  onEditBanner?: () => void;
  onEditBio?: () => void;
  onManageProfile?: () => void;
  onSendFriendRequest?: () => void;
  onAcceptFriendRequest?: () => void;
  onRequestContactAccess?: () => void;
};

function avatarInitial(displayName: string): string {
  return displayName.trim().slice(0, 1).toUpperCase() || "?";
}

export function PersonalProfileHero(props: Props) {
  const { view } = props;
  const isOwner = view.viewerState.canEditProfile;
  return (
    <header className={styles.hero} aria-labelledby="profile-hero-name">
      <div
        className={styles.heroBanner}
        style={view.profile.bannerUrl ? { background: `center/cover no-repeat url(${view.profile.bannerUrl})` } : undefined}
        role="presentation"
      >
        {isOwner ? (
          <button type="button" className={styles.editPill} onClick={props.onEditBanner} aria-label="Edytuj baner">
            Edytuj baner
          </button>
        ) : null}
        <span className={styles.heroAvatar} aria-label={`Awatar: ${view.profile.displayName}`}>
          {avatarInitial(view.profile.displayName)}
        </span>
      </div>
      <div className={styles.heroBody}>
        <div className={styles.heroNameRow}>
          <h1 id="profile-hero-name" className={styles.heroName}>{view.profile.displayName}</h1>
          <span className={styles.heroUsername}>@{view.profile.username}</span>
        </div>
        {view.profile.bio ? <p className={styles.heroBio}>{view.profile.bio}</p> : null}
        <div className={styles.heroMeta}>
          {view.profile.location ? <span>📍 {view.profile.location}</span> : null}
          {view.profile.publicSummary ? <span>📝 {view.profile.publicSummary}</span> : null}
        </div>
        {isOwner ? (
          <div className={styles.editPillRow}>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={props.onEditAvatar}>
              Edytuj awatar
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={props.onEditBio}>
              Edytuj bio
            </button>
            <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={props.onManageProfile}>
              Zarządzaj profilem
            </button>
          </div>
        ) : (
          <ProfileViewerActions
            view={view}
            onSendFriendRequest={props.onSendFriendRequest}
            onAcceptFriendRequest={props.onAcceptFriendRequest}
            onRequestContactAccess={props.onRequestContactAccess}
          />
        )}
      </div>
    </header>
  );
}
