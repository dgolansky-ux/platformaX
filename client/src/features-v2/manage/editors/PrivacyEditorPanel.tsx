/**
 * features-v2/manage/editors/PrivacyEditorPanel — Slice 21 (deep dive).
 *
 * 5 niezależnych togglów widoczności (profil, warstwa zawodowa, Public Hub,
 * podgląd feedu, miejsca pracy). Każdy z trzema poziomami: publiczne / tylko
 * znajomi / prywatne. Stan trzymany lokalnie (mock); zmiana jest natychmiast
 * widoczna — to NIE jest fake save, bo dispatcher mock realnie aktualizuje
 * stan, a UI renderuje aktualną wartość. Po podpięciu transportu Supabase
 * adapter zostanie podmieniony 1-do-1.
 */
import { useState, type ReactElement } from "react";
import styles from "./Editors.module.css";

export type PrivacyKey =
  | "profile"
  | "professionalLayer"
  | "publicHub"
  | "feedPreview"
  | "workplace";

export type PrivacyLevel = "public" | "friends_only" | "private";

export interface PrivacyState {
  profile: PrivacyLevel;
  professionalLayer: PrivacyLevel;
  publicHub: PrivacyLevel;
  feedPreview: PrivacyLevel;
  workplace: PrivacyLevel;
}

const ROW_LABELS: Record<PrivacyKey, string> = {
  profile: "Profil",
  professionalLayer: "Warstwa zawodowa",
  publicHub: "Public Hub",
  feedPreview: "Podgląd feedu",
  workplace: "Miejsca pracy",
};

const LEVEL_LABELS: Record<PrivacyLevel, string> = {
  public: "Publiczne",
  friends_only: "Tylko znajomi",
  private: "Prywatne",
};

const DEFAULT_STATE: PrivacyState = {
  profile: "friends_only",
  professionalLayer: "public",
  publicHub: "public",
  feedPreview: "friends_only",
  workplace: "public",
};

interface Props {
  initial?: PrivacyState;
  onChange?(state: PrivacyState): void;
}

export function PrivacyEditorPanel({ initial, onChange }: Props): ReactElement {
  const [state, setState] = useState<PrivacyState>(initial ?? DEFAULT_STATE);

  const set = (key: PrivacyKey, level: PrivacyLevel) => {
    const next: PrivacyState = { ...state, [key]: level };
    setState(next);
    onChange?.(next);
  };

  const allPrivate =
    state.profile === "private" &&
    state.publicHub === "private" &&
    state.feedPreview === "private";

  return (
    <section className={styles.panel} aria-labelledby="privacy-editor-heading">
      <header className={styles.panelHeader}>
        <h2 id="privacy-editor-heading" className={styles.panelTitle}>Widoczność danych</h2>
        <p className={styles.panelLead}>
          Każde pole ma niezależny poziom widoczności. Zmiany aplikują się natychmiast w trybie demo;
          po podpięciu transportu zostaną zapisane na serwerze.
        </p>
      </header>

      {allPrivate ? (
        <div className={styles.warning} role="status">
          Wszystko prywatne — znajomi nie zobaczą Twojego profilu ani aktywności.
        </div>
      ) : null}

      <ul className={styles.toggleList} aria-label="Lista togglów prywatności">
        {(Object.keys(ROW_LABELS) as PrivacyKey[]).map((key) => (
          <li key={key} className={styles.toggleRow}>
            <div className={styles.toggleLabelBlock}>
              <span className={styles.toggleLabel}>{ROW_LABELS[key]}</span>
              <span className={styles.toggleValue}>
                Aktualnie: <strong>{LEVEL_LABELS[state[key]]}</strong>
              </span>
            </div>
            <div
              className={styles.toggleGroup}
              role="radiogroup"
              aria-label={`Widoczność: ${ROW_LABELS[key]}`}
            >
              {(Object.keys(LEVEL_LABELS) as PrivacyLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  role="radio"
                  aria-checked={state[key] === level}
                  className={`${styles.toggleBtn} ${state[key] === level ? styles.toggleBtnActive : ""}`}
                  onClick={() => set(key, level)}
                >
                  {LEVEL_LABELS[level]}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
