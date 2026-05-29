/**
 * features-v2/channels / ChannelsShell — `/channels` directory page
 * (UI_SHELL_ONLY + MOCK_LOCAL_ONLY).
 *
 * Sections (in product order):
 *   1. Obserwowane kanały
 *   2. Kanały moich społeczności
 *   3. Kanały, które prowadzę
 *   4. Odkrywaj kanały
 *
 * Channel follow is INDEPENDENT of community membership — members of a
 * community do not auto-follow its channels. Pulled straight from the
 * channels mock-adapter (no fake counts).
 */
import { useCallback, useEffect, useState } from "react";
import type { ChannelsDirectoryDTO } from "@shared/contracts/channels";
import { channelsMockAdapter } from "./channels-mock-adapter";
import { ChannelSection } from "./ChannelSection";
import styles from "./Channels.module.css";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: ChannelsDirectoryDTO };

export function ChannelsShell() {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const res = await channelsMockAdapter.getDirectoryView();
    if (!res.ok) {
      setState({ status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", data: res.value });
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (state.status === "loading") {
    return (
      <section className={styles.root}>
        <div className={styles.state} aria-busy="true">Ładowanie kanałów…</div>
      </section>
    );
  }
  if (state.status === "error") {
    return (
      <section className={styles.root}>
        <div className={styles.errorState} role="alert">{state.message}</div>
      </section>
    );
  }
  const { followed, myCommunityChannels, leading, discover } = state.data;
  return (
    <section className={styles.root} aria-labelledby="channels-heading">
      <header className={styles.hero}>
        <div className={styles.heroBody}>
          <p className={styles.kicker}>Kanały</p>
          <h1 id="channels-heading" className={styles.title}>Kanały</h1>
          <p className={styles.subtitle}>
            Obserwuj kanały społeczności i wracaj do miejsc, które są dla Ciebie ważne. Obserwowanie kanału nie wymaga członkostwa w społeczności.
          </p>
        </div>
      </header>

      <ChannelSection
        title="Obserwowane kanały"
        subtitle="Aktualne źródła, do których wracasz."
        emptyMessage="Nie obserwujesz jeszcze żadnych kanałów."
        channels={followed}
      />

      <ChannelSection
        title="Kanały, które prowadzę"
        subtitle="Kanały, w których jesteś prowadzącym lub współprowadzącym."
        emptyMessage="Nie prowadzisz jeszcze żadnego kanału. Możesz utworzyć kanał w panelu społeczności."
        channels={leading}
      />

      <ChannelSection
        title="Kanały moich społeczności"
        subtitle="Wszystkie kanały społeczności, do których należysz."
        emptyMessage="Twoje społeczności nie mają jeszcze kanałów."
        channels={myCommunityChannels}
      />

      <ChannelSection
        title="Odkrywaj kanały"
        subtitle="Publiczne kanały, których jeszcze nie znasz."
        emptyMessage="Brak nowych kanałów do odkrycia."
        channels={discover}
      />
    </section>
  );
}
