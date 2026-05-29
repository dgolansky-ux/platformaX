import type { ReactElement } from "react";
import {
  FRIEND_CIRCLE_VALUES,
  type ContactListItemDTO,
  type ContactPersonSummary,
  type FriendCircle,
} from "@shared/contracts/contacts";
import type { UserId } from "@shared/contracts/branded-ids";
import styles from "./ContactsLists.module.css";

const CIRCLE_LABEL: Record<FriendCircle, string> = {
  close_friend: "Bliższy znajomy",
  distant_friend: "Dalszy znajomy",
  close_family: "Rodzina bliska",
  distant_family: "Rodzina dalsza",
  none: "Bez kręgu",
};

function initials(id: UserId | string): string {
  const s = String(id);
  return s.replace(/^u-?/, "").slice(0, 2).toUpperCase() || "??";
}

export function Avatar({ label }: { label: string }): ReactElement {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {label}
    </span>
  );
}

export function EmptyState({
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

function CircleSelect({
  value,
  onChange,
}: {
  value: FriendCircle;
  onChange: (next: FriendCircle) => void;
}): ReactElement {
  return (
    <label className={styles.circleSelect}>
      <span className={styles.srOnly}>Krąg</span>
      <select
        className={styles.circleSelectInput}
        value={value}
        onChange={(e) => onChange(e.target.value as FriendCircle)}
      >
        <option value="none">{CIRCLE_LABEL.none}</option>
        {FRIEND_CIRCLE_VALUES.map((c) => (
          <option key={c} value={c}>
            {CIRCLE_LABEL[c]}
          </option>
        ))}
      </select>
    </label>
  );
}

function PersonCard({
  item,
  onOpen,
  onRemoveContact,
  onRemoveSpecialist,
  onSetCircle,
}: {
  item: ContactListItemDTO;
  onOpen: (summary: ContactPersonSummary) => void;
  onRemoveContact: (id: UserId) => void;
  onRemoveSpecialist: (id: UserId) => void;
  onSetCircle: (id: UserId, circle: FriendCircle) => void;
}): ReactElement {
  const { person } = item;
  const caption = person.professionName ?? `@${person.handle}`;
  return (
    <li className={styles.card}>
      <Avatar label={person.avatarInitial || initials(person.userId)} />
      <div className={styles.cardBody}>
        <button type="button" className={styles.cardNameButton} onClick={() => onOpen(person)}>
          {person.displayName}
        </button>
        <p className={styles.cardCaption}>{caption}</p>
        <div className={styles.badges}>
          {item.isMutualFriend ? <span className={styles.badge}>Znajomy</span> : null}
          {item.isAddressBookContact ? <span className={styles.badge}>Kontakt</span> : null}
          {item.isSpecialist ? <span className={styles.badgeSpecialist}>Specjalista</span> : null}
          {item.friendCircle !== "none" ? (
            <span className={styles.badgeCircle}>{CIRCLE_LABEL[item.friendCircle]}</span>
          ) : null}
        </div>
      </div>
      <div className={styles.cardActions}>
        <button type="button" className={styles.cardAction} onClick={() => onOpen(person)}>
          Szczegóły
        </button>
        <CircleSelect
          value={item.friendCircle}
          onChange={(next) => onSetCircle(person.userId, next)}
        />
        {item.isAddressBookContact ? (
          <button
            type="button"
            className={styles.cardAction}
            onClick={() => onRemoveContact(person.userId)}
          >
            Usuń z kontaktów
          </button>
        ) : null}
        {item.isSpecialist ? (
          <button
            type="button"
            className={styles.cardAction}
            onClick={() => onRemoveSpecialist(person.userId)}
          >
            Usuń ze specjalistów
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function PeopleList({
  items,
  empty,
  onOpen,
  onRemoveContact,
  onRemoveSpecialist,
  onSetCircle,
}: {
  items: readonly ContactListItemDTO[];
  empty: { emoji: string; title: string; body: string };
  onOpen: (summary: ContactPersonSummary) => void;
  onRemoveContact: (id: UserId) => void;
  onRemoveSpecialist: (id: UserId) => void;
  onSetCircle: (id: UserId, circle: FriendCircle) => void;
}): ReactElement {
  if (items.length === 0) {
    return <EmptyState emoji={empty.emoji} title={empty.title} body={empty.body} />;
  }
  return (
    <ul className={styles.list}>
      {items.map((item) => (
        <PersonCard
          key={item.person.userId}
          item={item}
          onOpen={onOpen}
          onRemoveContact={onRemoveContact}
          onRemoveSpecialist={onRemoveSpecialist}
          onSetCircle={onSetCircle}
        />
      ))}
    </ul>
  );
}
