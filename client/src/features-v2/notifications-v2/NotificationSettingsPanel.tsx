import type { NotificationCategoryUi, NotificationSettingsUi } from "./types";
import styles from "./NotificationSettingsPanel.module.css";

type Props = {
  settings: NotificationSettingsUi;
  onToggle: (category: NotificationCategoryUi, nextEnabled: boolean) => void;
};

const CATEGORY_LABEL: Record<NotificationCategoryUi, string> = {
  friend_feed: "Feed znajomych",
  communities: "Społeczności",
  channels: "Kanały",
  professional: "Profil zawodowy",
  modules: "Moduły (wydarzenia, tematy, newsletter)",
  system: "Powiadomienia systemowe",
};

const CATEGORY_DESC: Record<NotificationCategoryUi, string> = {
  friend_feed: "Reakcje i komentarze pod Twoimi wpisami.",
  communities: "Zaproszenia, dołączenia, zmiany ról.",
  channels: "Nowe posty i przypisania na kanałach.",
  professional: "Kontakt w sprawie Twojego miejsca pracy.",
  modules: "Nowe wydarzenia i wiadomości z newslettera.",
  system: "Komunikaty platformy oraz konta.",
};

export function NotificationSettingsPanel({ settings, onToggle }: Props) {
  return (
    <section className={styles.panel} aria-labelledby="notif-settings-heading">
      <h2 id="notif-settings-heading" className={styles.title}>Ustawienia powiadomień</h2>
      <p className={styles.subtitle}>
        Wybierz, które kategorie chcesz otrzymywać w aplikacji. Powiadomienia e-mail i push pojawią się w kolejnej iteracji.
      </p>
      <ul className={styles.list} aria-label="Kategorie powiadomień">
        {settings.categories.map((row) => (
          <li key={row.category} className={styles.row}>
            <div className={styles.rowMain}>
              <span className={styles.rowName}>{CATEGORY_LABEL[row.category]}</span>
              <span className={styles.rowDesc}>{CATEGORY_DESC[row.category]}</span>
            </div>
            <button
              type="button"
              className={`${styles.toggle} ${row.inAppEnabled ? styles.toggleOn : styles.toggleOff}`}
              aria-pressed={row.inAppEnabled}
              onClick={() => onToggle(row.category, !row.inAppEnabled)}
            >
              {row.inAppEnabled ? "Włączone" : "Wyłączone"}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
