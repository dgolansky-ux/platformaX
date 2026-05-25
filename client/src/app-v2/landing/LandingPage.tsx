import styles from "./LandingPage.module.css";
import { SiteHeader } from "./sections/SiteHeader";
import { HeroSection } from "./sections/HeroSection";
import { ValuesSection } from "./sections/ValuesSection";
import { FinalCtaSection } from "./sections/FinalCtaSection";
import { SiteFooter } from "./sections/SiteFooter";

export function LandingPage() {
  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main} id="main">
        <HeroSection />
        <ValuesSection />
        <FinalCtaSection />
      </main>
      <SiteFooter />
    </div>
  );
}
