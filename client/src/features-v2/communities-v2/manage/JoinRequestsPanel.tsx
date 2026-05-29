import type { CommunityJoinRequestSummaryDTO } from "@shared/contracts/communities";
import styles from "../CommunityManage.module.css";

export type JoinRequestsPanelProps = {
  requests: readonly CommunityJoinRequestSummaryDTO[];
  onAccept: (requestId: string) => Promise<void>;
  onReject: (requestId: string) => Promise<void>;
};

export function JoinRequestsPanel({ requests, onAccept, onReject }: JoinRequestsPanelProps) {
  return (
    <section className={styles.panel} aria-labelledby="requests-heading">
      <h2 id="requests-heading" className={styles.panelTitle}>Prośby o dołączenie</h2>
      {requests.length === 0 ? (
        <p className={styles.empty}>Brak oczekujących zgłoszeń.</p>
      ) : (
        <ul className={styles.list}>
          {requests.map((req) => (
            <li key={req.id} className={styles.listItem}>
              <div>
                <p className={styles.listItemTitle}>{req.requesterDisplayName}</p>
                <p className={styles.listItemMeta}>
                  Wysłano: {new Date(req.createdAt).toLocaleDateString("pl-PL")}
                </p>
              </div>
              <div className={styles.listItemActions}>
                <button type="button" className={styles.primaryButton} onClick={() => void onAccept(req.id)}>
                  Akceptuj
                </button>
                <button type="button" className={styles.secondaryButton} onClick={() => void onReject(req.id)}>
                  Odrzuć
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
