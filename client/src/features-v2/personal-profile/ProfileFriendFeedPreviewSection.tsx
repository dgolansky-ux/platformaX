import type { PersonalProfileViewDTO } from "@shared/contracts/personal-profile-view";
import { PersonalProfileFriendFeedPreview } from "@client/features-v2/friend-feed/public-api";
import styles from "./PersonalProfilePage.module.css";

const REASON_COPY: Record<PersonalProfileViewDTO["friendFeedPreview"]["reason"], string> = {
  owner: "",
  friend: "",
  stranger: "Aby zobaczyć wpisy tej osoby, musisz być w gronie znajomych.",
  anonymous: "Zaloguj się, żeby zobaczyć podgląd feedu.",
  none: "",
};

type Props = {
  view: PersonalProfileViewDTO;
};

export function ProfileFriendFeedPreviewSection({ view }: Props) {
  if (view.friendFeedPreview.canView) {
    return (
      <PersonalProfileFriendFeedPreview
        viewerUserId={view.viewerState.viewerUserId ?? "u-viewer"}
        profileOwnerId={view.profile.userId}
      />
    );
  }
  return (
    <section className={styles.section} aria-labelledby="profile-feed-heading">
      <header className={styles.sectionHeader}>
        <h2 id="profile-feed-heading" className={styles.sectionTitle}>Wpisy znajomych</h2>
      </header>
      <p className={styles.empty}>{REASON_COPY[view.friendFeedPreview.reason]}</p>
    </section>
  );
}
