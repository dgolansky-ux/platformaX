import pageStyles from "../LandingPage.module.css";
import styles from "./SiteFooter.module.css";

export function SiteFooter() {
  return (
    <footer className={styles.footer} aria-label="Stopka">
      <div className={`${pageStyles.container} ${styles.layout}`}>
        <div className={styles.brandRow}>
          <span className={styles.brandMark} aria-hidden="true">
            P
          </span>
          <span className={styles.brand}>PlatformaX</span>
        </div>

        <p className={styles.tagline}>
          Spokojniejsza przestrzeń do relacji, społeczności i działania.
        </p>

        <hr className={styles.divider} />

        <div className={styles.bottom}>
          <p className={styles.copy}>
            © 2026 PlatformaX · Wszelkie prawa zastrzeżone
          </p>
        </div>
      </div>
    </footer>
  );
}
