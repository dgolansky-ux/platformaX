/**
 * features-v2/communities-v2 / CommunityPublicHubView — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY.
 *
 * Renders the composed Public Hub view returned by the adapter. Hub never
 * stores data — it composes from the community public summary + enabled
 * modules + (optional) channels. No fake module content rendered; disabled
 * modules appear as empty slots.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { CommunityHubViewDTO } from "@shared/contracts/communities";
import { communitiesMockAdapter } from "./mock-adapter";
import styles from "./CommunitySubScreens.module.css";

type CommunityPublicHubViewProps = {
  slug: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; hub: CommunityHubViewDTO };

export function CommunityPublicHubView({ slug }: CommunityPublicHubViewProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await communitiesMockAdapter.getCommunityHub(slug);
      if (!alive) return;
      if (!res.ok) setState({ status: "error", message: res.error.message });
      else setState({ status: "ready", hub: res.value });
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (state.status === "loading") {
    return <div className={styles.loading} aria-busy="true">Ładowanie Public Hub…</div>;
  }
  if (state.status === "error") {
    return <div className={styles.error} role="alert">{state.message}</div>;
  }

  const { hub } = state;
  const enabledModules = hub.modules.filter((m) => m.enabled);
  const disabledModules = hub.modules.filter((m) => !m.enabled);

  return (
    <section className={styles.root} aria-labelledby="hub-heading">
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{hub.owner.name}</p>
          <h1 id="hub-heading" className={styles.title}>Public Hub</h1>
          <p className={styles.subtitle}>
            Publiczny widok społeczności złożony z włączonych modułów i kanałów.
            Hub nie posiada własnych danych — składa się z innych domen.
          </p>
        </div>
        <Link to={`/communities/${slug}`} className={styles.backLink}>← Wróć do społeczności</Link>
      </header>

      <section className={styles.slotGroup} aria-labelledby="enabled-modules-heading">
        <h2 id="enabled-modules-heading" className={styles.groupTitle}>Włączone moduły</h2>
        {enabledModules.length === 0 ? (
          <p className={styles.empty}>Społeczność nie włączyła jeszcze żadnego modułu.</p>
        ) : (
          <div className={styles.slotsGrid}>
            {enabledModules.map((module) => (
              <article key={module.key} className={styles.slot}>
                <h3 className={styles.slotTitle}>{module.name}</h3>
                <p className={styles.slotDesc}>{module.description}</p>
                <p className={styles.slotStatus}>Slot aktywny — moduł nie udostępnia jeszcze treści w MVP.</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className={styles.slotGroup} aria-labelledby="channels-heading">
        <h2 id="channels-heading" className={styles.groupTitle}>Kanały</h2>
        {hub.channels.length === 0 ? (
          <p className={styles.empty}>Brak publicznych kanałów do pokazania.</p>
        ) : (
          <ul className={styles.list}>
            {hub.channels.map((channel) => (
              <li key={channel.id} className={styles.row}>
                <div>
                  <p className={styles.rowTitle}>#{channel.slug} · {channel.name}</p>
                  <p className={styles.rowDesc}>{channel.description || "Bez opisu."}</p>
                </div>
                <span className={styles.metaPill}>{channel.followerCount} obserwujących</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {disabledModules.length > 0 ? (
        <section className={styles.slotGroup} aria-labelledby="disabled-modules-heading">
          <h2 id="disabled-modules-heading" className={styles.groupTitle}>Wyłączone moduły</h2>
          <ul className={styles.disabledList}>
            {disabledModules.map((module) => (
              <li key={module.key}>{module.name}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
