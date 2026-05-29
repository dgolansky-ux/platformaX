import type { ReactElement } from "react";
import type {
  ContactRequest,
  ContactsTabData,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import styles from "./ContactsTab.module.css";

function initials(id: UserId | string): string {
  const s = String(id);
  return s.replace(/^u-?/, "").slice(0, 2).toUpperCase() || "??";
}

function Avatar({ label }: { label: string }): ReactElement {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {label}
    </span>
  );
}

function EmptyState({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}): ReactElement {
  return (
    <div className={styles.emptyState}>
      <span className={styles.emptyEmoji} aria-hidden="true">
        {emoji}
      </span>
      <p className={styles.emptyTitle}>{title}</p>
      <p className={styles.emptyBody}>{body}</p>
    </div>
  );
}

export function FriendList({ data }: { data: ContactsTabData }): ReactElement {
  if (data.friends.length === 0) {
    return (
      <EmptyState
        emoji="👋"
        title="Nie masz jeszcze znajomych"
        body="Znajdź osoby które znasz i zaproś je do znajomych."
      />
    );
  }
  return (
    <ul className={styles.list}>
      {data.friends.map((f) => (
        <li key={f.friendId} className={styles.card}>
          <Avatar label={initials(f.friendId)} />
          <div className={styles.cardBody}>
            <p className={styles.cardName}>{f.friendId}</p>
            <p className={styles.cardCaption}>Znajomy od {f.acceptedAt}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ContactList({
  data,
  onRemove,
}: {
  data: ContactsTabData;
  onRemove: (contactId: UserId) => Promise<void> | void;
}): ReactElement {
  if (data.contacts.length === 0) {
    return (
      <EmptyState
        emoji="📇"
        title="Brak zapisanych kontaktów"
        body="Dodaj osoby do kontaktów aby mieć szybki dostęp do ich profilu."
      />
    );
  }
  return (
    <ul className={styles.list}>
      {data.contacts.map((c) => (
        <li key={c.contactId} className={styles.card}>
          <Avatar label={initials(c.contactId)} />
          <div className={styles.cardBody}>
            <p className={styles.cardName}>{c.contactId}</p>
            <p className={styles.cardCaption}>Dodano {c.addedAt}</p>
          </div>
          <button
            type="button"
            className={styles.cardAction}
            onClick={() => onRemove(c.contactId)}
            aria-label={`Usuń ${c.contactId} z kontaktów`}
          >
            Usuń
          </button>
        </li>
      ))}
    </ul>
  );
}

export function SpecialistList({
  data,
  onRemove,
}: {
  data: ContactsTabData;
  onRemove: (specialistId: UserId) => Promise<void> | void;
}): ReactElement {
  if (data.specialists.length === 0) {
    return (
      <EmptyState
        emoji="🩺"
        title="Brak specjalistów"
        body="Dodaj specjalistów z wyszukiwarki."
      />
    );
  }
  return (
    <ul className={styles.list}>
      {data.specialists.map((s) => (
        <li key={s.specialistId} className={styles.card}>
          <Avatar label={initials(s.specialistId)} />
          <div className={styles.cardBody}>
            <p className={styles.cardName}>{s.specialistId}</p>
            <p className={styles.cardCaption}>Specjalista od {s.addedAt}</p>
          </div>
          <button
            type="button"
            className={styles.cardAction}
            onClick={() => onRemove(s.specialistId)}
            aria-label={`Usuń ${s.specialistId} ze specjalistów`}
          >
            Usuń
          </button>
        </li>
      ))}
    </ul>
  );
}

export function RequestsList({
  data,
  onAcceptOpen,
  onReject,
}: {
  data: ContactsTabData;
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
          <Avatar label={initials(fr.fromUserId)} />
          <div className={styles.cardBody}>
            <p className={styles.cardName}>{fr.fromUserId}</p>
            <p className={styles.cardCaption}>Chce dołączyć do znajomych</p>
          </div>
        </li>
      ))}
      {data.incomingContactRequests.map((cr) => (
        <li key={cr.id} className={styles.card}>
          <Avatar label={initials(cr.fromUserId)} />
          <div className={styles.cardBody}>
            <p className={styles.cardName}>{cr.fromUserId}</p>
            {cr.purpose ? (
              <p className={styles.cardCaption}>{cr.purpose}</p>
            ) : null}
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
