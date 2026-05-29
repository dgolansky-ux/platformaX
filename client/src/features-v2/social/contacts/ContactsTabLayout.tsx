import type { ReactElement, ReactNode } from "react";
import {
  CONTACTS_TAB_LABELS,
  type ContactsTabKey,
} from "./ContactsTabBar";
import styles from "./ContactsTab.module.css";

type ContactsTabCounts = Record<ContactsTabKey, number>;

export type ContactsDashboardStat = { key: string; value: number; label: string };

export function ContactsHero({
  stats,
}: {
  stats: readonly ContactsDashboardStat[];
}): ReactElement {
  return (
    <header className={styles.hero}>
      <div className={styles.heroIntro}>
        <p className={styles.brand}>PlatformaX</p>
        <h1 id="contacts-heading" className={styles.title}>
          Kontakty
        </h1>
        <p className={styles.modeNote} title="MOCK_LOCAL_ONLY — patrz README.md">
          Zarządzaj osobami, specjalistami i prywatnymi kręgami w jednym,
          spokojnym widoku.
        </p>
      </div>
      <div className={styles.summaryGrid} aria-label="Podsumowanie kontaktów">
        {stats.map((s) => (
          <SummaryCard key={s.key} value={s.value} label={s.label} />
        ))}
      </div>
    </header>
  );
}

export function ContactsContentPanel({
  activeTab,
  counts,
  children,
}: {
  activeTab: ContactsTabKey;
  counts: ContactsTabCounts;
  children: ReactNode;
}): ReactElement {
  const activeTabLabel = CONTACTS_TAB_LABELS[activeTab];
  return (
    <section className={styles.contentPanel} aria-label={activeTabLabel}>
      <div className={styles.sectionHeader}>
        <div>
          <p className={styles.sectionKicker}>Aktualna sekcja</p>
          <h2 className={styles.sectionTitle}>{activeTabLabel}</h2>
        </div>
        <span className={styles.sectionCount}>{counts[activeTab]}</span>
      </div>
      {children}
    </section>
  );
}

function SummaryCard({
  value,
  label,
}: {
  value: number;
  label: string;
}): ReactElement {
  return (
    <div className={styles.summaryCard}>
      <span className={styles.summaryValue}>{value}</span>
      <span className={styles.summaryLabel}>{label}</span>
    </div>
  );
}
