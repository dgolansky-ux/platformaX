import type { ReactElement } from "react";
import type {
  ApprovedContactField,
  ContactProfileAction,
  ContactProfileRelationshipDTO,
  FriendCircle,
  VisibleContactFieldsDTO,
} from "@shared/contracts/contacts";
import styles from "./ContactDetails.module.css";

/** Polish labels for the contact-field enum (shared by the grant modal). */
export const FIELD_LABELS: Record<ApprovedContactField, string> = {
  phone: "Telefon",
  emailContact: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  website: "Strona WWW",
};

const CIRCLE_LABEL: Record<FriendCircle, string> = {
  close_friend: "Bliższy znajomy",
  distant_friend: "Dalszy znajomy",
  close_family: "Rodzina bliska",
  distant_family: "Rodzina dalsza",
  none: "Bez kręgu",
};

export const ACTION_LABELS: Record<ContactProfileAction, string> = {
  REQUEST_CONTACT: "Poproś o kontakt",
  RESPOND_TO_CONTACT_REQUEST: "Odpowiedz na prośbę",
  ADD_TO_CONTACTS: "Dodaj do kontaktów",
  REMOVE_FROM_CONTACTS: "Usuń z kontaktów",
  ADD_AS_SPECIALIST: "Dodaj jako specjalistę",
  REMOVE_SPECIALIST: "Usuń ze specjalistów",
  SEND_FRIEND_REQUEST: "Zaproś do znajomych",
  RESPOND_TO_FRIEND_REQUEST: "Odpowiedz na zaproszenie",
  REMOVE_FRIEND: "Usuń znajomego",
};

const PRIMARY_ACTIONS = new Set<ContactProfileAction>([
  "REQUEST_CONTACT",
  "SEND_FRIEND_REQUEST",
  "RESPOND_TO_CONTACT_REQUEST",
  "RESPOND_TO_FRIEND_REQUEST",
]);
const DANGER_ACTIONS = new Set<ContactProfileAction>([
  "REMOVE_FROM_CONTACTS",
  "REMOVE_SPECIALIST",
  "REMOVE_FRIEND",
]);

export function actionClassName(action: ContactProfileAction): string {
  if (PRIMARY_ACTIONS.has(action)) return `${styles.action} ${styles.actionPrimary}`;
  if (DANGER_ACTIONS.has(action)) return `${styles.action} ${styles.actionDanger}`;
  return styles.action;
}

/** Human-readable relationship status derived purely from the safe DTO. */
export function contactStatusView(rel: ContactProfileRelationshipDTO): {
  label: string;
  className: string;
} {
  if (Object.keys(rel.visibleContactFields).length > 0) {
    return { label: "Masz dostęp do kontaktu", className: `${styles.statusPill} ${styles.statusOk}` };
  }
  if (rel.availableActions.includes("RESPOND_TO_CONTACT_REQUEST")) {
    return { label: "Prośba o kontakt otrzymana", className: `${styles.statusPill} ${styles.statusPending}` };
  }
  if (rel.contactRequestStatus === "pending") {
    return { label: "Prośba o kontakt wysłana", className: `${styles.statusPill} ${styles.statusPending}` };
  }
  return { label: "Brak dostępu do danych kontaktowych", className: `${styles.statusPill} ${styles.statusNone}` };
}

export function RelationshipBadge({
  kind,
  circle,
}: {
  kind: "friend" | "contact" | "specialist" | "circle";
  circle?: FriendCircle;
}): ReactElement {
  if (kind === "friend") return <span className={`${styles.badge} ${styles.badgeFriend}`}>Znajomy</span>;
  if (kind === "contact") return <span className={styles.badge}>Kontakt</span>;
  if (kind === "specialist") return <span className={`${styles.badge} ${styles.badgeSpecialist}`}>Specjalista</span>;
  return <span className={`${styles.badge} ${styles.badgeCircle}`}>{CIRCLE_LABEL[circle ?? "none"]}</span>;
}

export function RelationshipBadges({
  rel,
}: {
  rel: ContactProfileRelationshipDTO;
}): ReactElement {
  return (
    <div className={styles.badges}>
      {rel.isMutualFriend ? <RelationshipBadge kind="friend" /> : null}
      {rel.isAddressBookContact ? <RelationshipBadge kind="contact" /> : null}
      {rel.isSpecialist ? <RelationshipBadge kind="specialist" /> : null}
      {rel.friendCircle !== "none" ? (
        <RelationshipBadge kind="circle" circle={rel.friendCircle} />
      ) : null}
    </div>
  );
}

/** Renders ONLY the policy-approved fields; empty map = explicit no-access. */
export function ContactVisibleFieldsList({
  fields,
}: {
  fields: VisibleContactFieldsDTO["fields"];
}): ReactElement {
  const entries = Object.entries(fields) as [ApprovedContactField, string][];
  if (entries.length === 0) {
    return (
      <p className={styles.fieldsEmpty}>
        Brak dostępu do danych kontaktowych — wymagana zaakceptowana prośba o kontakt.
      </p>
    );
  }
  return (
    <ul className={styles.fields}>
      <li className={styles.fieldsTitle}>Udostępnione dane kontaktowe</li>
      {entries.map(([key, value]) => (
        <li key={key} className={styles.fieldRow}>
          <span className={styles.fieldKey}>{FIELD_LABELS[key]}</span>
          <span className={styles.fieldVal}>{value}</span>
        </li>
      ))}
    </ul>
  );
}
