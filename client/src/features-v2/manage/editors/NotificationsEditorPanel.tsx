/**
 * features-v2/manage/editors/NotificationsEditorPanel — Slice 21 (deep dive).
 *
 * 6 in-app togglów per kategoria (friend_feed / communities / channels /
 * professional_profile / modules / system). Każda kategoria może mieć
 * `transportPartial: true` — w demo `system` ma transport partial, więc
 * toggle pokazuje "wymaga transportu" zamiast się włączać.
 *
 * Stan lokalny mock; po podpięciu transportu adapter zastąpi 1-do-1.
 */
import { useState, type ReactElement } from "react";
import styles from "./Editors.module.css";

export type NotificationCategoryKey =
  | "friend_feed"
  | "communities"
  | "channels"
  | "professional_profile"
  | "modules"
  | "system";

export interface NotificationCategoryRow {
  readonly key: NotificationCategoryKey;
  readonly label: string;
  readonly inAppEnabled: boolean;
  readonly transportPartial: boolean;
}

const DEFAULT_ROWS: readonly NotificationCategoryRow[] = [
  { key: "friend_feed", label: "Feed znajomych", inAppEnabled: true, transportPartial: false },
  { key: "communities", label: "Społeczności", inAppEnabled: true, transportPartial: false },
  { key: "channels", label: "Kanały", inAppEnabled: true, transportPartial: false },
  { key: "professional_profile", label: "Profil zawodowy", inAppEnabled: true, transportPartial: false },
  { key: "modules", label: "Moduły", inAppEnabled: true, transportPartial: false },
  { key: "system", label: "System", inAppEnabled: false, transportPartial: true },
];

interface Props {
  initial?: readonly NotificationCategoryRow[];
  onChange?(rows: readonly NotificationCategoryRow[]): void;
}

export function NotificationsEditorPanel({ initial, onChange }: Props): ReactElement {
  const [rows, setRows] = useState<readonly NotificationCategoryRow[]>(initial ?? DEFAULT_ROWS);

  const toggle = (key: NotificationCategoryKey) => {
    const next = rows.map((r) =>
      r.key === key ? { ...r, inAppEnabled: !r.inAppEnabled } : r,
    );
    setRows(next);
    onChange?.(next);
  };

  const partialCount = rows.filter((r) => r.transportPartial).length;

  return (
    <section className={styles.panel} aria-labelledby="notif-editor-heading">
      <header className={styles.panelHeader}>
        <h2 id="notif-editor-heading" className={styles.panelTitle}>Powiadomienia in-app</h2>
        <p className={styles.panelLead}>
          Włącz lub wyłącz kategorie powiadomień w aplikacji. E-mail i push pojawią się po podpięciu
          transportu.
        </p>
      </header>

      {partialCount > 0 ? (
        <div className={styles.warning} role="status">
          {partialCount} {partialCount === 1 ? "kategoria wymaga" : "kategorii wymaga"} podpięcia
          transportu (PARTIAL).
        </div>
      ) : null}

      <ul className={styles.toggleList} aria-label="Lista kategorii powiadomień">
        {rows.map((row) => (
          <li key={row.key} className={styles.toggleRow}>
            <div className={styles.toggleLabelBlock}>
              <span className={styles.toggleLabel}>{row.label}</span>
              <span className={styles.toggleValue}>
                {row.transportPartial
                  ? "Wymaga transportu — toggle in-app dostępny dopiero po podpięciu"
                  : row.inAppEnabled
                    ? "Włączone"
                    : "Wyłączone"}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={row.inAppEnabled}
              aria-label={`${row.label}: ${row.inAppEnabled ? "włączone" : "wyłączone"}`}
              className={`${styles.switch} ${row.inAppEnabled ? styles.switchOn : styles.switchOff}`}
              onClick={() => {
                if (row.transportPartial) return;
                toggle(row.key);
              }}
              disabled={row.transportPartial}
            >
              <span className={styles.switchThumb} aria-hidden="true" />
              <span className={styles.switchText}>
                {row.inAppEnabled ? "WŁ" : "WYŁ"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
