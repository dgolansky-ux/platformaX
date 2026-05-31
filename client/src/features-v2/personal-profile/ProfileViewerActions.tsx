import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import styles from "./PersonalProfilePage.module.css";

type Props = {
  view: PersonalProfileViewDTO;
  onSendFriendRequest?: () => void;
  onAcceptFriendRequest?: () => void;
  onRequestContactAccess?: () => void;
};

export function ProfileViewerActions({
  view,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onRequestContactAccess,
}: Props) {
  if (view.viewerState.relation === "owner") return null;
  if (view.viewerState.relation === "unauthenticated") {
    return (
      <div className={styles.actionRow} role="group" aria-label="Akcje">
        <a href="/login" className={`${styles.btn} ${styles.btnPrimary}`}>
          Zaloguj się, żeby działać
        </a>
      </div>
    );
  }
  const actions = view.relationActions;
  return (
    <div className={styles.actionRow} role="group" aria-label="Akcje relacji">
      {actions.canAcceptFriendRequest ? (
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onAcceptFriendRequest}>
          Zaakceptuj zaproszenie
        </button>
      ) : null}
      {actions.canSendFriendRequest ? (
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={onSendFriendRequest}>
          Dodaj do znajomych
        </button>
      ) : null}
      {actions.canCancelFriendRequest && !actions.canAcceptFriendRequest ? (
        <span className={`${styles.btn} ${styles.btnGhost}`} aria-live="polite">
          Zaproszenie wysłane
        </span>
      ) : null}
      {view.viewerState.relation === "friend" ? (
        <span className={`${styles.btn} ${styles.btnGhost}`} aria-live="polite">
          Znajomi
        </span>
      ) : null}
      {actions.canRequestContactAccess && onRequestContactAccess ? (
        <button type="button" className={`${styles.btn} ${styles.btnGhost}`} onClick={onRequestContactAccess}>
          Poproś o kontakt
        </button>
      ) : null}
      {view.viewerState.relation === "contact_approved" ? (
        <span className={`${styles.btn} ${styles.btnGhost}`}>Kontakt zatwierdzony</span>
      ) : null}
    </div>
  );
}
