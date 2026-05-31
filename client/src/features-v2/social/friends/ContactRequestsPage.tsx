import { useEffect, useState } from "react";
import { socialFriendsMockAdapter } from "./mock-adapter";
import type { ContactRequestsPageView } from "./types";
import { ContactRequestCard } from "./ContactRequestCard";
import { SocialLoadingState } from "./SocialLoadingState";
import { SocialErrorState } from "./SocialErrorState";
import { SocialEmptyState } from "./SocialEmptyState";
import styles from "./Friends.module.css";

export function ContactRequestsPage() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; view: ContactRequestsPageView }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void socialFriendsMockAdapter
      .getContactRequestsPageView()
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
    return <SocialLoadingState label="Ładuję prośby o kontakt..." />;
  }
  if (state.status === "error") return <SocialErrorState message={state.message} />;
  if (state.view.requests.length === 0) {
    return <SocialEmptyState title="Brak próśb o kontakt" />;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Prośby o kontakt</h2>
      <div className={styles.grid}>
        {state.view.requests.map((request) => (
          <ContactRequestCard key={request.id} model={request} />
        ))}
      </div>
    </section>
  );
}
