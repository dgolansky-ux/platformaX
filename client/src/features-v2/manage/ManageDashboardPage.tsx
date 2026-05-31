/**
 * features-v2/manage — ManageDashboardPage (Slice 21).
 *
 * Owner-only dashboard composing 13 section cards from a Manage adapter.
 * No `@server/*` import. No localStorage. No fake save: when the adapter
 * returns OWNER_MISMATCH the page shows a real access-denied state.
 */
import { useEffect, useState } from "react";
import type {
  ManageDashboardAdapter,
  ManageDashboardDTO,
  ManageDashboardError,
} from "./types";
import { ManageSectionCard } from "./ManageSectionCard";
import styles from "./Manage.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; error: ManageDashboardError }
  | { status: "ready"; dto: ManageDashboardDTO };

interface Props {
  viewerUserId: string;
  ownerUserId: string;
  adapter: ManageDashboardAdapter;
  onNavigate(route: string): void;
}

export function ManageDashboardPage({ viewerUserId, ownerUserId, adapter, onNavigate }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await adapter.getManageDashboardView(viewerUserId, ownerUserId);
      if (cancelled) return;
      if (!res.ok) {
        setState({ status: "error", error: res.error });
        return;
      }
      setState({ status: "ready", dto: res.value });
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter, viewerUserId, ownerUserId]);

  if (state.status === "loading") {
    return (
      <section className={styles.root} aria-busy="true">
        <header className={styles.header}>
          <p className={styles.headerKicker}>Twoje konto</p>
          <h1 className={styles.headerTitle}>Zarządzaj</h1>
        </header>
        <div className={styles.loading} role="status">Ładowanie panelu zarządzania…</div>
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className={styles.root}>
        <header className={styles.header}>
          <p className={styles.headerKicker}>Twoje konto</p>
          <h1 className={styles.headerTitle}>Zarządzaj</h1>
        </header>
        <div className={styles.errorBanner} role="alert">
          {state.error.code === "OWNER_MISMATCH"
            ? "Brak dostępu — panel zarządzania jest tylko dla właściciela profilu."
            : state.error.code === "UNAUTHENTICATED"
              ? "Zaloguj się, aby zobaczyć panel zarządzania."
              : state.error.message}
        </div>
      </section>
    );
  }

  const { dto } = state;
  return (
    <section className={styles.root} aria-labelledby="manage-heading">
      <header className={styles.header}>
        <p className={styles.headerKicker}>Twoje konto</p>
        <h1 id="manage-heading" className={styles.headerTitle}>Zarządzaj</h1>
        <p className={styles.headerLead}>
          Centralne miejsce do zarządzania kontem, profilem, prywatnością, kontaktem,
          znajomymi, powiadomieniami, mediami, warstwą zawodową, miejscami pracy,
          modułami, kanałami, społecznościami i bezpieczeństwem.
        </p>
        {dto.header.runtimeBackend === "mock" ? (
          <span className={styles.runtimeBadge} role="note">
            Tryb demo — zmiany ustawień nie są jeszcze zapisywane na serwerze
          </span>
        ) : null}
      </header>

      <ul className={styles.grid} aria-label="Sekcje zarządzania" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {dto.sections.map((section) => (
          <li key={section.key}>
            <ManageSectionCard section={section} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </section>
  );
}
