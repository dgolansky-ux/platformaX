import type { ReactElement } from "react";
import type {
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

/**
 * Compact profile-side contact CTA. Embeddable on a public profile: shows the
 * viewer's relationship to the profile owner, the policy-filtered visible
 * fields, and the available actions. No avatar/name header — the profile page
 * already renders that. Pure presentation; actions flow through `onAction`.
 */
export function ProfileContactCard({
  relationship,
  onAction,
}: {
  relationship: ContactProfileRelationshipDTO;
  onAction: (action: ContactProfileAction) => void;
}): ReactElement {
  const status = contactStatusView(relationship);
  return (
    <section className={styles.panel} aria-label="Kontakt i relacja">
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
    </section>
  );
}
