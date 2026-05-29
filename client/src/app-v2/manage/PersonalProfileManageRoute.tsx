/**
 * app-v2/manage/PersonalProfileManageRoute — "Zarządzaj → Zarządzaj profilem
 * osobistym".
 *
 * This screen manages ADMIN / CONTACT / PRIVACY data — NOT the profile's
 * appearance. Avatar, banner and bio are edited directly on the personal
 * profile (/profile). Profile-update transport is not wired yet, so inputs are
 * disabled and there is no fake save (truthful TRANSPORT_PARTIAL / UI_SHELL).
 * Contact fields are owner-private (identity) — no PII is rendered here.
 */
import { Link } from "react-router-dom";
import type { ReactElement } from "react";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import layout from "./ManageLayout.module.css";
import styles from "./PersonalProfileManage.module.css";

function DisabledField({ label, placeholder }: { label: string; placeholder: string }): ReactElement {
  return (
    <label className={styles.field}>
      <span className={styles.label}>{label}</span>
      <input className={styles.input} value="" placeholder={placeholder} disabled readOnly />
    </label>
  );
}

export function PersonalProfileManageRoute(): ReactElement {
  return (
    <div className={layout.page}>
      <DesktopSidebar active="zarzadzaj" displayName="Demo użytkownik" handle="demo" avatarInitial="D" />
      <main className={layout.content}>
        <section className={styles.root} aria-labelledby="ppm-heading">
          <header className={styles.header}>
            <h1 id="ppm-heading" className={styles.title}>Zarządzaj profilem osobistym</h1>
            <p className={styles.lead}>
              Dane podstawowe, kontaktowe i prywatność. Zdjęcie, baner i opis
              edytujesz bezpośrednio na swoim profilu osobistym.
            </p>
            <div className={styles.statusRow}>
              <span className={styles.statusPill}>
                Zapis dostępny po podłączeniu transportu (PARTIAL)
              </span>
            </div>
          </header>

          <section className={styles.panel} aria-label="Dane podstawowe">
            <h2 className={styles.sectionTitle}>Dane podstawowe</h2>
            <div className={styles.fieldGrid}>
              <DisabledField label="Imię" placeholder="Imię" />
              <DisabledField label="Nazwisko" placeholder="Nazwisko" />
              <DisabledField label="Nazwa profilu" placeholder="Nazwa profilu" />
              <DisabledField label="@username" placeholder="@username" />
            </div>
          </section>

          <section className={styles.panel} aria-label="Dane kontaktowe">
            <h2 className={styles.sectionTitle}>Dane kontaktowe</h2>
            <p className={styles.sectionHint}>
              Dane kontaktowe są prywatne (domena identity) i nigdy nie trafiają
              do publicznego profilu bez Twojej zgody.
            </p>
            <div className={styles.fieldGrid}>
              <DisabledField label="Email" placeholder="adres email" />
              <DisabledField label="Telefon" placeholder="numer telefonu" />
            </div>
          </section>

          <section className={styles.panel} aria-label="Widoczność kontaktu">
            <h2 className={styles.sectionTitle}>Widoczność danych kontaktowych</h2>
            <div className={styles.optionRow}>
              <span className={styles.option}>Nikt (prywatne)</span>
              <span className={styles.option}>Znajomi (jeśli włączysz dane pole)</span>
              <span className={styles.option}>Osoby z zaakceptowaną zgodą kontaktową</span>
            </div>
          </section>

          <section className={styles.panel} aria-label="Zgody kontaktowe">
            <h2 className={styles.sectionTitle}>Zgody kontaktowe</h2>
            <p className={styles.sectionHint}>
              Twoje dane kontaktowe są ujawniane wyłącznie przez zaakceptowaną
              prośbę o kontakt (approved_contact_fields). Sama znajomość NIE
              ujawnia automatycznie e-maila ani telefonu.
            </p>
          </section>

          <div className={styles.actions}>
            <button type="button" className={styles.button} disabled>
              Zapisz zmiany (dostępne po podłączeniu transportu)
            </button>
          </div>
          <Link to="/profile" className={styles.profileLink}>
            Wygląd profilu (zdjęcie, baner, opis) edytujesz na profilu →
          </Link>
        </section>
      </main>
    </div>
  );
}
