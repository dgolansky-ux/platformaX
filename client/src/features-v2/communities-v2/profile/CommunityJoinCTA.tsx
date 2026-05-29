/**
 * features-v2/communities-v2 / profile / CommunityJoinCTA
 *
 * Renders the right CTA(s) for the given viewer state. Pure presentational —
 * the parent shell owns the adapter calls and error handling.
 */
import { Link } from "react-router-dom";
import type { CommunityProfileDTO } from "@shared/contracts/communities";
import type { CommunityViewerStateDTO } from "@shared/contracts/communities-viewer";
import styles from "../CommunityProfile.module.css";

type Props = {
  profile: CommunityProfileDTO;
  viewer: CommunityViewerStateDTO;
  pending: boolean;
  onJoin: () => void;
  onRequestJoin: () => void;
  onCancelRequest: () => void;
  onLeave: () => void;
};

export function CommunityJoinCTA({
  profile,
  viewer,
  pending,
  onJoin,
  onRequestJoin,
  onCancelRequest,
  onLeave,
}: Props) {
  if (viewer.canManage) {
    return (
      <div className={styles.actionBar} role="group" aria-label="Akcje społeczności">
        <Link to={`/communities/${profile.slug}/manage`} className={styles.primaryButton}>
          Zarządzaj
        </Link>
      </div>
    );
  }
  if (viewer.relation === "moderator" || viewer.relation === "admin" || viewer.relation === "member") {
    return (
      <div className={styles.actionBar} role="group" aria-label="Akcje społeczności">
        <span className={styles.membershipBadge}>Jesteś członkiem</span>
        {viewer.canLeave ? (
          <button type="button" className={styles.dangerButton} onClick={onLeave} disabled={pending}>
            Opuść
          </button>
        ) : null}
      </div>
    );
  }
  if (viewer.relation === "pending_request") {
    return (
      <div className={styles.actionBar} role="group" aria-label="Akcje społeczności">
        <span className={styles.pendingBadge}>⏳ Prośba oczekuje na akceptację</span>
        {viewer.canCancelRequest ? (
          <button type="button" className={styles.secondaryButton} onClick={onCancelRequest} disabled={pending}>
            Anuluj prośbę
          </button>
        ) : null}
      </div>
    );
  }
  return (
    <div className={styles.actionBar} role="group" aria-label="Akcje społeczności">
      {viewer.canJoin ? (
        <button type="button" className={styles.primaryButton} onClick={onJoin} disabled={pending}>
          + Dołącz do społeczności
        </button>
      ) : null}
      {viewer.canRequestJoin ? (
        <button type="button" className={styles.primaryButton} onClick={onRequestJoin} disabled={pending}>
          ✋ Poproś o dołączenie
        </button>
      ) : null}
    </div>
  );
}
