/**
 * features-v2/communities-v2 / CommunityManageShell — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY founder/admin management screen.
 *
 * Composes three live panels (settings, members, join requests) and link
 * tiles to modules/channels/hub. Logic lives in this shell; presentational
 * pieces are split into ./manage/* to keep this file under the structural
 * size budget. No `@server/*` imports.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  CommunityJoinRequestSummaryDTO,
  CommunityMemberSummaryDTO,
  CommunityProfileDTO,
  CommunityRole,
} from "@shared/contracts/communities";
import { communitiesMockAdapter } from "./mock-adapter";
import { JoinRequestsPanel } from "./manage/JoinRequestsPanel";
import { MembersPanel } from "./manage/MembersPanel";
import { SettingsPanel } from "./manage/SettingsPanel";
import styles from "./CommunityManage.module.css";

type CommunityManageShellProps = { slug: string };

type ManageData = {
  profile: CommunityProfileDTO;
  members: CommunityMemberSummaryDTO[];
  requests: CommunityJoinRequestSummaryDTO[];
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "ready"; data: ManageData };

export function CommunityManageShell({ slug }: CommunityManageShellProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const profileRes = await communitiesMockAdapter.getCommunityProfile(slug);
    if (!profileRes.ok) {
      setState({ status: "error", message: profileRes.error.message });
      return;
    }
    if (!profileRes.value.canManage) {
      setState({ status: "forbidden", message: "Tylko founder/admin może zarządzać tą społecznością." });
      return;
    }
    const [membersRes, requestsRes] = await Promise.all([
      communitiesMockAdapter.listMembers(slug),
      communitiesMockAdapter.listPendingJoinRequests(slug),
    ]);
    if (!membersRes.ok) return setState({ status: "error", message: membersRes.error.message });
    if (!requestsRes.ok) return setState({ status: "error", message: requestsRes.error.message });
    setState({
      status: "ready",
      data: { profile: profileRes.value, members: membersRes.value, requests: requestsRes.value },
    });
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (state.status === "loading") {
    return <div className={styles.loadingState} aria-busy="true">Ładowanie zarządzania…</div>;
  }
  if (state.status === "error") return <div className={styles.errorState} role="alert">{state.message}</div>;
  if (state.status === "forbidden") {
    return (
      <div className={styles.forbiddenState} role="alert">
        <h2>Brak uprawnień</h2>
        <p>{state.message}</p>
        <Link to={`/communities/${slug}`} className={styles.backButton}>← Wróć do profilu</Link>
      </div>
    );
  }

  const { profile, members, requests } = state.data;

  const handleSettingsSubmit = async (input: { name?: string; description?: string; visibility?: "public" | "private" }) => {
    setActionError(null);
    const res = await communitiesMockAdapter.updateSettings({ slug, ...input });
    if (!res.ok) setActionError(res.error.message);
    await load();
  };

  const handleAcceptRequest = async (requestId: string) => {
    setActionError(null);
    const res = await communitiesMockAdapter.acceptJoinRequest({ communitySlug: slug, joinRequestId: requestId });
    if (!res.ok) setActionError(res.error.message);
    await load();
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionError(null);
    const res = await communitiesMockAdapter.rejectJoinRequest({ communitySlug: slug, joinRequestId: requestId });
    if (!res.ok) setActionError(res.error.message);
    await load();
  };

  const handleRoleChange = async (targetUserId: string, nextRole: Exclude<CommunityRole, "founder">) => {
    setActionError(null);
    const res = await communitiesMockAdapter.changeMemberRole({ communitySlug: slug, targetUserId, nextRole });
    if (!res.ok) setActionError(res.error.message);
    await load();
  };

  return (
    <section className={styles.root} aria-labelledby="manage-heading">
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Zarządzanie społecznością</p>
          <h1 id="manage-heading" className={styles.title}>{profile.name}</h1>
          <p className={styles.subtitle}>
            /{profile.slug} · {profile.visibility === "public" ? "Publiczna" : "Prywatna"}
          </p>
        </div>
        <Link to={`/communities/${slug}`} className={styles.backButton}>← Wróć do profilu</Link>
      </header>

      {actionError ? <p className={styles.actionError} role="alert">{actionError}</p> : null}

      <SettingsPanel profile={profile} onSubmit={handleSettingsSubmit} />

      <div className={styles.tilesRow}>
        <Link to={`/communities/${slug}/manage/modules`} className={styles.tile}>
          <h3>Moduły</h3>
          <p>Włącz lub wyłącz dostępne moduły społeczności.</p>
        </Link>
        <Link to={`/communities/${slug}/channels`} className={styles.tile}>
          <h3>Kanały</h3>
          <p>Zarządzaj kanałami i ich widocznością.</p>
        </Link>
        <Link to={`/communities/${slug}/hub`} className={styles.tile}>
          <h3>Public Hub</h3>
          <p>Zobacz publiczną kompozycję społeczności.</p>
        </Link>
      </div>

      <JoinRequestsPanel requests={requests} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />
      <MembersPanel members={members} onChangeRole={handleRoleChange} />
    </section>
  );
}
