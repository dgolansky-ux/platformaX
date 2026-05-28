import { useState } from "react";
import type {
  PersonalProfileView,
  ProfilePreviewKind,
  ProfileViewMode,
} from "./types";
import { ownerPersonalProfile } from "./fixtures";
import { ProfileHeader } from "./sections/ProfileHeader";
import { ProfileSocialLinks } from "./sections/ProfileSocialLinks";
import { ProfilePortalCards } from "./sections/ProfilePortalCards";
import { ProfileContacts } from "./sections/ProfileContacts";
import { ProfileQuickFeed } from "./sections/ProfileQuickFeed";
import { ProfilePersonalSections } from "./sections/ProfilePersonalSections";
import { ProfileProfessionalLayer } from "./sections/ProfileProfessionalLayer";
import { ProfileMediaSheet } from "./containers/ProfileMediaSheet";
import { ProfileBioSheet } from "./containers/ProfileBioSheet";
import { ProfileTopBar } from "./sections/ProfileTopBar";
import { ProfileRuntimeBanner } from "./sections/ProfileRuntimeBanner";
import type { MediaPurpose } from "../../features-v2/media";
import { FloatingNav } from "../navigation/FloatingNav";
import { DesktopSidebar } from "../navigation/DesktopSidebar";
import { useProfileData, type UseProfileDataDeps } from "./data/useProfileData";
import layout from "./styles/profile-layout.module.css";
import header from "./styles/profile-header.module.css";

type ProfilePageProps = {
  /**
   * Override the rendered profile. Tests pass an explicit fixture; default to
   * the runtime composition (auth + identity + media) defined below.
   */
  profile?: PersonalProfileView;
  /**
   * Test seam: inject auth + profile adapters so tests can drive the data
   * state machine into "ready" (or any other state) deterministically without
   * touching the real runtime adapters.
   */
  dataDeps?: UseProfileDataDeps;
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

export function ProfilePage({
  profile: explicitProfile,
  dataDeps,
}: ProfilePageProps = {}) {
  const { state, reload } = useProfileData(dataDeps);
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

  const runtimeProfile =
    state.kind === "ready" ? state.view : ownerPersonalProfile;
  const baseProfile = explicitProfile ?? runtimeProfile;
  const profile: PersonalProfileView =
    localBioOverride !== undefined
      ? { ...baseProfile, bio: localBioOverride }
      : baseProfile;

  const activePreview = previewKind !== "none" ? PREVIEW_COPY[previewKind] : null;
  const ownerUserId = state.kind === "ready" ? state.userId : null;
  // Owner edit affordances must only activate when the runtime has resolved an
  // authenticated owner. Anonymous/loading renders the visual shell (fixture
  // `isOwner: true` carries no privilege), but never wires owner controls.
  const canEditProfile =
    state.kind === "ready" && ownerUserId !== null && profile.isOwner;

  const sidebarName = profile.displayName || "Profil";
  const sidebarHandle = profile.displayName
    ? profile.displayName.toLowerCase().replace(/\s+/g, "")
    : "user";

  return (
    <div className={layout.page}>
      <DesktopSidebar
        active="profil"
        displayName={sidebarName}
        handle={sidebarHandle}
        avatarInitial={profile.avatarInitial}
        online
      />
      <div className={layout.shell}>
        <ProfileTopBar
          editEnabled={canEditProfile}
          onEditBio={() => setBioSheetOpen(true)}
        />
        <ProfileRuntimeBanner state={state} onReload={reload} />

        <main>
          <ProfileHeader
            profile={profile}
            mode={mode}
            previewOpen={previewOpen}
            canEditProfile={canEditProfile}
            onTogglePreview={() => setPreviewOpen((v) => !v)}
            onSelectPreview={handleSelectPreview}
            onSelectPersonal={() => setMode("personal")}
            onSelectProfessional={() => setMode("professional")}
            onShare={shareProfile}
            onEditAvatar={canEditProfile ? () => setMediaTarget("avatar") : undefined}
            onEditBanner={canEditProfile ? () => setMediaTarget("banner") : undefined}
          />

          {activePreview && canEditProfile ? (
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
                  canEdit={canEditProfile}
                />
              </div>
            </>
          ) : (
            <div className={layout.professionalGrid}>
              <ProfileProfessionalLayer canEdit={canEditProfile} />
            </div>
          )}
        </main>
      </div>

      <FloatingNav active="profil" />

      {mediaTarget && ownerUserId ? (
        <ProfileMediaSheet
          purpose={mediaTarget}
          userId={ownerUserId}
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
    </div>
  );
}
