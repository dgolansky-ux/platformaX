import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./AuthLayout.module.css";
import { AuthBrandPanel } from "./AuthBrandPanel";

type AuthLayoutProps = {
  brand: {
    kicker: string;
    title: string;
    lead: string;
    bullets: ReadonlyArray<string>;
  };
  heading: string;
  subheading?: string;
  children: ReactNode;
  footer?: ReactNode;
  titleId?: string;
};

export function AuthLayout({
  brand,
  heading,
  subheading,
  children,
  footer,
  titleId = "auth-heading",
}: AuthLayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.layout}>
        <div className={styles.brandPanel}>
          <AuthBrandPanel {...brand} />
        </div>

        <main className={styles.formColumn} aria-labelledby={titleId}>
          <div className={styles.formInner}>
            <div className={styles.mobileHeader}>
              <Link to="/" className={styles.mobileBrand} aria-label="PlatformaX — strona główna">
                <span className={styles.mobileMark} aria-hidden="true">
                  P
                </span>
                PlatformaX
              </Link>
            </div>

            <section className={styles.card}>
              <h1 id={titleId} className={styles.heading}>
                {heading}
              </h1>
              {subheading ? (
                <p className={styles.subheading}>{subheading}</p>
              ) : null}
              {children}
            </section>

            {footer ? <div className={styles.footerLine}>{footer}</div> : null}
          </div>
        </main>
      </div>
    </div>
  );
}
