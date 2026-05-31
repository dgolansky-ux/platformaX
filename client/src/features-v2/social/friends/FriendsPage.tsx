import { useEffect, useState } from "react";
import { socialFriendsMockAdapter } from "./mock-adapter";
import type { FriendsPageView } from "./types";
import { FriendsList } from "./FriendsList";
import { SocialLoadingState } from "./SocialLoadingState";
import { SocialErrorState } from "./SocialErrorState";
import styles from "./Friends.module.css";

export function FriendsPage() {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; view: FriendsPageView }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    void socialFriendsMockAdapter
      .getFriendsPageView()
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

  if (state.status === "loading") return <SocialLoadingState label="Ładuję znajomych..." />;
  if (state.status === "error") return <SocialErrorState message={state.message} />;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Znajomi</h2>
      <FriendsList items={state.view.friends} emptyTitle="Brak znajomych" />
    </section>
  );
}
