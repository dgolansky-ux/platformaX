/**
 * features-v2/communities-v2 / CommunityManageShell — UI_SHELL_ONLY +
 * MOCK_LOCAL_ONLY founder/admin management screen.
 *
 * Slice 3 composes a tabbed manage view (Ustawienia / Członkowie / Prośby /
 * Zaproszenia / Strefa niebezpieczna). Visual layout mirrors the legacy
 * `pages/CommunityDetailSettings.tsx` + `CommunityMembersPanel`; legacy
 * runtime (tRPC mutations, toasts, blocking native confirms, MembersCarousel,
 * ban action, Stripe/Modules settings, inline image uploads) is intentionally
 * not carried over. No `@server/*` imports.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type {
  CommunityProfileDTO,
  CommunityRole,
} from "@shared/contracts/communities";
import type { CommunityManageViewDTO } from "@shared/contracts/communities-viewer";
import { communitiesMockAdapter } from "./mock-adapter";
import { DangerZone } from "./manage/DangerZone";
import { InvitesPanel } from "./manage/InvitesPanel";
import { JoinRequestsPanel } from "./manage/JoinRequestsPanel";
import { MembersPanel } from "./manage/MembersPanel";
import { SettingsPanel } from "./manage/SettingsPanel";
import styles from "./CommunityManage.module.css";

type CommunityManageShellProps = { slug: string };

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "forbidden"; message: string }
  | { status: "ready"; view: CommunityManageViewDTO };

type TabKey = "settings" | "members" | "requests" | "invites" | "danger";

const TABS: ReadonlyArray<{ key: TabKey; label: string }> = [
  { key: "settings", label: "Ustawienia" },
  { key: "members", label: "Członkowie" },
  { key: "requests", label: "Prośby" },
  { key: "invites", label: "Zaproszenia" },
  { key: "danger", label: "Strefa niebezpieczna" },
];

export function CommunityManageShell({ slug }: CommunityManageShellProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("settings");

  const load = useCallback(async () => {
    const res = await communitiesMockAdapter.getCommunityManageView(slug);
    if (!res.ok) {
      if (res.error.code === "FORBIDDEN") {
        setState({ status: "forbidden", message: res.error.message });
      } else {
        setState({ status: "error", message: res.error.message });
      }
      return;
    }
    setState({ status: "ready", view: res.value });
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

  const { profile, viewer, members, joinRequests, invites } = state.view;

  const wrap = async (op: () => Promise<{ ok: boolean; error?: { message: string } }>) => {
    setActionError(null);
    const res = await op();
    if (!res.ok && res.error) setActionError(res.error.message);
    await load();
  };

  const onSettings = (input: { name?: string; description?: string; visibility?: "public" | "private" }) =>
    wrap(() => communitiesMockAdapter.updateSettings({ slug, ...input }));
  const onAccept = (id: string) =>
    wrap(() => communitiesMockAdapter.acceptJoinRequest({ communitySlug: slug, joinRequestId: id }));
  const onReject = (id: string) =>
    wrap(() => communitiesMockAdapter.rejectJoinRequest({ communitySlug: slug, joinRequestId: id }));
  const onRoleChange = (targetUserId: string, nextRole: Exclude<CommunityRole, "founder">) =>
    wrap(() => communitiesMockAdapter.changeMemberRole({ communitySlug: slug, targetUserId, nextRole }));
  const onRemoveMember = (targetUserId: string) =>
    wrap(() => communitiesMockAdapter.removeMember(slug, targetUserId));
  const onCreateInvite = (input: { invitedUserId?: string; invitedEmail?: string }) =>
    wrap(() => communitiesMockAdapter.createInvite({ slug, ...input }));
  const onCancelInvite = (inviteId: string) =>
    wrap(() => communitiesMockAdapter.cancelInvite(slug, inviteId));

  return (
    <section className={styles.root} aria-labelledby="manage-heading">
      <ManageHero profile={profile} slug={slug} />
      {actionError ? <p className={styles.actionError} role="alert">{actionError}</p> : null}
      <div className={styles.tabs} role="tablist" aria-label="Sekcje zarządzania">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            id={`manage-tab-${tab.key}`}
            aria-selected={activeTab === tab.key}
            aria-controls={`manage-panel-${tab.key}`}
            type="button"
            className={`${styles.tabButton} ${activeTab === tab.key ? styles.tabActive : ""}`.trim()}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`manage-panel-${activeTab}`} aria-labelledby={`manage-tab-${activeTab}`}>
        {activeTab === "settings" ? <SettingsPanel profile={profile} onSubmit={onSettings} /> : null}
        {activeTab === "members" ? (
          <MembersPanel
            members={members}
            viewerUserId={viewer.viewerUserId ?? ""}
            viewerRole={(viewer.relation === "founder" || viewer.relation === "admin" || viewer.relation === "moderator" || viewer.relation === "member") ? viewer.relation : null}
            onChangeRole={onRoleChange}
            onRemove={onRemoveMember}
          />
        ) : null}
        {activeTab === "requests" ? (
          <JoinRequestsPanel requests={joinRequests} onAccept={onAccept} onReject={onReject} />
        ) : null}
        {activeTab === "invites" ? (
          <InvitesPanel invites={invites} onCreate={onCreateInvite} onCancel={onCancelInvite} />
        ) : null}
        {activeTab === "danger" ? <DangerZone communityName={profile.name} /> : null}
      </div>
    </section>
  );
}

function ManageHero({ profile, slug }: { profile: CommunityProfileDTO; slug: string }) {
  return (
    <header className={styles.hero}>
      <div>
        <p className={styles.kicker}>Zarządzanie społecznością</p>
        <h1 id="manage-heading" className={styles.title}>{profile.name}</h1>
        <p className={styles.subtitle}>
          /{profile.slug} · {profile.visibility === "public" ? "Publiczna" : "Prywatna"}
        </p>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link to={`/communities/${slug}/structure`} className={styles.backButton}>Struktura →</Link>
        <Link to={`/communities/${slug}`} className={styles.backButton}>← Wróć do profilu</Link>
      </div>
    </header>
  );
}
