import type { ReactElement } from "react";
import type {
  ContactPersonSummary,
  ContactRequest,
  ContactsTabData,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import { Avatar, EmptyState } from "./ContactsLists";
import styles from "./ContactsTab.module.css";

/**
 * The "Prośby" tab. Incoming friend invitations (consent flow) and incoming
 * contact requests (PII-reveal flow) are deliberately rendered as two
 * distinct kinds — they are different concepts, not one inbox.
 */
export function RequestsList({
  data,
  nameOf,
  onAcceptOpen,
  onReject,
}: {
  data: ContactsTabData;
  nameOf: (id: UserId) => ContactPersonSummary;
  onAcceptOpen: (req: ContactRequest) => void;
  onReject: (req: ContactRequest) => Promise<void> | void;
}): ReactElement {
  if (
    data.incomingContactRequests.length === 0 &&
    data.incomingFriendRequests.length === 0
  ) {
    return (
      <EmptyState
        emoji="📥"
        title="Brak nowych próśb"
        body="Tu pojawią się prośby o kontakt i zaproszenia do znajomych."
      />
    );
  }
  return (
    <ul className={styles.list}>
      {data.incomingFriendRequests.map((fr) => (
        <li key={fr.id} className={styles.card}>
          <Avatar label={nameOf(fr.fromUserId).avatarInitial} />
          <div className={styles.cardBody}>
            <p className={styles.cardName}>{nameOf(fr.fromUserId).displayName}</p>
            <p className={styles.cardCaption}>Chce dołączyć do znajomych</p>
          </div>
        </li>
      ))}
      {data.incomingContactRequests.map((cr) => (
        <li key={cr.id} className={styles.card}>
          <Avatar label={nameOf(cr.fromUserId).avatarInitial} />
          <div className={styles.cardBody}>
            <p className={styles.cardName}>{nameOf(cr.fromUserId).displayName}</p>
            {cr.purpose ? <p className={styles.cardCaption}>{cr.purpose}</p> : null}
            <p className={styles.cardMessage}>{cr.message}</p>
          </div>
          <div className={styles.cardActions}>
            <button
              type="button"
              className={styles.cardActionPrimary}
              onClick={() => onAcceptOpen(cr)}
            >
              Akceptuj
            </button>
            <button
              type="button"
              className={styles.cardAction}
              onClick={() => onReject(cr)}
            >
              Odrzuć
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
