import { useState } from "react";
import type {
  PersonalProfileView,
  ProfilePreviewKind,
  ProfileViewMode,
} from "./types";
import { publicPersonalProfile } from "./fixtures";
import { ProfileHeader } from "./sections/ProfileHeader";
import { ProfileSocialLinks } from "./sections/ProfileSocialLinks";
import { ProfilePortalCards } from "./sections/ProfilePortalCards";
import { ProfileContacts } from "./sections/ProfileContacts";
import { ProfileQuickFeed } from "./sections/ProfileQuickFeed";
import { ProfilePersonalSections } from "./sections/ProfilePersonalSections";
import { ProfileProfessionalLayer } from "./sections/ProfileProfessionalLayer";
import { ProfileMediaSheet } from "./sections/ProfileMediaSheet";
import { ProfileBioSheet } from "./sections/ProfileBioSheet";
import { ProfileTopBar } from "./sections/ProfileTopBar";
import { ProfileRuntimeBanner } from "./sections/ProfileRuntimeBanner";
import type { MediaPurpose } from "../../features-v2/media";
import { AppShell } from "../navigation/AppShell";
import { useProfileData } from "./data/useProfileData";
import layout from "./styles/profile-layout.module.css";
import header from "./styles/profile-header.module.css";

type ProfilePageProps = {
  /**
   * Override the rendered profile. Tests pass an explicit fixture; default to
   * the runtime composition (auth + identity + media) defined below.
   */
  profile?: PersonalProfileView;
};

const PREVIEW_COPY: Record<
  Exclude<ProfilePreviewKind, "none">,
  { title: string; body: string }
> = {
  friend: {
    title: "👥 Podgląd: widok znajomego",
    body: "Znajomi widzą Twój feed, status i aktywności.",
  },
  stranger: {
    title: "👤 Podgląd: widok nieznajomego",
    body: "Nieznajomi widzą tylko publiczne informacje i zawody.",
  },
};

function shareProfile(): void {
  if (typeof window === "undefined") return;
  const url = window.location.href;
  if (typeof navigator.share === "function") {
    navigator.share({ url }).catch((error: unknown) => {
      if (error instanceof Error && error.name !== "AbortError") {
        console.warn("Profile share failed", error);
      }
    });
    return;
  }
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(url)
      .catch((error: unknown) => console.warn("Profile link copy failed", error));
  }
}

export function ProfilePage({ profile: explicitProfile }: ProfilePageProps = {}) {
  const { state, reload } = useProfileData();
  const [mode, setMode] = useState<ProfileViewMode>("personal");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKind, setPreviewKind] = useState<ProfilePreviewKind>("none");
  const [mediaTarget, setMediaTarget] = useState<MediaPurpose | null>(null);
  const [bioSheetOpen, setBioSheetOpen] = useState(false);
  const [localBioOverride, setLocalBioOverride] = useState<
    string | null | undefined
  >(undefined);

  function handleSelectPreview(kind: ProfilePreviewKind) {
    setPreviewKind(kind);
    setPreviewOpen(false);
  }

  // Only a "ready" runtime state may carry owner identity. loading / anonymous /
  // empty / error MUST fall back to a non-owner public view so owner-only
  // controls (edit avatar/banner/bio, professional layer) can never activate
  // before the runtime actually confirms the viewer owns the profile.
  const runtimeProfile: PersonalProfileView =
    state.kind === "ready"
      ? state.view
      : { ...publicPersonalProfile, isOwner: false };
  const baseProfile = explicitProfile ?? runtimeProfile;
  const profile: PersonalProfileView =
    localBioOverride !== undefined
      ? { ...baseProfile, bio: localBioOverride }
      : baseProfile;

  const activePreview = previewKind !== "none" ? PREVIEW_COPY[previewKind] : null;
  const ownerUserId = state.kind === "ready" ? state.userId : null;
  const editEnabled = ownerUserId !== null && profile.isOwner;
  const mediaUserId = ownerUserId ?? "me";

  const sidebarName = profile.displayName || "Profil";
  const sidebarHandle = profile.displayName
    ? profile.displayName.toLowerCase().replace(/\s+/g, "")
    : "user";

  return (
    <AppShell
      active="profil"
      displayName={sidebarName}
      handle={sidebarHandle}
      avatarInitial={profile.avatarInitial}
    >
      <div className={layout.profileTokens}>
        <div className={layout.shell}>
          <ProfileTopBar
            editEnabled={editEnabled}
            onEditBio={() => setBioSheetOpen(true)}
          />
          <ProfileRuntimeBanner state={state} onReload={reload} />

          <ProfileHeader
            profile={profile}
            mode={mode}
            previewOpen={previewOpen}
            onTogglePreview={() => setPreviewOpen((v) => !v)}
            onSelectPreview={handleSelectPreview}
            onSelectPersonal={() => setMode("personal")}
            onSelectProfessional={() => setMode("professional")}
            onShare={shareProfile}
            onEditAvatar={editEnabled ? () => setMediaTarget("profile_avatar") : undefined}
            onEditBanner={editEnabled ? () => setMediaTarget("profile_banner") : undefined}
          />

          {activePreview ? (
            <div className={header.previewMenu} role="status">
              <p className={header.previewMenuTitle}>{activePreview.title}</p>
              <p className={header.previewBody}>{activePreview.body}</p>
              <button
                type="button"
                className={header.previewOption}
                onClick={() => setPreviewKind("none")}
              >
                Zamknij podgląd
              </button>
            </div>
          ) : null}

          <ProfileSocialLinks links={profile.socialLinks} />
          <ProfilePortalCards />

          {mode === "personal" ? (
            <>
              <ProfileContacts contacts={profile.contacts} />
              <ProfileQuickFeed items={profile.quickFeed} />
              <div className={layout.personalGrid}>
                <ProfilePersonalSections
                  presentationPostCount={profile.presentationPostCount}
                  milestoneCount={profile.milestoneCount}
                  isOwner={profile.isOwner}
                />
              </div>
            </>
          ) : (
            <div className={layout.professionalGrid}>
              <ProfileProfessionalLayer isOwner={profile.isOwner} />
            </div>
          )}
        </div>
      </div>

      {mediaTarget ? (
        <ProfileMediaSheet
          purpose={mediaTarget}
          userId={mediaUserId}
          onClose={() => setMediaTarget(null)}
        />
      ) : null}

      {bioSheetOpen && ownerUserId ? (
        <ProfileBioSheet
          userId={ownerUserId}
          currentBio={profile.bio}
          onClose={() => setBioSheetOpen(false)}
          onSaved={(bio) => {
            setLocalBioOverride(bio);
            reload();
          }}
        />
      ) : null}
    </AppShell>
  );
}
