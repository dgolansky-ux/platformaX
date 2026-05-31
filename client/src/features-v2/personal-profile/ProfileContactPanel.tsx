import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import styles from "./PersonalProfilePage.module.css";

const FIELD_LABEL: Record<string, string> = {
  phone: "Telefon",
  emailContact: "E-mail",
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  linkedin: "LinkedIn",
  website: "Strona WWW",
};

const HIDDEN_COPY: Record<PersonalProfileViewDTO["contactPanel"]["hiddenFieldsReason"], string> = {
  owner: "Tu zobaczysz swój własny zestaw pól kontaktowych.",
  friend_policy: "Właściciel profilu nie udostępnia kontaktu znajomym.",
  stranger: "Brak publicznego kontaktu. Możesz poprosić o dostęp.",
  anonymous: "Zaloguj się, żeby zobaczyć kontakt.",
  none: "",
};

type Props = {
  view: PersonalProfileViewDTO;
  onRequestContactAccess?: () => void;
};

export function ProfileContactPanel({ view, onRequestContactAccess }: Props) {
  const panel = view.contactPanel;
  return (
    <section className={styles.section} aria-labelledby="profile-contact-heading">
      <header className={styles.sectionHeader}>
        <h2 id="profile-contact-heading" className={styles.sectionTitle}>Kontakt</h2>
        {panel.requestContactAccessAvailable && onRequestContactAccess ? (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnGhost}`}
            onClick={onRequestContactAccess}
          >
            Poproś o kontakt
          </button>
        ) : null}
      </header>
      {panel.visibleFields.length > 0 ? (
        <ul className={styles.contactList} aria-label="Pola kontaktowe">
          {panel.visibleFields.map((f) => (
            <li key={f.field} className={styles.contactItem}>
              <span className={styles.contactField}>{FIELD_LABEL[f.field] ?? f.field}</span>
              <span className={styles.contactValue}>{f.value}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>{HIDDEN_COPY[panel.hiddenFieldsReason]}</p>
      )}
    </section>
  );
}
