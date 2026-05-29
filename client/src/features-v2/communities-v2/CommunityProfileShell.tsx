/**
 * features-v2/communities-v2 / CommunityProfileShell — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY public community profile.
 *
 * Displays the community public summary and a real (local) join CTA driven
 * by viewerRelation. Founder/admin see a link to manage; private communities
 * surface the request-to-join control. No `@server/*` imports.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CommunityProfileDTO } from "@shared/contracts/communities";
import { communitiesMockAdapter } from "./mock-adapter";
import styles from "./CommunityProfile.module.css";

type CommunityProfileShellProps = {
  slug: string;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; profile: CommunityProfileDTO };

export function CommunityProfileShell({ slug }: CommunityProfileShellProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const refresh = useCallback(async () => {
    setState({ status: "loading" });
    const res = await communitiesMockAdapter.getCommunityProfile(slug);
    if (!res.ok) {
      setState({ status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", profile: res.value });
  }, [slug]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      const res = await communitiesMockAdapter.getCommunityProfile(slug);
      if (!alive) return;
      if (!res.ok) setState({ status: "error", message: res.error.message });
      else setState({ status: "ready", profile: res.value });
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  if (state.status === "loading") {
    return <div className={styles.loadingState} aria-busy="true">Ładowanie społeczności…</div>;
  }
  if (state.status === "error") {
    return (
      <div className={styles.errorState} role="alert">
        Nie udało się załadować społeczności: {state.message}
      </div>
    );
  }

  const profile = state.profile;

  async function handleJoin() {
    setActionError(null);
    setActionPending(true);
    const res = await communitiesMockAdapter.requestJoin(slug);
    setActionPending(false);
    if (!res.ok) {
      setActionError(res.error.message);
      return;
    }
    await refresh();
  }

  const joinLabel =
    profile.viewerRelation === "requested"
      ? "Zgłoszenie wysłane"
      : profile.visibility === "public"
        ? "Dołącz do społeczności"
        : "Poproś o dołączenie";

  const showJoin = profile.viewerRelation === "not_member" || profile.viewerRelation === "requested";
  const isMember =
    profile.viewerRelation === "founder" ||
    profile.viewerRelation === "admin" ||
    profile.viewerRelation === "moderator" ||
    profile.viewerRelation === "member";

  return (
    <section className={styles.root} aria-labelledby="community-profile-heading">
      <header className={styles.hero}>
        <div className={styles.heroText}>
          <p className={styles.kicker}>/{profile.slug}</p>
          <h1 id="community-profile-heading" className={styles.title}>{profile.name}</h1>
          <p className={styles.description}>{profile.description || "Społeczność nie dodała jeszcze opisu."}</p>
          <div className={styles.meta}>
            <span>{profile.memberCount.toLocaleString("pl-PL")} członków</span>
            <span>·</span>
            <span>{profile.visibility === "public" ? "Publiczna" : "Prywatna"}</span>
          </div>
        </div>
        <div className={styles.heroActions}>
          {profile.canManage ? (
            <Link to={`/communities/${profile.slug}/manage`} className={styles.primaryButton}>
              Zarządzaj
            </Link>
          ) : null}
          {showJoin ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleJoin}
              disabled={actionPending || profile.viewerRelation === "requested"}
            >
              {actionPending ? "Wysyłanie..." : joinLabel}
            </button>
          ) : null}
          {isMember && !profile.canManage ? (
            <span className={styles.membershipBadge}>Jesteś członkiem</span>
          ) : null}
        </div>
      </header>

      {actionError ? <p className={styles.actionError} role="alert">{actionError}</p> : null}

      <nav className={styles.subnav} aria-label="Nawigacja społeczności">
        <Link to={`/communities/${profile.slug}/hub`} className={styles.subnavLink}>
          Public Hub
        </Link>
        <Link to={`/communities/${profile.slug}/channels`} className={styles.subnavLink}>
          Kanały
        </Link>
        <button
          type="button"
          className={styles.subnavBack}
          onClick={() => navigate("/communities")}
        >
          ← Wróć do listy
        </button>
      </nav>
    </section>
  );
}
