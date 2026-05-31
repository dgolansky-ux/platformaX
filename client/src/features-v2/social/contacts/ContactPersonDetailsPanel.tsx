import type { ReactElement } from "react";
import type {
  ContactPersonSummary,
  ContactProfileAction,
  ContactProfileRelationshipDTO,
} from "@shared/contracts/contacts";
import {
  ACTION_LABELS,
  ContactVisibleFieldsList,
  RelationshipBadges,
  actionClassName,
  contactStatusView,
} from "./ContactRelationshipBits";
import styles from "./ContactDetails.module.css";

export function ContactPersonDetailsPanel({
  summary,
  relationship,
  onAction,
  onClose,
}: {
  summary: ContactPersonSummary;
  relationship: ContactProfileRelationshipDTO;
  onAction: (action: ContactProfileAction) => void;
  onClose?: () => void;
}): ReactElement {
  const status = contactStatusView(relationship);
  const headline = summary.professionName ?? `@${summary.handle}`;
  return (
    <aside className={styles.panel} aria-label={`Szczegóły: ${summary.displayName}`}>
      <div className={styles.header}>
        <span className={styles.avatar} aria-hidden="true">
          {summary.avatarInitial}
        </span>
        <div className={styles.headerText}>
          <h3 className={styles.name}>{summary.displayName}</h3>
          <p className={styles.headline}>{headline}</p>
        </div>
        {onClose ? (
          <button type="button" className={styles.close} onClick={onClose} aria-label="Zamknij szczegóły">
            ✕
          </button>
        ) : null}
      </div>

      <RelationshipBadges rel={relationship} />

      <div className={styles.statusRow}>
        <span className={status.className}>{status.label}</span>
      </div>

      <ContactVisibleFieldsList fields={relationship.visibleContactFields} />

      <div className={styles.actions}>
        {relationship.availableActions.map((action) => (
          <button
            key={action}
            type="button"
            className={actionClassName(action)}
            onClick={() => onAction(action)}
          >
            {ACTION_LABELS[action]}
          </button>
        ))}
      </div>
    </aside>
  );
}
