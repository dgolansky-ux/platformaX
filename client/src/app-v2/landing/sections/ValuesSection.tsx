import type { ReactNode } from "react";
import pageStyles from "../LandingPage.module.css";
import styles from "./ValuesSection.module.css";

type Value = {
  title: string;
  text: string;
  icon: ReactNode;
};

const VALUES: ReadonlyArray<Value> = [
  {
    title: "Bez reklam",
    text: "Nie przerywamy korzystania z platformy sponsorowanymi treściami.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M5 5l14 14M19 5L5 19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "Prywatność na serio",
    text: "Twoje dane nie są produktem i nie są sprzedawane reklamodawcom.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 3l8 3v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-3z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Mniej hałasu",
    text: "Nie wzmacniamy skrajnych emocji tylko po to, by zatrzymać Cię dłużej.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M4 12h3l3-6 4 12 3-6h3"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Więcej sprawczości",
    text: "Ty decydujesz, co publikujesz, komu to pokazujesz i jak budujesz swoją obecność.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          cx="12"
          cy="12"
          r="8"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path
          d="M12 7v5l3 2"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export function ValuesSection() {
  return (
    <section
      id="dlaczego"
      className={styles.section}
      aria-labelledby="values-title"
    >
      <div className={pageStyles.container}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>Dlaczego PlatformaX</span>
          <h2 id="values-title" className={styles.title}>
            Zbudowana z myślą o ludziach
          </h2>
          <p className={styles.lead}>
            PlatformaX nie walczy o każdą sekundę Twojej uwagi. Pomaga tworzyć
            sensowne relacje, społeczności i inicjatywy w spokojnym,
            przejrzystym środowisku.
          </p>
        </div>

        <ul className={styles.grid} role="list">
          {VALUES.map((v) => (
            <li key={v.title} className={styles.card}>
              <span className={styles.icon}>{v.icon}</span>
              <h3 className={styles.cardTitle}>{v.title}</h3>
              <p className={styles.cardText}>{v.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
