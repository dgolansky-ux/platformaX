/**
 * features-v2/public-hub / EventsSlot — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 */
import type { HubEventUi } from "../types";
import styles from "../PublicHub.module.css";

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("pl-PL", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

const LOCATION_LABEL: Record<HubEventUi["locationType"], string> = {
  online: "Online",
  offline: "Na żywo",
  hybrid: "Hybrydowo",
};

type Props = { events: readonly HubEventUi[] };

export function EventsSlot({ events }: Props) {
  if (events.length === 0) {
    return <p className={styles.empty}>Brak nadchodzących publicznych wydarzeń.</p>;
  }
  return (
    <ul className={styles.cardList} aria-label="Wydarzenia">
      {events.map((event) => (
        <li key={event.id} className={styles.card}>
          <p className={styles.cardTitle}>{event.title}</p>
          <p className={styles.cardMeta}>
            <span className={styles.eventDate}>{formatDate(event.startAt)}</span>
            <span className={styles.locationBadge}>{LOCATION_LABEL[event.locationType]}</span>
            {event.locationText ? <span>{event.locationText}</span> : null}
          </p>
          {event.description ? <p className={styles.cardDesc}>{event.description}</p> : null}
        </li>
      ))}
    </ul>
  );
}
