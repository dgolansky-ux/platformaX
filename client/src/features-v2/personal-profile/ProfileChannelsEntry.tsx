import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import styles from "./PersonalProfilePage.module.css";

type Props = {
  view: PersonalProfileViewDTO;
  onOpenChannels?: () => void;
};

export function ProfileChannelsEntry({ view, onOpenChannels }: Props) {
  if (!view.viewerState.canOpenChannels) return null;
  const entry = view.channelsEntry;
  const label = view.viewerState.canEditProfile ? "Twoje kanały" : "Kanały tej osoby";
  return (
    <section className={styles.section} aria-labelledby="profile-channels-heading">
      <header className={styles.sectionHeader}>
        <h2 id="profile-channels-heading" className={styles.sectionTitle}>{label}</h2>
        <button
          type="button"
          className={`${styles.btn} ${styles.btnGhost}`}
          onClick={onOpenChannels ?? (() => undefined)}
          disabled={!entry.canOpen}
        >
          Otwórz kanały →
        </button>
      </header>
      <p className={styles.empty}>
        {entry.channelCount === null
          ? "Liczba kanałów dla profilu pojawi się, gdy transport zostanie podpięty."
          : entry.channelCount === 0
            ? "Brak publicznych kanałów."
            : `Aktywne kanały: ${entry.channelCount}.`}
      </p>
    </section>
  );
}
