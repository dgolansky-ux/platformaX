import { useMemo } from "react";
import {
  ImportantEventComposer,
  ProfilePresentationComposer,
  createPublishingMockAdapter,
  type PublishingTargetDefinitionUi,
} from "../publishing";
import { PostEmptyState } from "../content-display";
import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import styles from "./PersonalProfilePage.module.css";

type Props = {
  view: PersonalProfileViewDTO;
};

function profileTargets(profileOwnerUserId: string): readonly PublishingTargetDefinitionUi[] {
  return [
    {
      targetType: "important_event",
      targetId: profileOwnerUserId,
      label: "Ważne wydarzenie",
      description: "Specjalna karta na profilu osobistym.",
      allowedContentTypes: ["important_event"],
      allowedMediaTypes: ["image", "link"],
      visibilityOptions: ["public", "friends_only", "private"],
      defaultVisibility: "public",
      maxBodyLength: 4000,
      maxMediaCount: 4,
      permissionsRequired: ["profile_owner"],
      status: "partial",
      blockedReason: "backend_not_ready_v2",
      routeTarget: `/profile/${profileOwnerUserId}/important-events`,
    },
    {
      targetType: "profile_presentation",
      targetId: profileOwnerUserId,
      label: "Prezentacja profilu",
      description: "Edytorska sekcja profilu osobistego.",
      allowedContentTypes: ["profile_presentation_item"],
      allowedMediaTypes: ["image", "video", "document", "link"],
      visibilityOptions: ["public", "friends_only", "private", "profile_owner_chosen"],
      defaultVisibility: "public",
      maxBodyLength: 6000,
      maxMediaCount: 6,
      permissionsRequired: ["profile_owner"],
      status: "partial",
      blockedReason: "backend_not_ready_v2",
      routeTarget: `/profile/${profileOwnerUserId}/presentation`,
    },
  ];
}

export function ProfilePublishingSections({ view }: Props) {
  const viewerUserId = view.viewerState.viewerUserId;
  const isOwner = view.viewerState.canEditProfile && viewerUserId !== null;
  const targets = useMemo(() => profileTargets(view.profile.userId), [view.profile.userId]);
  const adapter = useMemo(() => createPublishingMockAdapter({ targets }), [targets]);
  const importantEventTarget = targets[0];
  const presentationTarget = targets[1];

  return (
    <section className={styles.section} aria-labelledby="profile-publishing-title">
      <header className={styles.sectionHeader}>
        <div>
          <h2 id="profile-publishing-title" className={styles.sectionTitle}>Ważne wydarzenia i prezentacja</h2>
          <p className={styles.sectionSubtitle}>
            Profil osobisty używa tego samego publishing UI i post display kit co pozostałe feedy.
          </p>
        </div>
      </header>

      <div className={styles.profilePublishingGrid}>
        <div className={styles.profilePublishingColumn}>
          <h3 className={styles.profilePublishingTitle}>Ważne wydarzenia</h3>
          {isOwner ? (
            <ImportantEventComposer
              viewerUserId={viewerUserId}
              adapter={adapter}
              availableTargets={targets}
              importantEventTarget={importantEventTarget}
            />
          ) : (
            <PostEmptyState message="Ten profil nie ma jeszcze publicznych ważnych wydarzeń." />
          )}
        </div>

        <div className={styles.profilePublishingColumn}>
          <h3 className={styles.profilePublishingTitle}>Prezentacja profilu</h3>
          {isOwner ? (
            <ProfilePresentationComposer
              viewerUserId={viewerUserId}
              adapter={adapter}
              availableTargets={targets}
              presentationTarget={presentationTarget}
            />
          ) : (
            <PostEmptyState message="Ten profil nie ma jeszcze publicznej prezentacji." />
          )}
        </div>
      </div>
    </section>
  );
}
