import { useEffect, useState } from "react";
import { socialFriendsMockAdapter } from "./mock-adapter";
import type { FriendRequestsPageView } from "./types";
import { PendingSentRequests } from "./PendingSentRequests";
import { PendingReceivedRequests } from "./PendingReceivedRequests";
import { SocialLoadingState } from "./SocialLoadingState";
import { SocialErrorState } from "./SocialErrorState";
import styles from "./Friends.module.css";

export function FriendRequestsPage() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; view: FriendRequestsPageView }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void socialFriendsMockAdapter
      .getFriendRequestsPageView()
      .then((view) => {
        if (!cancelled) setState({ status: "ready", view });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "Nieznany błąd",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <SocialLoadingState label="Ładuję zaproszenia..." />;
  }
  if (state.status === "error") return <SocialErrorState message={state.message} />;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Zaproszenia do znajomych</h2>
      <PendingReceivedRequests items={state.view.pendingReceived} />
      <PendingSentRequests items={state.view.pendingSent} />
    </section>
  );
}
