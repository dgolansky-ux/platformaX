/**
 * features-v2/communities-v2/manage / DangerZone — foundation only.
 *
 * Legacy ma „Usuń społeczność na zawsze”. V2 nie implementuje hard-delete w
 * tym slice — confirmation dialog renderuje się jako truthful foundation,
 * a samo Usuń jest disabled z opisem TRANSPORT_PARTIAL.
 */
import { useState } from "react";
import styles from "../CommunityManage.module.css";

export type DangerZoneProps = {
  communityName: string;
};

export function DangerZone({ communityName }: DangerZoneProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const canConfirm = confirmText === communityName;

  return (
    <section className={styles.panel} aria-labelledby="danger-heading">
      <h2 id="danger-heading" className={styles.panelTitle}>Strefa niebezpieczna</h2>
      <div className={styles.dangerZone}>
        <p className={styles.dangerHeading}>
          <span aria-hidden>⚠</span>
          Strefa niebezpieczna
        </p>
        <p className={styles.dangerNote}>
          Usunięcie społeczności jest trwałe i nieodwracalne. Wszystkie posty, członkowie,
          moduły i dane zostaną bezpowrotnie usunięte.
        </p>
        {!confirmOpen ? (
          <div className={styles.dangerActions}>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => setConfirmOpen(true)}
            >
              🗑 Usuń społeczność na zawsze
            </button>
          </div>
        ) : (
          <div className={styles.settingsForm}>
            <label className={styles.field}>
              <span className={styles.label}>
                Aby potwierdzić, wpisz nazwę społeczności: <strong>{communityName}</strong>
              </span>
              <input
                className={styles.input}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={communityName}
                aria-label="Potwierdź nazwę społeczności"
              />
            </label>
            <div className={styles.dangerActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText("");
                }}
              >
                Anuluj
              </button>
              <button
                type="button"
                className={styles.dangerButton}
                disabled
                aria-label="Usuń na zawsze (niedostępne w tym etapie)"
              >
                {canConfirm ? "Usuń (niedostępne)" : "Wpisz nazwę aby potwierdzić"}
              </button>
            </div>
            <p className={styles.transportNote}>
              TRANSPORT_PARTIAL: trwałe usunięcie wymaga backendu z polityką retencji i audytu
              — udostępnione w kolejnym slice.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
