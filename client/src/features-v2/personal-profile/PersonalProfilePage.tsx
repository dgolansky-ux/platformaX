/**
 * features-v2/personal-profile / PersonalProfilePage — unified owner/viewer
 * profile screen at `/profile/:username`.
 *
 * Status: UI_SHELL_ONLY + MOCK_LOCAL_ONLY. Reads `PersonalProfileViewDTO`
 * from the mock adapter; no `@server/*` imports. The same component renders
 * every viewer relation — owner / friend / stranger / pending /
 * contact_approved / unauthenticated — and per-section permissions decide
 * what is rendered. Owner controls are subtle pills inside the hero; viewer
 * actions live where users expect them.
 */
import { useCallback, useEffect, useState } from "react";
import type {
  PersonalProfileViewDTO,
  PersonalProfileViewError,
} from "@shared/contracts/personal-profile-view";
import { personalProfileMockAdapter } from "./mock-adapter";
import { PersonalProfileHero } from "./PersonalProfileHero";
import { ProfileContactPanel } from "./ProfileContactPanel";
import { ProfileWorkplacesSection } from "./ProfileWorkplacesSection";
import { ProfilePublicHubSection } from "./ProfilePublicHubSection";
import { ProfileChannelsEntry } from "./ProfileChannelsEntry";
import { ProfileFriendFeedPreviewSection } from "./ProfileFriendFeedPreviewSection";
import { ProfilePublishingSections } from "./ProfilePublishingSections";
import styles from "./PersonalProfilePage.module.css";

type Props = {
  viewerUserId: string | null;
  profileUsername: string;
  onNavigate?: (route: string) => void;
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; error: PersonalProfileViewError }
  | { status: "ready"; view: PersonalProfileViewDTO };

function navigateTo(route: string, onNavigate?: (route: string) => void): void {
  if (onNavigate) onNavigate(route);
  else if (typeof window !== "undefined") window.location.assign(route);
}

export function PersonalProfilePage({ viewerUserId, profileUsername, onNavigate }: Props) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  const load = useCallback(async (): Promise<void> => {
    setState({ status: "loading" });
    const res = await personalProfileMockAdapter.getPersonalProfileView(viewerUserId, profileUsername);
    if (res.ok) setState({ status: "ready", view: res.value });
    else setState({ status: "error", error: res.error });
  }, [viewerUserId, profileUsername]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSendFriendRequest = useCallback(async (): Promise<void> => {
    if (state.status !== "ready" || viewerUserId === null) return;
    const ownerId = state.view.profile.userId;
    const res = await personalProfileMockAdapter.sendFriendRequestFromProfile(viewerUserId, ownerId);
    if (res.ok) setState({ status: "ready", view: res.value });
  }, [state, viewerUserId]);

  const handleAcceptFriendRequest = useCallback(async (): Promise<void> => {
    if (state.status !== "ready" || viewerUserId === null) return;
    const pending = state.view.relationActions.pendingFriendRequestId;
    if (!pending) return;
    const res = await personalProfileMockAdapter.acceptFriendRequestFromProfile(viewerUserId, pending);
    if (res.ok) setState({ status: "ready", view: res.value });
  }, [state, viewerUserId]);

  const handleRequestContactAccess = useCallback(async (): Promise<void> => {
    if (state.status !== "ready" || viewerUserId === null) return;
    const ownerId = state.view.profile.userId;
    const res = await personalProfileMockAdapter.requestProfileContactAccess(
      viewerUserId,
      ownerId,
      "Cześć! Czy mogę poprosić o Twój kontakt?",
    );
    if (res.ok) setState({ status: "ready", view: res.value });
  }, [state, viewerUserId]);

  if (state.status === "loading") {
    return (
      <section className={styles.root}>
        <div className={styles.loadingState} aria-busy="true">Ładuję profil…</div>
      </section>
    );
  }
  if (state.status === "error") {
    const errClass = state.error.code === "PROFILE_NOT_FOUND" ? styles.notFoundState : styles.restrictedState;
    return (
      <section className={styles.root}>
        <div className={errClass} role="status" data-testid="profile-error-state" data-code={state.error.code}>
          {state.error.message}
        </div>
      </section>
    );
  }

  const view = state.view;
  return (
    <section className={styles.root} data-testid="personal-profile-page">
      <PersonalProfileHero
        view={view}
        onEditAvatar={() => navigateTo("/profile", onNavigate)}
        onEditBanner={() => navigateTo("/profile", onNavigate)}
        onEditBio={() => navigateTo("/profile", onNavigate)}
        onManageProfile={() => navigateTo("/profile", onNavigate)}
        onSendFriendRequest={() => void handleSendFriendRequest()}
        onAcceptFriendRequest={() => void handleAcceptFriendRequest()}
        onRequestContactAccess={() => void handleRequestContactAccess()}
      />
      <ProfileContactPanel
        view={view}
        onRequestContactAccess={() => void handleRequestContactAccess()}
      />
      <ProfileWorkplacesSection
        view={view}
        onAddWorkplace={() => navigateTo("/manage/profile/workplaces/new", onNavigate)}
      />
      <ProfilePublicHubSection
        view={view}
        onManageModules={() => navigateTo("/manage/profil-osobisty", onNavigate)}
      />
      <ProfilePublishingSections view={view} />
      <ProfileChannelsEntry
        view={view}
        onOpenChannels={() => navigateTo(view.channelsEntry.targetRoute, onNavigate)}
      />
      <ProfileFriendFeedPreviewSection view={view} />
    </section>
  );
}
