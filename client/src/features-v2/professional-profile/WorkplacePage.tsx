/**
 * features-v2/professional-profile / WorkplacePage — UI_SHELL_ONLY.
 *
 * Composes hero, contact panel, owner actions, description and the
 * workplace micro-feed for a single workplace. Reaches the mock adapter
 * directly (no `@server/*`).
 */
import { useCallback, useEffect, useState } from "react";
import { professionalProfileMockAdapter } from "./mock-adapter";
import type { WorkplacePageUi } from "./types";
import { WorkplaceMicroFeed } from "./WorkplaceMicroFeed";
import styles from "./Workplace.module.css";

type Props = {
  viewerUserId: string;
  ownerUserId: string;
  workplaceSlug: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: WorkplacePageUi };

const CONTACT_VISIBILITY_LABEL: Record<WorkplacePageUi["contact"]["visibility"], string> = {
  owner_only: "Tylko właściciel",
  friends: "Znajomi",
  approved_contact_fields: "Osoby z zaakceptowaną zgodą kontaktową",
  public: "Publicznie",
};

function initials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function WorkplacePage({ viewerUserId, ownerUserId, workplaceSlug }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await professionalProfileMockAdapter.getWorkplacePageBySlug(
      viewerUserId,
      ownerUserId,
      workplaceSlug,
    );
    if (!res.ok) {
      setState({ status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", page: res.value });
  }, [viewerUserId, ownerUserId, workplaceSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <p className={styles.loading} aria-busy="true">Ładuję miejsce pracy…</p>;
  }
  if (state.status === "error") {
    return (
      <section className={styles.root}>
        <p className={styles.errorBanner} role="alert">{state.message}</p>
      </section>
    );
  }

  const { workplace, owner, contact, viewerState } = state.page;
  const statusChipClass = workplace.status === "archived"
    ? `${styles.statusChip} ${styles.statusChipArchived}`
    : styles.statusChip;

  return (
    <article className={styles.root} aria-labelledby="workplace-page-title">
      <header className={styles.header}>
        <p className={styles.kicker}>Miejsce pracy</p>
        <h1 id="workplace-page-title" className={styles.title}>{workplace.name}</h1>
        {workplace.headline ? <p className={styles.subtitle}>{workplace.headline}</p> : null}
      </header>

      <section className={styles.heroCard}>
        <div className={styles.heroBanner} aria-hidden="true" />
        <div className={styles.heroTop}>
          <span className={styles.logo} aria-hidden="true">{initials(workplace.name)}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className={styles.heroTitle}>{workplace.name}</p>
            <p className={styles.heroHeadline}>{owner.displayName}{owner.handle ? ` · @${owner.handle}` : ""}</p>
          </div>
          <span className={statusChipClass}>{workplace.status}</span>
        </div>
        <div>
          <span className={styles.visibilityChip}>
            Widoczność: {workplace.visibility === "public" ? "publiczna" : workplace.visibility === "friends_only" ? "tylko znajomi" : "prywatna"}
          </span>
          {workplace.onlineAvailable ? (
            <span className={styles.visibilityChip} style={{ marginLeft: 6 }}>Online</span>
          ) : null}
        </div>
      </section>

      {workplace.description ? (
        <section className={styles.section} aria-labelledby="workplace-description-title">
          <h2 id="workplace-description-title" className={styles.sectionTitle}>O miejscu pracy</h2>
          <p className={styles.description}>{workplace.description}</p>
        </section>
      ) : null}

      <section className={styles.section} aria-labelledby="workplace-contact-title">
        <h2 id="workplace-contact-title" className={styles.sectionTitle}>Kontakt</h2>
        {contact.websiteUrl ? (
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Strona www</span>
            <a className={styles.contactLink} href={contact.websiteUrl} rel="noopener noreferrer" target="_blank">
              {contact.websiteUrl}
            </a>
          </div>
        ) : null}
        {contact.contactEmail ? (
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Email</span>
            <span className={styles.contactValue}>{contact.contactEmail}</span>
          </div>
        ) : null}
        {contact.contactPhone ? (
          <div className={styles.contactRow}>
            <span className={styles.contactLabel}>Telefon</span>
            <span className={styles.contactValue}>{contact.contactPhone}</span>
          </div>
        ) : null}
        {!contact.viewerCanContact && contact.contactEmail === null && contact.contactPhone === null ? (
          <p className={styles.contactMuted}>
            Dane kontaktowe dostępne po zgodzie właściciela ({CONTACT_VISIBILITY_LABEL[contact.visibility]}).
          </p>
        ) : null}
      </section>

      {viewerState.isOwner ? (
        <section className={styles.section} aria-labelledby="workplace-owner-actions-title">
          <h2 id="workplace-owner-actions-title" className={styles.sectionTitle}>Akcje właściciela</h2>
          <div className={styles.ownerActions}>
            <button type="button" className={styles.button} disabled>Edytuj (wkrótce)</button>
            <button type="button" className={styles.button} disabled>Archiwizuj (wkrótce)</button>
            <button type="button" className={styles.button} disabled>Zarządzaj widocznością (wkrótce)</button>
          </div>
        </section>
      ) : null}

      <WorkplaceMicroFeed
        viewerUserId={viewerUserId}
        workplaceId={workplace.id}
        viewerState={viewerState}
      />
    </article>
  );
}
