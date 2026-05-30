/**
 * features-v2/manage — ManageSectionCard.
 *
 * Single dashboard tile: title, description, summary items, optional
 * warnings, primary CTA + secondary actions. Status comes from the DTO and
 * is rendered via ManageStatusBadge — never invented client-side.
 */
import { memo, type ReactElement } from "react";
import type { ManageSection } from "./types";
import { ManageStatusBadge } from "./ManageStatusBadge";
import styles from "./Manage.module.css";

interface Props {
  section: ManageSection;
  onNavigate(route: string): void;
}

function Action({
  label,
  onClick,
  variant,
  disabled,
  disabledReason,
}: {
  label: string;
  onClick(): void;
  variant: "primary" | "secondary";
  disabled?: boolean;
  disabledReason?: string;
}): ReactElement {
  const className = variant === "primary" ? styles.btnPrimary : styles.btnSecondary;
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      title={disabled ? disabledReason : undefined}
      aria-disabled={disabled ? "true" : undefined}
    >
      {label}
      {disabled && disabledReason ? <span aria-hidden="true"> · {disabledReason}</span> : null}
    </button>
  );
}

export const ManageSectionCard = memo(function ManageSectionCard({ section, onNavigate }: Props): ReactElement {
  return (
    <article className={styles.card} aria-labelledby={`manage-card-${section.key}-title`}>
      <header className={styles.cardHeader}>
        <div>
          <h2 id={`manage-card-${section.key}-title`} className={styles.cardTitle}>
            {section.title}
          </h2>
          <p className={styles.cardDesc}>{section.description}</p>
        </div>
        <ManageStatusBadge status={section.status} />
      </header>

      {section.summaryItems.length > 0 ? (
        <ul className={styles.summaryList} aria-label="Podsumowanie sekcji">
          {section.summaryItems.map((item) => (
            <li key={item.label} className={styles.summaryItem}>
              <span className={styles.summaryLabel}>{item.label}</span>
              <span className={styles.summaryValue}>{item.value}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.warnings.length > 0 ? (
        <ul className={styles.warnings} aria-label="Ostrzeżenia sekcji" role="status">
          {section.warnings.map((w, i) => (
            <li key={`${section.key}-warn-${i}`}>{w}</li>
          ))}
        </ul>
      ) : null}

      <div className={styles.actions}>
        <Action
          label={section.primaryAction.label}
          onClick={() => {
            if (!section.primaryAction.disabled) onNavigate(section.primaryAction.routeTarget);
          }}
          variant={section.primaryAction.variant}
          disabled={section.primaryAction.disabled}
          disabledReason={section.primaryAction.disabledReason}
        />
        {section.secondaryActions.map((a) => (
          <Action
            key={a.routeTarget + a.label}
            label={a.label}
            onClick={() => {
              if (!a.disabled) onNavigate(a.routeTarget);
            }}
            variant={a.variant}
            disabled={a.disabled}
            disabledReason={a.disabledReason}
          />
        ))}
      </div>
    </article>
  );
});
