import { Link } from "react-router-dom";
import styles from "./AuthBrandPanel.module.css";

type BrandPanelProps = {
  kicker: string;
  title: string;
  lead: string;
  bullets: ReadonlyArray<string>;
};

export function AuthBrandPanel({ kicker, title, lead, bullets }: BrandPanelProps) {
  return (
    <aside className={styles.panel} aria-hidden="true">
      <Link to="/" className={styles.brand}>
        <span className={styles.brandMark}>P</span>
        <span>PlatformaX</span>
      </Link>

      <div className={styles.copy}>
        <span className={styles.kicker}>{kicker}</span>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.lead}>{lead}</p>

        <ul className={styles.bulletList} role="list">
          {bullets.map((b) => (
            <li key={b} className={styles.bullet}>
              <span className={styles.bulletDot}>
                <svg viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6.5l2.5 2.5L10 3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              {b}
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.fineprint}>
        Bezpłatne konto. Bez reklam. Bez handlu Twoimi danymi.
      </p>
    </aside>
  );
}
