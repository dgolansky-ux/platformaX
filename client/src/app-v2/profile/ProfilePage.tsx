import { useState } from "react";
import { Link } from "react-router-dom";
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
import { FloatingNav } from "../navigation/FloatingNav";
import layout from "./styles/profile-layout.module.css";
import header from "./styles/profile-header.module.css";

type ProfilePageProps = {
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

export function ProfilePage({ profile = ownerPersonalProfile }: ProfilePageProps = {}) {
  const [mode, setMode] = useState<ProfileViewMode>("personal");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewKind, setPreviewKind] = useState<ProfilePreviewKind>("none");

  function handleSelectPreview(kind: ProfilePreviewKind) {
    setPreviewKind(kind);
    setPreviewOpen(false);
  }

  const activePreview = previewKind !== "none" ? PREVIEW_COPY[previewKind] : null;

  return (
    <div className={layout.page}>
      <div className={layout.shell}>
        <div className={layout.topbar}>
          <span className={layout.topbarBrand}>PlatformaX</span>
          <div className={layout.topbarActions}>
            <Link to="/" className={layout.iconButton} aria-label="Strona główna">
              ←
            </Link>
            <button
              type="button"
              className={layout.iconButton}
              aria-label="Edytuj profil — wkrótce"
              title="Edycja profilu będzie dostępna po podłączeniu backendu identity"
              disabled
            >
              ✎
            </button>
          </div>
        </div>

        <main>
          <ProfileHeader
            profile={profile}
            mode={mode}
            previewOpen={previewOpen}
            onTogglePreview={() => setPreviewOpen((v) => !v)}
            onSelectPreview={handleSelectPreview}
            onSelectPersonal={() => setMode("personal")}
            onSelectProfessional={() => setMode("professional")}
            onShare={shareProfile}
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
        </main>
      </div>

      <FloatingNav active="profil" />
    </div>
  );
}
