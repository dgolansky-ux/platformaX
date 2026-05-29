/**
 * features-v2/communities-v2 / CommunityProfileShell
 *
 * Public community profile screen. Composes hero + breadcrumb + viewer-state
 * driven join/request/cancel/leave CTAs. UI_SHELL_ONLY + MOCK_LOCAL_ONLY (no
 * `@server/*` imports, no HTTP transport yet). Visual layout follows the
 * legacy CommunityDetail page (banner + avatar with orbit ring + Crown for
 * the owner + visibility/member chips); legacy runtime (tRPC, inline image
 * uploads, StaffDrawer, MembersCarousel, localStorage banner) is intentionally
 * NOT carried over.
 */
import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { CommunityProfileViewDTO } from "@shared/contracts/communities-viewer";
import { communitiesMockAdapter } from "./mock-adapter";
import { CommunityProfileHero } from "./profile/CommunityProfileHero";
import { CommunityProfileBreadcrumb } from "./profile/CommunityProfileBreadcrumb";
import { CommunityJoinCTA } from "./profile/CommunityJoinCTA";
import styles from "./CommunityProfile.module.css";

type CommunityProfileShellProps = { slug: string };

type LoadState =
  | { status: "loading" }
  | { status: "not_found" }
  | { status: "error"; message: string }
  | { status: "ready"; view: CommunityProfileViewDTO };

type ProfileAction = "join" | "request" | "cancel" | "leave";

export function CommunityProfileShell({ slug }: CommunityProfileShellProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionPending, setActionPending] = useState(false);

  const load = useCallback(async () => {
    const res = await communitiesMockAdapter.getCommunityProfileView(slug);
    if (!res.ok) {
      setState(res.error.code === "NOT_FOUND" ? { status: "not_found" } : { status: "error", message: res.error.message });
      return;
    }
    setState({ status: "ready", view: res.value });
  }, [slug]);

  useEffect(() => {
    let alive = true;
    setState({ status: "loading" });
    void (async () => {
      const res = await communitiesMockAdapter.getCommunityProfileView(slug);
      if (!alive) return;
      if (!res.ok) {
        setState(res.error.code === "NOT_FOUND" ? { status: "not_found" } : { status: "error", message: res.error.message });
      } else {
        setState({ status: "ready", view: res.value });
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  const run = useCallback(
    async (action: ProfileAction) => {
      setActionError(null);
      setActionPending(true);
      const adapter = communitiesMockAdapter;
      const result =
        action === "join" ? await adapter.joinCommunity(slug)
        : action === "request" ? await adapter.requestJoin(slug)
        : action === "cancel" ? await adapter.cancelJoinRequest(slug)
        : await adapter.leaveCommunity(slug);
      setActionPending(false);
      if (!result.ok) {
        setActionError(result.error.message);
        return;
      }
      await load();
    },
    [slug, load],
  );

  if (state.status === "loading") {
    return (
      <div className={styles.root}>
        <div className={styles.loadingState} aria-busy="true">Ładowanie społeczności…</div>
      </div>
    );
  }
  if (state.status === "not_found") {
    return (
      <div className={styles.root}>
        <div className={styles.notFoundState} role="status">
          <p>Społeczność nie istnieje.</p>
          <Link to="/communities" className={styles.subnavLink}>Wróć do listy</Link>
        </div>
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <div className={styles.root}>
        <div className={styles.errorState} role="alert">
          Nie udało się załadować społeczności: {state.message}
        </div>
      </div>
    );
  }

  const { profile, viewer } = state.view;
  const hideHubSection = !viewer.canViewPrivateSections;

  return (
    <div className={styles.root}>
      <CommunityProfileBreadcrumb communityName={profile.name} />
      <div className={styles.hero}>
        <CommunityProfileHero profile={profile} viewer={viewer} onBack={() => navigate("/communities")} />
        {actionError ? <p className={styles.actionError} role="alert">{actionError}</p> : null}
        <CommunityJoinCTA
          profile={profile}
          viewer={viewer}
          pending={actionPending}
          onJoin={() => void run("join")}
          onRequestJoin={() => void run("request")}
          onCancelRequest={() => void run("cancel")}
          onLeave={() => void run("leave")}
        />
        {hideHubSection ? (
          <p className={styles.restrictedNote}>
            🔒 Treści tej prywatnej społeczności są widoczne wyłącznie dla członków.
          </p>
        ) : null}
      </div>
      <nav className={styles.subnav} aria-label="Nawigacja społeczności">
        {viewer.canViewPrivateSections ? (
          <>
            <Link to={`/communities/${profile.slug}/structure`} className={styles.subnavLink}>Struktura</Link>
            <Link to={`/communities/${profile.slug}/hub`} className={styles.subnavLink}>Public Hub</Link>
            <Link to={`/communities/${profile.slug}/channels`} className={styles.subnavLink}>Kanały</Link>
          </>
        ) : null}
        <button type="button" className={styles.subnavBack} onClick={() => navigate("/communities")}>
          ← Wróć do listy
        </button>
      </nav>
    </div>
  );
}
