import { Link } from "react-router-dom";
import pageStyles from "../LandingPage.module.css";
import styles from "./HeroSection.module.css";

export function HeroSection() {
  return (
    <section
      id="top"
      className={styles.hero}
      aria-labelledby="hero-title"
    >
      <div className={`${pageStyles.container} ${styles.layout}`}>
        <div>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} aria-hidden="true" />
            Platforma społecznościowo-zawodowa
          </span>

          <h1 id="hero-title" className={styles.title}>
            Twoja przestrzeń do{" "}
            <span className={styles.titleAccent}>
              relacji, społeczności i działania
            </span>
          </h1>

          <p className={styles.lead}>
            PlatformaX to miejsce do budowania kontaktów, tworzenia
            społeczności i rozwijania aktywności — bez reklam, handlu danymi
            i presji algorytmów.
          </p>

          <div className={styles.ctaRow}>
            <Link to="/register" className={styles.ctaPrimary}>
              Załóż konto
            </Link>
            <Link to="/login" className={styles.ctaSecondary}>
              Zaloguj się
            </Link>
          </div>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <div className={styles.visualGlow} />
          <div className={styles.cardStackBack} />

          <div className={styles.floatChip + " " + styles.floatChipTop}>
            <span className={styles.floatChipDot} />
            Nowa społeczność
          </div>

          <article className={styles.card}>
            <header className={styles.cardHeader}>
              <span className={styles.avatar}>AK</span>
              <div>
                <div className={styles.cardName}>Anna Kowalska</div>
                <div className={styles.cardRole}>
                  Projektantka · Lokalna inicjatywa
                </div>
              </div>
            </header>
            <p className={styles.cardBody}>
              „Buduję sieć kontaktów wokół projektów społecznych. PlatformaX
              daje mi spokojną przestrzeń bez algorytmicznej presji.”
            </p>
            <div className={styles.cardMeta}>
              <span className={styles.tag}>Społeczność lokalna</span>
              <span>128 osób</span>
            </div>
          </article>

          <div className={styles.floatChip + " " + styles.floatChipBottom}>
            <span className={styles.floatChipDot} />
            Bez reklam
          </div>
        </div>
      </div>
    </section>
  );
}
