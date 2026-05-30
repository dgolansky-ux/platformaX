import type { FriendCardModel } from "./types";
import { RelationshipActionButton } from "./RelationshipActionButton";
import styles from "./Friends.module.css";

type Props = {
  model: FriendCardModel;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
};

function statusLabel(status: FriendCardModel["relationship"]): string {
  if (status === "friend") return "Znajomy";
  if (status === "pending_sent") return "Oczekuje";
  if (status === "pending_received") return "Zaproszenie od tej osoby";
  return "Zablokowany";
}

export function FriendCard({ model, onPrimaryAction, onSecondaryAction }: Props) {
  const primary =
    model.relationship === "friend"
      ? "Usuń ze znajomych"
      : model.relationship === "pending_received"
        ? "Akceptuj"
        : model.relationship === "pending_sent"
          ? "Cofnij zaproszenie"
          : "Odblokuj";
  const secondary =
    model.relationship === "pending_received" ? "Odrzuć" : "Zablokuj";

  return (
    <article className={styles.card}>
      <div className={styles.personRow}>
        <span className={styles.avatar}>{model.person.avatarInitial}</span>
        <div>
          <div className={styles.name}>{model.person.displayName}</div>
          <div className={styles.username}>@{model.person.username}</div>
        </div>
      </div>
      <span className={styles.badge}>{statusLabel(model.relationship)}</span>
      <div className={styles.actions}>
        <RelationshipActionButton label={primary} onClick={onPrimaryAction} />
        <RelationshipActionButton label={secondary} onClick={onSecondaryAction} />
      </div>
    </article>
  );
}
