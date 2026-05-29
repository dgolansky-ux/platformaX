/**
 * app-v2/manage/ManageDashboard — root of "Zarządzaj" (/manage).
 *
 * This is the management HUB, NOT the professions screen. It shows tiles to
 * per-area management views; the professional section lives at a child route
 * (/manage/sekcja-zawodowa). Enabled tiles navigate to real screens; future
 * tiles are explicitly disabled ("w przygotowaniu") — no no-op buttons.
 */
import { useNavigate } from "react-router-dom";
import type { ReactElement } from "react";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import layout from "./ManageLayout.module.css";
import styles from "./ManageDashboard.module.css";

type Tile = {
  key: string;
  icon: string;
  title: string;
  desc: string;
  status: string;
  to?: string;
};

const TILES: readonly Tile[] = [
  {
    key: "profile",
    icon: "👤",
    title: "Zarządzaj profilem osobistym",
    desc: "Edytuj podstawowe informacje, opis, zdjęcie i widoczność profilu.",
    status: "Dostępne",
    to: "/profile",
  },
  {
    key: "professional",
    icon: "💼",
    title: "Zarządzaj zawodem",
    desc: "Wybierz obszar zawodowy. Zawody i specjalizacje po imporcie bazy.",
    status: "Kategorie gotowe",
    to: "/manage/sekcja-zawodowa",
  },
  {
    key: "contacts",
    icon: "👥",
    title: "Zarządzaj kontaktami",
    desc: "Kontakty, specjaliści, kręgi znajomych i prośby o kontakt.",
    status: "Dostępne",
    to: "/contacts",
  },
  { key: "privacy", icon: "🔒", title: "Prywatność i widoczność", desc: "Kto widzi Twoje dane kontaktowe i pola profilu.", status: "W przygotowaniu" },
  { key: "media", icon: "🖼️", title: "Media profilu", desc: "Zarządzaj awatarem i banerem profilu.", status: "W przygotowaniu" },
  { key: "settings", icon: "⚙️", title: "Ustawienia konta", desc: "Ustawienia konta i preferencje.", status: "W przygotowaniu" },
];

function ManageTile({ tile, onOpen }: { tile: Tile; onOpen: (to: string) => void }): ReactElement {
  if (!tile.to) {
    return (
      <div className={`${styles.tile} ${styles.tileDisabled}`} aria-disabled="true">
        <span className={styles.tileIcon} aria-hidden="true">{tile.icon}</span>
        <h2 className={styles.tileTitle}>{tile.title}</h2>
        <p className={styles.tileDesc}>{tile.desc}</p>
        <span className={`${styles.tileStatus} ${styles.tileStatusSoon}`}>{tile.status}</span>
      </div>
    );
  }
  const to = tile.to;
  return (
    <button type="button" className={styles.tile} onClick={() => onOpen(to)}>
      <span className={styles.tileIcon} aria-hidden="true">{tile.icon}</span>
      <h2 className={styles.tileTitle}>{tile.title}</h2>
      <p className={styles.tileDesc}>{tile.desc}</p>
      <span className={styles.tileStatus}>{tile.status}</span>
    </button>
  );
}

export function ManageDashboard(): ReactElement {
  const navigate = useNavigate();
  return (
    <div className={layout.page}>
      <DesktopSidebar active="zarzadzaj" displayName="Demo użytkownik" handle="demo" avatarInitial="D" />
      <main className={layout.content}>
        <section className={styles.root} aria-labelledby="manage-heading">
          <header className={styles.header}>
            <h1 id="manage-heading" className={styles.title}>Zarządzaj</h1>
            <p className={styles.lead}>
              Zarządzaj swoim profilem, zawodem i ustawieniami konta.
            </p>
          </header>
          <div className={styles.grid}>
            {TILES.map((tile) => (
              <ManageTile key={tile.key} tile={tile} onOpen={navigate} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
