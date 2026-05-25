import { Link } from "react-router-dom";
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
          <Link to="/login" className={styles.linkGhost}>
            Zaloguj się
          </Link>
          <Link to="/register" className={styles.linkPrimary}>
            Załóż konto
          </Link>
        </nav>
      </div>
    </header>
  );
}
