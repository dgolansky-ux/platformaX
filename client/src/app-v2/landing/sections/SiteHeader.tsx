import pageStyles from "../LandingPage.module.css";
import styles from "./SiteHeader.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`${pageStyles.container} ${styles.inner}`}>
        <a href="#top" className={styles.brand} aria-label="PlatformaX — strona główna">
          <span className={styles.brandMark} aria-hidden="true">
            P
          </span>
          <span>PlatformaX</span>
        </a>

        <nav className={styles.nav} aria-label="Nawigacja konta">
          {/* Placeholder: identity domain (login) not implemented yet. */}
          <a href="#" className={styles.linkGhost}>
            Zaloguj się
          </a>
          {/* Placeholder: identity domain (sign-up) not implemented yet. */}
          <a href="#" className={styles.linkPrimary}>
            Załóż konto
          </a>
        </nav>
      </div>
    </header>
  );
}
