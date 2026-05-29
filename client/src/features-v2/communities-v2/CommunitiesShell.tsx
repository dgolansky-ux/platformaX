/**
 * features-v2/communities-v2 / CommunitiesShell — UI_SHELL_ONLY + MOCK_LOCAL_ONLY.
 *
 * Renders /communities from a local adapter only. No `@server/*` imports and no
 * persistence claims until a real transport adapter exists.
 */
import { useEffect, useMemo, useState } from "react";
import type { CommunitiesShellData } from "@shared/contracts/communities";
import { CommunitiesList } from "./CommunitiesList";
import { CommunityTabs, type CommunitiesTabKey } from "./CommunityTabs";
import { communitiesMockAdapter } from "./mock-adapter";
import styles from "./CommunitiesShell.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: CommunitiesShellData };

export function CommunitiesShell() {
  const [activeTab, setActiveTab] = useState<CommunitiesTabKey>("mine");
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let alive = true;
    communitiesMockAdapter
      .listCommunitiesShell()
      .then((data) => {
        if (alive) setState({ status: "ready", data });
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : "Nieznany błąd";
        if (alive) setState({ status: "error", message });
      });
    return () => {
      alive = false;
    };
  }, []);

  const stats = useMemo(() => {
    if (state.status !== "ready") return { mine: 0, discover: 0 };
    return {
      mine: state.data.myCommunities.length,
      discover: state.data.discoverCommunities.length,
    };
  }, [state]);

  return (
    <section className={styles.root} aria-labelledby="communities-heading">
      <header className={styles.hero}>
        <div>
          <p className={styles.brand}>Społeczności</p>
          <h1 id="communities-heading" className={styles.title}>Społeczności</h1>
          <p className={styles.modeNote}>
            Lokalny shell pod przyszły transport. Dane pochodzą z public-safe
            fixture, więc tworzenie i szczegóły są jeszcze wyłączone.
          </p>
        </div>
        <button
          type="button"
          className={styles.primaryButton}
          disabled
          aria-label="Utwórz społeczność — transport społeczności nie jest jeszcze podłączony"
        >
          Utwórz społeczność
        </button>
      </header>

      <CommunityTabs
        activeTab={activeTab}
        mineCount={stats.mine}
        discoverCount={stats.discover}
        onSelect={setActiveTab}
      />

      <div className={styles.panel}>
        {state.status === "loading" ? (
          <div className={styles.loadingState} aria-busy="true">Ładowanie społeczności...</div>
        ) : null}
        {state.status === "error" ? (
          <div className={styles.errorState} role="alert">
            Nie udało się załadować społeczności: {state.message}
          </div>
        ) : null}
        {state.status === "ready" ? (
          <CommunitiesList
            communities={
              activeTab === "mine"
                ? state.data.myCommunities
                : state.data.discoverCommunities
            }
            emptyTitle={activeTab === "mine" ? "Nie masz jeszcze społeczności" : "Brak społeczności do odkrycia"}
            emptyBody={activeTab === "mine" ? "Dołącz do publicznych społeczności albo wróć, gdy transport utworzy pierwszą." : "Lista odkrywania jest pusta w lokalnym fixture."}
          />
        ) : null}
      </div>
    </section>
  );
}
