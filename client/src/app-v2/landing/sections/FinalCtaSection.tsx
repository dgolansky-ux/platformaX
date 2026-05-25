import pageStyles from "../LandingPage.module.css";
import styles from "./FinalCtaSection.module.css";

export function FinalCtaSection() {
  return (
    <section
      id="dolacz"
      className={styles.section}
      aria-labelledby="final-cta-title"
    >
      <div className={pageStyles.container}>
        <div className={styles.wrapper}>
          <h2 id="final-cta-title" className={styles.title}>
            Dołącz do PlatformaX
          </h2>
          <p className={styles.lead}>
            Zacznij budować swoją sieć, społeczność i obecność w internecie na
            własnych zasadach.
          </p>
          <p className={styles.fineprint}>
            Bezpłatne konto. Bez reklam. Bez handlu Twoimi danymi.
          </p>

          <div className={styles.ctaRow}>
            {/* Placeholder: identity domain (sign-up) not implemented yet. */}
            <a href="#" className={styles.ctaPrimary}>
              Załóż konto
            </a>
            {/* Placeholder: identity domain (login) not implemented yet. */}
            <a href="#" className={styles.ctaSecondary}>
              Zaloguj się
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
