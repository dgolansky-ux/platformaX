import { useState } from "react";
import type { ContactAccessField, ContactRequestCardModel } from "./types";
import { ContactAccessFieldsSelector } from "./ContactAccessFieldsSelector";
import { RelationshipActionButton } from "./RelationshipActionButton";
import styles from "./Friends.module.css";

type Props = {
  model: ContactRequestCardModel;
};

export function ContactRequestCard({ model }: Props) {
  const [selected, setSelected] = useState<readonly ContactAccessField[]>(
    model.approvedFields,
  );
  return (
    <article className={styles.card}>
      <div className={styles.personRow}>
        <span className={styles.avatar}>{model.requester.avatarInitial}</span>
        <div>
          <div className={styles.name}>{model.requester.displayName}</div>
          <div className={styles.username}>@{model.requester.username}</div>
        </div>
      </div>
      <span className={styles.badge}>Prośba o kontakt ({model.status})</span>
      {model.message ? <div>{model.message}</div> : null}
      <ContactAccessFieldsSelector
        selected={selected}
        onChange={(next) => setSelected(next)}
      />
      <div className={styles.actions}>
        <RelationshipActionButton label="Zatwierdź pola" />
        <RelationshipActionButton label="Odrzuć" />
      </div>
    </article>
  );
}
